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
          this.callback(e.data);
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
      // Downscale frame for fast real-time computer vision processing
      const bitmap = await createImageBitmap(this.video, {
        resizeWidth: this.config.PROCESSING_WIDTH,
        resizeHeight: this.config.PROCESSING_HEIGHT,
        resizeQuality: 'low'
      });

      // Transfer bitmap zero-copy to Web Worker
      this.worker.postMessage(
        {
          type: 'PROCESS_FRAME',
          bitmap,
          config: this.config
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
