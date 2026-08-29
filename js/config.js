/**
 * Global Configuration for Multi-View Package Scanning System
 */
export const CONFIG = {
  // Target number of distinct views to capture
  TARGET_VIEWS: 4,

  // Processing resolution (frame downscaled before sending to CV Worker for high fps)
  PROCESSING_WIDTH: 480,
  PROCESSING_HEIGHT: 360,

  // Motion tracker thresholds
  POSITION_THRESHOLD: 0.025,   // 2.5% of frame dimension - max center displacement per frame for "stable"
  SIZE_THRESHOLD: 0.06,        // 6% relative area change - max for "stable"
  MIN_STABLE_FRAMES: 7,        // Consecutive stable frames required before capture (~0.5s at ~15fps CV rate)

  // Quality scoring thresholds
  SHARPNESS_MIN: 70,           // Laplacian variance - below this is definitely blurry
  SHARPNESS_GOOD: 140,         // Laplacian variance - above this is very sharp
  MIN_PACKAGE_AREA: 0.12,      // 12% of frame - below = "Move closer"
  MAX_PACKAGE_AREA: 0.88,      // 88% of frame - above = "Move back slightly"
  BRIGHTNESS_MIN: 55,          // Mean luminance (0-255) - below = "Too dark"
  BRIGHTNESS_MAX: 215,         // Mean luminance (0-255) - above = "Too bright"
  GLARE_MAX_RATIO: 0.05,       // 5% pixels with luminance > 250 - above = "Reduce glare"
  DARK_PIXEL_MAX_RATIO: 0.45,  // 45% pixels with luminance < 25 - above = "Too dark"
  QUALITY_THRESHOLD: 0.58,     // Combined quality score (0 to 1) required to allow capture

  // Duplicate detection (Perceptual Hash / dHash)
  HASH_SIMILARITY_THRESHOLD: 10, // Hamming distance (0-64): <= 10 means duplicate/same view

  // Capture behavior
  CAPTURE_COOLDOWN_MS: 1200,   // Minimum ms cooldown between captures to allow user rotation

  // Package detection (OpenCV contour parameters)
  CANNY_LOW: 45,
  CANNY_HIGH: 135,
  MIN_CONTOUR_AREA_RATIO: 0.05, // At least 5% of processed frame area
  MAX_CONTOUR_AREA_RATIO: 0.92, // At most 92% of processed frame area
  CONTOUR_APPROX_EPSILON: 0.025, // Polygon approximation epsilon factor

  // Aspect ratio bounds for valid package shapes (width / height)
  MIN_ASPECT_RATIO: 0.25,
  MAX_ASPECT_RATIO: 4.0,
};
