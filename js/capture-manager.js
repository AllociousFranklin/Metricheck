/**
 * CaptureManager - Handles automatic image capture, perceptual dedup, and dataset management
 */
import { computeDHash, isDuplicate, getMinHammingDistance } from './perceptual-hash.js';

export class CaptureManager {
  constructor(camera, config) {
    this.camera = camera;
    this.config = config;

    this.capturedViews = [];
    this.savedHashes = [];
    this.lastCaptureTimestamp = 0;
    this.isCapturing = false;
    this.isCompleted = false;

    this.onCaptureCallback = null;
    this.onCompleteCallback = null;
  }

  /**
   * Main frame evaluation step called on each processed frame
   * @param {Object} detection - Detection result from CV Worker
   * @param {Object} trackerState - State from MotionTracker
   * @param {Object} qualityReport - Output from QualityScorer
   */
  async evaluateAndCapture(detection, trackerState, qualityReport) {
    if (this.isCompleted || this.isCapturing) return false;

    // Check safety upper bound (e.g. 12 max views)
    const maxViews = this.config.MAX_VIEWS || 12;
    if (this.capturedViews.length >= maxViews) {
      this.isCompleted = true;
      if (this.onCompleteCallback) this.onCompleteCallback(this.capturedViews);
      return false;
    }

    // Check cooldown period
    const now = performance.now();
    if (now - this.lastCaptureTimestamp < this.config.CAPTURE_COOLDOWN_MS) {
      return false;
    }

    // Check quality acceptability (must be sharp, good lighting, properly sized, and stable)
    if (!qualityReport || !qualityReport.isAcceptable) {
      return false;
    }

    // Initiate High-Res Capture Sequence
    this.isCapturing = true;

    try {
      // 1. Capture full resolution still frame from camera hardware
      const highResCanvas = await this.camera.captureHighResFrame();

      // 2. Crop to detected package bbox for accurate perceptual hashing.
      //    Scale bbox from processing resolution (480×360) to high-res capture resolution.
      const procW = this.config.PROCESSING_WIDTH;
      const procH = this.config.PROCESSING_HEIGHT;
      const scaleX = highResCanvas.width / procW;
      const scaleY = highResCanvas.height / procH;

      let hashSource = highResCanvas; // fallback to full frame if no bbox
      if (detection && detection.bbox) {
        const b = detection.bbox;
        const pad = 0.05; // 5% padding
        const sx = Math.max(0, Math.round((b.x - b.width * pad) * scaleX));
        const sy = Math.max(0, Math.round((b.y - b.height * pad) * scaleY));
        const sw = Math.min(highResCanvas.width - sx, Math.round(b.width * (1 + pad * 2) * scaleX));
        const sh = Math.min(highResCanvas.height - sy, Math.round(b.height * (1 + pad * 2) * scaleY));

        if (sw > 10 && sh > 10) {
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = sw;
          cropCanvas.height = sh;
          const cropCtx = cropCanvas.getContext('2d');
          cropCtx.drawImage(highResCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
          hashSource = cropCanvas;
        }
      }

      // 3. Compute candidate perceptual dHash on CROPPED package region
      const candidateHash = computeDHash(hashSource);

      // 4. Deduplication Check against previously captured views
      const duplicate = isDuplicate(candidateHash, this.savedHashes, this.config.HASH_SIMILARITY_THRESHOLD);
      const minDistance = getMinHammingDistance(candidateHash, this.savedHashes);

      if (duplicate) {
        console.log(`Duplicate view rejected (Hamming distance: ${minDistance} <= ${this.config.HASH_SIMILARITY_THRESHOLD})`);
        this.isCapturing = false;
        return false;
      }

      // 5. Clean New View Accepted!
      this.lastCaptureTimestamp = performance.now();
      this.savedHashes.push(candidateHash);

      // Create thumbnail for fast UI display
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 160;
      thumbCanvas.height = 160;
      const thumbCtx = thumbCanvas.getContext('2d');
      thumbCtx.drawImage(highResCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.85);

      // Export high-res image blob
      const highResBlob = await new Promise(resolve => highResCanvas.toBlob(resolve, 'image/jpeg', 0.92));

      const viewRecord = {
        id: this.capturedViews.length + 1,
        hash: candidateHash,
        hammingDistanceToPrevious: minDistance,
        thumbnailUrl,
        blob: highResBlob,
        canvas: highResCanvas,
        metrics: { ...qualityReport.rawMetrics },
        timestamp: new Date().toISOString()
      };

      this.capturedViews.push(viewRecord);
      console.log(`Captured View #${viewRecord.id}! Total distinct views: ${this.capturedViews.length}`);

      if (this.onCaptureCallback) {
        this.onCaptureCallback(viewRecord, this.capturedViews.length, this.config.SUGGESTED_VIEWS || 4);
      }

      this.isCapturing = false;
      return true;
    } catch (err) {
      console.error('Error during auto-capture pipeline:', err);
      this.isCapturing = false;
      return false;
    }
  }

  /**
   * User manually signals scan completion
   */
  finish() {
    this.isCompleted = true;
    if (this.onCompleteCallback) {
      this.onCompleteCallback(this.capturedViews);
    }
    return this.capturedViews;
  }

  onCapture(cb) {
    this.onCaptureCallback = cb;
  }

  onComplete(cb) {
    this.onCompleteCallback = cb;
  }

  getCapturedViews() {
    return this.capturedViews;
  }

  getViewCount() {
    return this.capturedViews.length;
  }

  isDone() {
    return this.isCompleted;
  }

  /**
   * Downloads all captured views as separate clean JPEG image files
   */
  downloadAll() {
    this.capturedViews.forEach((view, idx) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(view.blob);
      link.download = `package_view_${idx + 1}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  reset() {
    this.capturedViews = [];
    this.savedHashes = [];
    this.lastCaptureTimestamp = 0;
    this.isCapturing = false;
    this.isCompleted = false;
  }
}
