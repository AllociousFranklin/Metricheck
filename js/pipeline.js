/**
 * FramePipeline - Manages frame capture loop, worker messaging, and backpressure
 */
export class FramePipeline {
  constructor(videoElement, workerPath, config) {
    this.video = videoElement;
    this.workerPath = workerPath;
    this.config = config;

    this.worker = null;
    this.isProcessing = false;
    this.isRunning = false;
    this.callback = null;
    this.readyCallback = null;
    this.errorCallback = null;
    this.rVfcHandle = null;
    this.isCvReady = false;

    this.fpsCount = 0;
    this.fpsLastTime = performance.now();
    this.currentFps = 0;

    this.initWorker();
  }

  initWorker() {
    this.worker = new Worker(this.workerPath);

    // Timeout: if CV engine doesn't load within 15s, fire error
    this._cvLoadTimeout = setTimeout(() => {
      if (!this.isCvReady) {
        console.warn('OpenCV.js load timeout — running in fallback mode');
        if (this.errorCallback) this.errorCallback('OpenCV.js failed to load within 15 seconds. Detection is limited.');
      }
    }, 15000);

    this.worker.onmessage = (e) => {
      const { type } = e.data;

      if (type === 'CV_READY') {
        this.isCvReady = true;
        clearTimeout(this._cvLoadTimeout);
        console.log('CV Worker engine ready');
        if (this.readyCallback) this.readyCallback();
      } else if (type === 'CV_ERROR') {
        console.error('CV Worker error:', e.data.error);
        if (this.errorCallback) this.errorCallback(e.data.error);
      } else if (type === 'FRAME_RESULT') {
        this.isProcessing = false; // Release backpressure

        // Calculate processing FPS
        this.fpsCount++;
        const now = performance.now();
        if (now - this.fpsLastTime >= 1000) {
          this.currentFps = Math.round((this.fpsCount * 1000) / (now - this.fpsLastTime));
          this.fpsCount = 0;
          this.fpsLastTime = now;
        }

        if (this.callback && this.isRunning) {
          this.callback({
            ...e.data,
            procW: this.currentProcW || this.config.PROCESSING_WIDTH || 480,
            procH: this.currentProcH || this.config.PROCESSING_HEIGHT || 360
          });
        }
      }
    };

    this.worker.onerror = (err) => {
      console.error('Web Worker general error:', err);
      this.isProcessing = false;
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextFrame();
  }

  scheduleNextFrame() {
    if (!this.isRunning) return;

    if ('requestVideoFrameCallback' in this.video) {
      this.rVfcHandle = this.video.requestVideoFrameCallback((now, metadata) => {
        this.processCurrentFrame();
        this.scheduleNextFrame();
      });
    } else {
      this.rVfcHandle = requestAnimationFrame(() => {
        this.processCurrentFrame();
        this.scheduleNextFrame();
      });
    }
  }

  async processCurrentFrame() {
    if (!this.isRunning || this.isProcessing) return;
    if (this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    this.isProcessing = true;

    try {
      const vWidth = this.video.videoWidth || 640;
      const vHeight = this.video.videoHeight || 480;
      const maxDim = this.config.MAX_PROCESSING_DIMENSION || 480;

      let procW, procH;
      if (vWidth >= vHeight) {
        procW = maxDim;
        procH = Math.max(160, Math.round(maxDim * (vHeight / vWidth)));
      } else {
        procH = maxDim;
        procW = Math.max(160, Math.round(maxDim * (vWidth / vHeight)));
      }

      this.currentProcW = procW;
      this.currentProcH = procH;

      // Downscale frame preserving aspect ratio
      const bitmap = await createImageBitmap(this.video, {
        resizeWidth: procW,
        resizeHeight: procH,
        resizeQuality: 'low'
      });

      // Transfer bitmap zero-copy to Web Worker
      this.worker.postMessage(
        {
          type: 'PROCESS_FRAME',
          bitmap,
          config: {
            ...this.config,
            PROCESSING_WIDTH: procW,
            PROCESSING_HEIGHT: procH
          }
        },
        [bitmap]
      );
    } catch (err) {
      this.isProcessing = false;
    }
  }

  onResult(cb) {
    this.callback = cb;
  }

  onReady(cb) {
    this.readyCallback = cb;
  }

  onError(cb) {
    this.errorCallback = cb;
  }

  getFps() {
    return this.currentFps;
  }

  stop() {
    this.isRunning = false;
    this.isProcessing = false;
    if (this.rVfcHandle) {
      if ('cancelVideoFrameCallback' in this.video) {
        this.video.cancelVideoFrameCallback(this.rVfcHandle);
      } else {
        cancelAnimationFrame(this.rVfcHandle);
      }
      this.rVfcHandle = null;
    }
  }

  destroy() {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
