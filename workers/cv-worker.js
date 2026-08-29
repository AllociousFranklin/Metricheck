/**
 * cv-worker.js - Computer Vision Web Worker using OpenCV.js
 * Detects package bounding box, contour polygon, and computes Laplacian blur variance.
 */

let cvReady = false;
let scratchCanvas = null;
let scratchCtx = null;

// Reusable persistent Mat pool for fixed-size frame buffers only.
// Per-frame transient Mats (contours, laplacian, meanStdDev) are created and
// deleted each frame to prevent contour accumulation leaks and ROI size mismatches.
let srcMat = null;
let grayMat = null;
let blurredMat = null;
let edgesMat = null;

// Configure Emscripten before loading opencv.js
self.Module = {
  onRuntimeInitialized: function() {
    cvReady = true;
    self.postMessage({ type: 'CV_READY' });
  },
  onAbort: function(err) {
    console.error('OpenCV.js aborted in Worker:', err);
    self.postMessage({ type: 'CV_ERROR', error: String(err) });
  }
};

// Load OpenCV.js from trusted CDN
try {
  importScripts('https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.1/opencv.js');
} catch (e) {
  console.warn('Could not load OpenCV.js via importScripts, fallback enabled:', e);
}

function initMatPool(width, height) {
  if (!cvReady || typeof cv === 'undefined') return;

  // Free existing Mats if dimensions changed
  cleanupMatPool();

  srcMat = new cv.Mat(height, width, cv.CV_8UC4);
  grayMat = new cv.Mat(height, width, cv.CV_8UC1);
  blurredMat = new cv.Mat(height, width, cv.CV_8UC1);
  edgesMat = new cv.Mat(height, width, cv.CV_8UC1);
}

function cleanupMatPool() {
  if (srcMat) { srcMat.delete(); srcMat = null; }
  if (grayMat) { grayMat.delete(); grayMat = null; }
  if (blurredMat) { blurredMat.delete(); blurredMat = null; }
  if (edgesMat) { edgesMat.delete(); edgesMat = null; }
}

/**
 * Main Worker Message Handler
 */
self.onmessage = async function(e) {
  const { type, bitmap, config } = e.data;

  if (type === 'PROCESS_FRAME') {
    if (!bitmap) return;

    const width = bitmap.width;
    const height = bitmap.height;

    // Initialize or resize scratch canvas
    if (!scratchCanvas || scratchCanvas.width !== width || scratchCanvas.height !== height) {
      scratchCanvas = new OffscreenCanvas(width, height);
      scratchCtx = scratchCanvas.getContext('2d', { willReadFrequently: true });
      if (cvReady) {
        initMatPool(width, height);
      }
    }

    // Draw bitmap to offscreen canvas
    scratchCtx.drawImage(bitmap, 0, 0);
    const imageData = scratchCtx.getImageData(0, 0, width, height);

    let result = null;

    if (cvReady && typeof cv !== 'undefined' && srcMat) {
      result = processWithOpenCV(imageData, width, height, config);
    } else {
      // Fallback while OpenCV is still initializing
      result = processWithCanvasFallback(imageData, width, height, config);
    }

    // Always close transferred ImageBitmap to prevent GPU memory leak
    bitmap.close();

    self.postMessage({
      type: 'FRAME_RESULT',
      ...result,
      timestamp: performance.now()
    });
  }
};

/**
 * Package detection, sharpness analysis, and glare/dark-pixel detection using OpenCV.js WASM.
 * Bug fixes applied:
 *  - contoursMatVec & hierarchyMat created/deleted per frame (prevents contour accumulation leak)
 *  - lapMat, meanMat, stdDevMat created/deleted per ROI (prevents ROI size mismatch)
 *  - Glare ratio (% pixels > 250) and dark ratio (% pixels < 25) computed on ROI
 */
function processWithOpenCV(imageData, width, height, config) {
  const totalArea = width * height;
  const minArea = totalArea * (config?.MIN_CONTOUR_AREA_RATIO || 0.05);
  const maxArea = totalArea * (config?.MAX_CONTOUR_AREA_RATIO || 0.92);
  const cannyLow = config?.CANNY_LOW || 45;
  const cannyHigh = config?.CANNY_HIGH || 135;
  const approxEps = config?.CONTOUR_APPROX_EPSILON || 0.025;

  // Copy raw pixels to srcMat
  srcMat.data.set(imageData.data);

  // 1. Grayscale
  cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY, 0);

  // 2. Gaussian Blur to suppress texture noise
  cv.GaussianBlur(grayMat, blurredMat, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

  // 3. Canny Edge Detection
  cv.Canny(blurredMat, edgesMat, cannyLow, cannyHigh, 3, false);

  // 4. Dilate slightly to connect broken package edges
  const M = cv.Mat.ones(3, 3, cv.CV_8U);
  cv.dilate(edgesMat, edgesMat, M, new cv.Point(-1, -1), 1);
  M.delete();

  // 5. Find Contours — created fresh each frame to prevent accumulation leak
  const contoursVec = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edgesMat, contoursVec, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let bestBbox = null;
  let bestCorners = null;
  let maxValidArea = 0;

  for (let i = 0; i < contoursVec.size(); ++i) {
    const cnt = contoursVec.get(i);
    const area = cv.contourArea(cnt);

    if (area >= minArea && area <= maxArea && area > maxValidArea) {
      const rect = cv.boundingRect(cnt);
      const aspect = rect.width / rect.height;

      if (aspect >= (config?.MIN_ASPECT_RATIO || 0.25) && aspect <= (config?.MAX_ASPECT_RATIO || 4.0)) {
        maxValidArea = area;
        bestBbox = {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        };

        // Check for 4-point polygon approximation
        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, approxEps * peri, true);

        if (approx.rows === 4 && cv.isContourConvex(approx)) {
          bestCorners = [];
          for (let j = 0; j < 4; j++) {
            bestCorners.push({
              x: approx.data32S[j * 2],
              y: approx.data32S[j * 2 + 1]
            });
          }
        }
        approx.delete();
      }
    }
    cnt.delete();
  }

  // Clean up per-frame transient Mats
  contoursVec.delete();
  hierarchy.delete();

  // Compute sharpness (Laplacian variance), brightness, and glare/dark ratios on ROI
  let sharpness = 0;
  let meanBrightness = 0;
  let glareRatio = 0;
  let darkRatio = 0;

  if (bestBbox) {
    const roiRect = new cv.Rect(bestBbox.x, bestBbox.y, bestBbox.width, bestBbox.height);
    const grayRoi = grayMat.roi(roiRect);

    // Laplacian variance — local Mats sized to ROI, deleted after use
    const lapLocal = new cv.Mat();
    const meanLocal = new cv.Mat();
    const stdLocal = new cv.Mat();

    cv.Laplacian(grayRoi, lapLocal, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT);
    cv.meanStdDev(lapLocal, meanLocal, stdLocal);
    const stdDev = stdLocal.doubleAt(0, 0);
    sharpness = stdDev * stdDev;

    // Mean brightness
    cv.meanStdDev(grayRoi, meanLocal, stdLocal);
    meanBrightness = meanLocal.doubleAt(0, 0);

    lapLocal.delete();
    meanLocal.delete();
    stdLocal.delete();

    // Glare & dark pixel ratio — scan ROI grayscale pixel data directly
    const roiPixels = grayRoi.data;
    const roiTotal = roiPixels.length;
    let glareCount = 0;
    let darkCount = 0;
    for (let p = 0; p < roiTotal; p++) {
      if (roiPixels[p] >= 250) glareCount++;
      if (roiPixels[p] <= 25) darkCount++;
    }
    glareRatio = glareCount / roiTotal;
    darkRatio = darkCount / roiTotal;

    grayRoi.delete();
  }

  return {
    bbox: bestBbox,
    corners: bestCorners,
    sharpness: Math.round(sharpness),
    brightness: Math.round(meanBrightness),
    glareRatio: Number(glareRatio.toFixed(4)),
    darkRatio: Number(darkRatio.toFixed(4)),
    frameAreaRatio: bestBbox ? (bestBbox.width * bestBbox.height) / totalArea : 0,
    hasDetection: !!bestBbox
  };
}

/**
 * Fallback while OpenCV.js is loading — returns honest "no real detection" data
 * so that the quality scorer and capture manager won't auto-capture garbage frames.
 * A centered guide box is still returned for UI overlay purposes only.
 */
function processWithCanvasFallback(imageData, width, height, config) {
  const data = imageData.data;
  let sumLum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sumLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const meanLum = sumLum / (width * height);

  // Center guide bbox (for UI overlay only — NOT a real detection)
  const boxW = Math.round(width * 0.6);
  const boxH = Math.round(height * 0.6);
  const boxX = Math.round((width - boxW) / 2);
  const boxY = Math.round((height - boxH) / 2);

  return {
    bbox: { x: boxX, y: boxY, width: boxW, height: boxH },
    corners: null,
    sharpness: 0,
    brightness: Math.round(meanLum),
    glareRatio: 0,
    darkRatio: 0,
    frameAreaRatio: 0.36,
    hasDetection: false  // Prevents auto-capture before CV engine is ready
  };
}

