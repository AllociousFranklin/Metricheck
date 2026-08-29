/**
 * QualityScorer - Frame Quality Assessment Engine
 * Evaluates sharpness, framing, lighting/exposure, motion stability, and aspect ratio.
 */
export class QualityScorer {
  /**
   * Evaluates quality metrics for the current frame
   * @param {Object} detection - Output from CV Worker (sharpness, brightness, frameAreaRatio, bbox)
   * @param {Object} trackerState - Output from MotionTracker
   * @param {Object} config - Config parameters
   * @returns {Object} QualityReport
   */
  static evaluate(detection, trackerState, config) {
    if (!detection || !detection.bbox) {
      return {
        overallScore: 0,
        isAcceptable: false,
        feedbackPrimary: 'Align product in camera',
        feedbackSecondary: 'Ensure product is clearly visible',
        subscores: {
          sharpness: 0,
          size: 0,
          exposure: 0,
          stability: 0,
          skew: 0
        },
        badgeClass: 'state-waiting'
      };
    }

    const { sharpness, brightness, frameAreaRatio, bbox } = detection;
    const issues = [];
    const weights = {
      sharpness: 0.30,
      size: 0.20,
      exposure: 0.25,
      stability: 0.15,
      skew: 0.10
    };

    // 1. Sharpness Subscore (Laplacian variance ramp)
    let sSharpness = 0;
    if (sharpness >= config.SHARPNESS_GOOD) {
      sSharpness = 1.0;
    } else if (sharpness >= config.SHARPNESS_MIN) {
      sSharpness = (sharpness - config.SHARPNESS_MIN) / (config.SHARPNESS_GOOD - config.SHARPNESS_MIN);
    } else {
      sSharpness = Math.max(0, sharpness / config.SHARPNESS_MIN * 0.4);
      issues.push({ priority: 1, primary: 'Hold steady', secondary: 'Image is slightly blurry' });
    }

    // 2. Package Size / Framing Subscore
    let sSize = 1.0;
    if (frameAreaRatio < config.MIN_PACKAGE_AREA) {
      sSize = Math.max(0, frameAreaRatio / config.MIN_PACKAGE_AREA);
      issues.push({ priority: 2, primary: 'Move closer', secondary: 'Product is too far away' });
    } else if (frameAreaRatio > config.MAX_PACKAGE_AREA) {
      sSize = Math.max(0, 1 - (frameAreaRatio - config.MAX_PACKAGE_AREA) / (1 - config.MAX_PACKAGE_AREA));
      issues.push({ priority: 2, primary: 'Move back slightly', secondary: 'Product fills entire frame' });
    }

    // 3. Exposure / Lighting Subscore (now includes glare & dark pixel analysis)
    let sExposure = 1.0;
    const glareRatio = detection.glareRatio || 0;
    const darkRatio = detection.darkRatio || 0;

    if (brightness < config.BRIGHTNESS_MIN) {
      sExposure = Math.max(0, brightness / config.BRIGHTNESS_MIN);
      issues.push({ priority: 3, primary: 'Improve lighting', secondary: 'Move to brighter area or use torch' });
    } else if (brightness > config.BRIGHTNESS_MAX) {
      sExposure = Math.max(0, 1 - (brightness - config.BRIGHTNESS_MAX) / (255 - config.BRIGHTNESS_MAX));
      issues.push({ priority: 3, primary: 'Reduce brightness', secondary: 'Avoid direct blinding light' });
    }

    // Glare check: specular highlights on glossy packaging
    if (glareRatio > config.GLARE_MAX_RATIO) {
      const glarePenalty = Math.min(1, (glareRatio - config.GLARE_MAX_RATIO) / config.GLARE_MAX_RATIO);
      sExposure = Math.max(0, sExposure - glarePenalty * 0.5);
      issues.push({ priority: 2, primary: 'Reduce glare', secondary: 'Tilt camera away from reflection' });
    }

    // Dark pixel check: shadows covering label text
    if (darkRatio > config.DARK_PIXEL_MAX_RATIO) {
      const darkPenalty = Math.min(1, (darkRatio - config.DARK_PIXEL_MAX_RATIO) / config.DARK_PIXEL_MAX_RATIO);
      sExposure = Math.max(0, sExposure - darkPenalty * 0.5);
      if (!issues.some(i => i.primary === 'Improve lighting')) {
        issues.push({ priority: 3, primary: 'Improve lighting', secondary: 'Too many dark areas on package' });
      }
    }

    // 4. Motion Stability Subscore
    let sStability = trackerState ? trackerState.stabilityRatio : 0;
    if (trackerState && trackerState.state === 'MOVING') {
      sStability = 0.2;
      issues.push({ priority: 1, primary: 'Hold steady...', secondary: 'Stabilizing view for auto-capture' });
    }

    // 5. Skew / Aspect Ratio Subscore
    let sSkew = 1.0;
    const aspect = bbox.width / Math.max(1, bbox.height);
    if (aspect < config.MIN_ASPECT_RATIO || aspect > config.MAX_ASPECT_RATIO) {
      sSkew = 0.3;
      issues.push({ priority: 4, primary: 'Adjust camera angle', secondary: 'Position package squarely' });
    }

    // Calculate overall weighted score
    const overallScore =
      sSharpness * weights.sharpness +
      sSize * weights.size +
      sExposure * weights.exposure +
      sStability * weights.stability +
      sSkew * weights.skew;

    // Check pass criteria (hard gates — ALL must pass, regardless of weighted score)
    const isSharpEnough = sharpness >= config.SHARPNESS_MIN;
    const isSizeOk = frameAreaRatio >= config.MIN_PACKAGE_AREA && frameAreaRatio <= config.MAX_PACKAGE_AREA;
    const isLightOk = brightness >= config.BRIGHTNESS_MIN && brightness <= config.BRIGHTNESS_MAX;
    const isGlareFree = glareRatio <= config.GLARE_MAX_RATIO;
    const isDarkFree = darkRatio <= config.DARK_PIXEL_MAX_RATIO;
    const isStable = trackerState && trackerState.isReadyForCapture;

    const isAcceptable = overallScore >= config.QUALITY_THRESHOLD && isSharpEnough && isSizeOk && isLightOk && isGlareFree && isDarkFree && isStable;

    // Pick top issue for user feedback
    let feedbackPrimary = 'Ready for auto-capture';
    let feedbackSecondary = 'Hold steady to lock in view';
    let badgeClass = 'state-stable';

    if (issues.length > 0) {
      issues.sort((a, b) => a.priority - b.priority);
      feedbackPrimary = issues[0].primary;
      feedbackSecondary = issues[0].secondary;
      badgeClass = issues[0].primary.includes('Hold') ? 'state-moving' : 'state-error';
    } else if (isAcceptable) {
      feedbackPrimary = 'Optimal view locked';
      feedbackSecondary = 'Capturing high-res frame...';
      badgeClass = 'state-stable';
    }

    return {
      overallScore: Number(overallScore.toFixed(2)),
      isAcceptable,
      feedbackPrimary,
      feedbackSecondary,
      badgeClass,
      subscores: {
        sharpness: Number(sSharpness.toFixed(2)),
        size: Number(sSize.toFixed(2)),
        exposure: Number(sExposure.toFixed(2)),
        stability: Number(sStability.toFixed(2)),
        skew: Number(sSkew.toFixed(2))
      },
      rawMetrics: {
        sharpness,
        brightness,
        frameAreaRatio: Number(frameAreaRatio.toFixed(2))
      }
    };
  }
}
