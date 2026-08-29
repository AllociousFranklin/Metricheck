/**
 * MotionTracker - Frame-to-frame bounding box tracking and motion stability state machine
 */
export class MotionTracker {
  constructor(config) {
    this.config = config;
    this.prevBbox = null;
    this.smoothedBbox = null;
    this.state = 'NO_OBJECT'; // 'NO_OBJECT' | 'MOVING' | 'STABLE'
    this.stableFrameCount = 0;
    this.deltaPos = 0;
    this.deltaSize = 0;
  }

  /**
   * Updates tracking state with the latest bounding box from CV Worker
   * @param {Object|null} bbox - { x, y, width, height } in processing frame coordinates
   * @param {number} frameWidth - Width of processing frame
   * @param {number} frameHeight - Height of processing frame
   */
  update(bbox, frameWidth = 480, frameHeight = 360) {
    if (!bbox) {
      this.state = 'NO_OBJECT';
      this.stableFrameCount = 0;
      this.prevBbox = null;
      this.smoothedBbox = null;
      this.deltaPos = 1.0;
      this.deltaSize = 1.0;
      return this.getState();
    }

    // Apply Exponential Moving Average (EMA) smoothing for visual stability
    if (!this.smoothedBbox) {
      this.smoothedBbox = { ...bbox };
    } else {
      const alpha = 0.45; // Smoothing factor
      this.smoothedBbox = {
        x: this.smoothedBbox.x * (1 - alpha) + bbox.x * alpha,
        y: this.smoothedBbox.y * (1 - alpha) + bbox.y * alpha,
        width: this.smoothedBbox.width * (1 - alpha) + bbox.width * alpha,
        height: this.smoothedBbox.height * (1 - alpha) + bbox.height * alpha
      };
    }

    if (!this.prevBbox) {
      this.prevBbox = { ...bbox };
      this.state = 'MOVING';
      this.stableFrameCount = 0;
      return this.getState();
    }

    // 1. Calculate center displacement normalized by frame diagonal
    const prevCx = this.prevBbox.x + this.prevBbox.width / 2;
    const prevCy = this.prevBbox.y + this.prevBbox.height / 2;
    const curCx = bbox.x + bbox.width / 2;
    const curCy = bbox.y + bbox.height / 2;

    const dx = curCx - prevCx;
    const dy = curCy - prevCy;
    const centerDist = Math.sqrt(dx * dx + dy * dy);
    const frameDiag = Math.sqrt(frameWidth * frameWidth + frameHeight * frameHeight);
    this.deltaPos = centerDist / frameDiag;

    // 2. Calculate relative area difference
    const prevArea = Math.max(1, this.prevBbox.width * this.prevBbox.height);
    const curArea = Math.max(1, bbox.width * bbox.height);
    this.deltaSize = Math.abs(curArea - prevArea) / prevArea;

    // 3. Classify motion
    const isPositionStable = this.deltaPos <= this.config.POSITION_THRESHOLD;
    const isSizeStable = this.deltaSize <= this.config.SIZE_THRESHOLD;

    if (isPositionStable && isSizeStable) {
      this.state = 'STABLE';
      this.stableFrameCount++;
    } else {
      this.state = 'MOVING';
      this.stableFrameCount = 0;
    }

    this.prevBbox = { ...bbox };
    return this.getState();
  }

  getState() {
    const isReadyForCapture = this.state === 'STABLE' && this.stableFrameCount >= this.config.MIN_STABLE_FRAMES;

    return {
      state: this.state,
      stableFrameCount: this.stableFrameCount,
      isReadyForCapture,
      deltaPos: this.deltaPos,
      deltaSize: this.deltaSize,
      smoothedBbox: this.smoothedBbox,
      stabilityRatio: Math.min(1, this.stableFrameCount / this.config.MIN_STABLE_FRAMES)
    };
  }

  reset() {
    this.prevBbox = null;
    this.smoothedBbox = null;
    this.state = 'NO_OBJECT';
    this.stableFrameCount = 0;
    this.deltaPos = 0;
    this.deltaSize = 0;
  }
}
