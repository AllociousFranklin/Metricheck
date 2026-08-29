/**
 * PackageCamera - Manages getUserMedia stream, high-res capture, and hardware capabilities
 */
export class PackageCamera {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.track = null;
    this.imageCapture = null;
    this.torchEnabled = false;
  }

  /**
   * Initializes the highest possible resolution camera stream with progressive fallbacks.
   */
  async start() {
    const constraintProfiles = [
      // 1. Ultra-high res rear camera (4K / QHD)
      {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 3840, min: 1920 },
          height: { ideal: 2160, min: 1080 },
          frameRate: { ideal: 30, max: 60 }
        }
      },
      // 2. Standard Full HD (1080p)
      {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, max: 30 }
        }
      },
      // 3. Permissive fallback (handles desktop webcams and older devices)
      {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' }
        }
      }
    ];

    let lastError = null;
    for (const constraints of constraintProfiles) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        break;
      } catch (err) {
        lastError = err;
        console.warn('Camera constraint profile rejected, trying next profile...', constraints, err);
      }
    }

    if (!this.stream) {
      throw new Error(`Failed to access camera: ${lastError?.message || 'Permission denied or no camera device found'}`);
    }

    this.track = this.stream.getVideoTracks()[0];
    this.video.srcObject = this.stream;
    this.video.setAttribute('playsinline', 'true');
    this.video.setAttribute('webkit-playsinline', 'true');
    this.video.muted = true;

    // Wait for video metadata (dimensions) to be available before playing.
    // On mobile portrait, videoWidth/Height may be 0 or swapped until this fires.
    await new Promise((resolve) => {
      if (this.video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        resolve();
      } else {
        this.video.addEventListener('loadedmetadata', resolve, { once: true });
      }
    });

    await this.video.play();

    // Configure hardware autofocus and exposure if supported
    await this.configureAdvancedCapabilities();

    // Initialize ImageCapture API for native sensor photo capture if available
    if ('ImageCapture' in window && this.track) {
      try {
        this.imageCapture = new ImageCapture(this.track);
      } catch (e) {
        console.warn('ImageCapture initialization skipped:', e);
      }
    }

    return this.getStreamSettings();
  }

  /**
   * Applies continuous autofocus and auto-exposure if supported by mobile hardware.
   */
  async configureAdvancedCapabilities() {
    if (!this.track || typeof this.track.getCapabilities !== 'function') return;

    try {
      const capabilities = this.track.getCapabilities();
      const advancedConstraints = {};

      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        advancedConstraints.focusMode = 'continuous';
      }
      if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
        advancedConstraints.exposureMode = 'continuous';
      }
      if (capabilities.whiteBalanceMode && capabilities.whiteBalanceMode.includes('continuous')) {
        advancedConstraints.whiteBalanceMode = 'continuous';
      }

      if (Object.keys(advancedConstraints).length > 0) {
        await this.track.applyConstraints({ advanced: [advancedConstraints] });
        console.log('Applied advanced camera hardware constraints:', advancedConstraints);
      }
    } catch (e) {
      console.warn('Could not apply advanced camera constraints:', e);
    }
  }

  /**
   * Checks if device supports hardware torch/flashlight.
   */
  hasTorch() {
    if (!this.track || typeof this.track.getCapabilities !== 'function') return false;
    const capabilities = this.track.getCapabilities();
    return !!capabilities.torch;
  }

  /**
   * Toggles flashlight/torch for low-light scanning.
   */
  async toggleTorch() {
    if (!this.hasTorch()) return false;
    try {
      this.torchEnabled = !this.torchEnabled;
      await this.track.applyConstraints({
        advanced: [{ torch: this.torchEnabled }]
      });
      return this.torchEnabled;
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
      return false;
    }
  }

  /**
   * Captures a high-resolution still frame.
   * Prefers hardware sensor still (12MP+) via ImageCapture, with Canvas fallback.
   */
  async captureHighResFrame(cropBbox = null, procW = 480, procH = 360) {
    let sourceCanvas = null;

    // 1. Try Hardware ImageCapture API
    if (this.imageCapture) {
      try {
        const photoSettings = { fillLightMode: 'auto' };
        if (typeof this.track.getCapabilities === 'function') {
          const caps = this.track.getCapabilities();
          if (caps.imageWidth?.max) photoSettings.imageWidth = caps.imageWidth.max;
          if (caps.imageHeight?.max) photoSettings.imageHeight = caps.imageHeight.max;
        }
        const photoBlob = await this.imageCapture.takePhoto(photoSettings);
        const bitmap = await createImageBitmap(photoBlob);
        sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = bitmap.width;
        sourceCanvas.height = bitmap.height;
        const ctx = sourceCanvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
      } catch (err) {
        console.warn('ImageCapture.takePhoto failed or not ready, falling back to video frame grab:', err);
      }
    }

    // 2. Fallback: High-resolution direct video element snapshot
    if (!sourceCanvas) {
      sourceCanvas = document.createElement('canvas');
      const vWidth = this.video.videoWidth || 1920;
      const vHeight = this.video.videoHeight || 1080;
      sourceCanvas.width = vWidth;
      sourceCanvas.height = vHeight;
      const ctx = sourceCanvas.getContext('2d');
      ctx.drawImage(this.video, 0, 0, vWidth, vHeight);
    }

    // If no crop requested, return full resolution canvas
    if (!cropBbox) {
      return sourceCanvas;
    }

    // Otherwise crop the bounding box scaled to high-res coordinates with 5% safety padding
    const scaleX = sourceCanvas.width / (procW || sourceCanvas.width);
    const scaleY = sourceCanvas.height / (procH || sourceCanvas.height);

    const padX = cropBbox.width * 0.05;
    const padY = cropBbox.height * 0.05;

    const sx = Math.max(0, Math.round((cropBbox.x - padX) * scaleX));
    const sy = Math.max(0, Math.round((cropBbox.y - padY) * scaleY));
    const sw = Math.min(sourceCanvas.width - sx, Math.round((cropBbox.width + padX * 2) * scaleX));
    const sh = Math.min(sourceCanvas.height - sy, Math.round((cropBbox.height + padY * 2) * scaleY));

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.max(1, sw);
    cropCanvas.height = Math.max(1, sh);

    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, cropCanvas.width, cropCanvas.height);

    return cropCanvas;
  }

  getStreamSettings() {
    return this.track ? this.track.getSettings() : {};
  }

  getVideoDimensions() {
    return {
      width: this.video.videoWidth || 640,
      height: this.video.videoHeight || 480
    };
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
      this.track = null;
      this.imageCapture = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }
}
