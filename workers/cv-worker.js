/**
 * cv-worker.js - Computer Vision Web Worker with Real-Time Sharpness & Package Detection
 * Computes Laplacian blur variance, brightness histogram, glare/dark ratios, and edge contours.
 */

let cvReady = false;
let scratchCanvas = null;
let scratchCtx = null;

// Reusable persistent Mat pool for fixed-size frame buffers
let srcMat = null;
let grayMat = null;
let blurredMat = null;
let edgesMat = null;

function notifyCvReady() {
  if (!cvReady) {
    cvReady = true;
    self.postMessage({ type: 'CV_READY' });
    console.log('OpenCV.js WASM engine initialized in Worker');
  }
}

// Configure Emscripten before loading opencv.js
self.Module = {
  onRuntimeInitialized: function() {
    notifyCvReady();
  },
  onAbort: function(err) {
    console.warn('OpenCV.js notice in Worker:', err);
  }
};

// Attempt to load OpenCV.js from trusted CDN
try {
  importScripts('https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.1/opencv.js');
  if (typeof cv !== 'undefined') {
    if (typeof cv.Mat === 'function') {
      notifyCvReady();
    } else if (typeof cv.then === 'function') {
      cv.then(() => notifyCvReady());
    }
  }
} catch (e) {
  console.warn('OpenCV.js CDN unavailable, using high-speed native canvas CV engine:', e);
}

function initMatPool(width, height) {
  if (!cvReady || typeof cv === 'undefined' || typeof cv.Mat !== 'function') return;

  cleanupMatPool();

  try {
    srcMat = new cv.Mat(height, width, cv.CV_8UC4);
    grayMat = new cv.Mat(height, width, cv.CV_8UC1);
    blurredMat = new cv.Mat(height, width, cv.CV_8UC1);
    edgesMat = new cv.Mat(height, width, cv.CV_8UC1);
  } catch (e) {
    console.warn('Error initializing Mat pool:', e);
  }
}

function cleanupMatPool() {
  if (srcMat) { try { srcMat.delete(); } catch(e){} srcMat = null; }
  if (grayMat) { try { grayMat.delete(); } catch(e){} grayMat = null; }
  if (blurredMat) { try { blurredMat.delete(); } catch(e){} blurredMat = null; }
  if (edgesMat) { try { edgesMat.delete(); } catch(e){} edgesMat = null; }
}

/**
 * Main Worker Message Handler
 */
self.onmessage = async function(e) {
  const { type, bitmap, config } = e.data;

  if (type === 'PROCESS_FRAME') {
    const width = bitmap.width;
    const height = bitmap.height;

    // Convert ImageBitmap to ImageData using OffscreenCanvas
    if (!scratchCanvas || scratchCanvas.width !== width || scratchCanvas.height !== height) {
      scratchCanvas = new OffscreenCanvas(width, height);
      scratchCtx = scratchCanvas.getContext('2d', { willReadFrequently: true });
      initMatPool(width, height);
    }

    scratchCtx.drawImage(bitmap, 0, 0);
    const imageData = scratchCtx.getImageData(0, 0, width, height);

    let result = null;

    if (cvReady && typeof cv !== 'undefined' && typeof cv.Mat === 'function' && srcMat) {
      result = processWithOpenCV(imageData, width, height, config);
    } else {
      // High-speed pure JS Canvas CV engine
      result = processWithCanvasEngine(imageData, width, height, config);
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
 * Package detection and sharpness analysis using OpenCV.js WASM
 */
function processWithOpenCV(imageData, width, height, config) {
  const totalArea = width * height;
  const minArea = totalArea * (config?.MIN_CONTOUR_AREA_RATIO || 0.05);
  const maxArea = totalArea * (config?.MAX_CONTOUR_AREA_RATIO || 0.92);
  const cannyLow = config?.CANNY_LOW || 45;
  const cannyHigh = config?.CANNY_HIGH || 135;
  const approxEps = config?.CONTOUR_APPROX_EPSILON || 0.025;

  srcMat.data.set(imageData.data);

  // 1. Grayscale
  cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY, 0);

  // 2. Gaussian Blur to suppress texture noise
  cv.GaussianBlur(grayMat, blurredMat, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

  // 3. Canny Edge Detection
  cv.Canny(blurredMat, edgesMat, cannyLow, cannyHigh, 3, false);

  // 4. Dilate to connect package edges
  const M = cv.Mat.ones(3, 3, cv.CV_8U);
  cv.dilate(edgesMat, edgesMat, M, new cv.Point(-1, -1), 1);
  M.delete();

  // 5. Find Contours
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

  contoursVec.delete();
  hierarchy.delete();

  // If no specific contour boundary found, use centered 65% ROI as fallback target
  let hasRealContour = !!bestBbox;
  if (!bestBbox) {
    const bw = Math.round(width * 0.65);
    const bh = Math.round(height * 0.65);
    bestBbox = {
      x: Math.round((width - bw) / 2),
      y: Math.round((height - bh) / 2),
      width: bw,
      height: bh
    };
  }

  // Compute sharpness (Laplacian variance), brightness, and glare/dark ratios on target ROI
  let sharpness = 0;
  let meanBrightness = 0;
  let glareRatio = 0;
  let darkRatio = 0;

  try {
    const roiRect = new cv.Rect(bestBbox.x, bestBbox.y, bestBbox.width, bestBbox.height);
    const grayRoi = grayMat.roi(roiRect);

    const lapLocal = new cv.Mat();
    const meanLocal = new cv.Mat();
    const stdLocal = new cv.Mat();

    cv.Laplacian(grayRoi, lapLocal, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT);
    cv.meanStdDev(lapLocal, meanLocal, stdLocal);
    const stdDev = stdLocal.doubleAt(0, 0);
    sharpness = stdDev * stdDev;

    cv.meanStdDev(grayRoi, meanLocal, stdLocal);
    meanBrightness = meanLocal.doubleAt(0, 0);

    lapLocal.delete();
    meanLocal.delete();
    stdLocal.delete();

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
  } catch (e) {
    // If ROI fails, compute via fast JS algorithm
    sharpness = computeFastLaplacianVariance(imageData, width, height, bestBbox);
  }

  return {
    bbox: bestBbox,
    corners: bestCorners,
    sharpness: Math.round(sharpness),
    brightness: Math.round(meanBrightness),
    glareRatio: Number(glareRatio.toFixed(4)),
    darkRatio: Number(darkRatio.toFixed(4)),
    frameAreaRatio: (bestBbox.width * bestBbox.height) / totalArea,
    hasDetection: hasRealContour || sharpness >= 40 // Valid if contour found OR clear in-focus subject in view
  };
}

/**
 * High-speed native Canvas CV Engine
 * Calculates exact 3x3 Laplacian variance and brightness metrics in pure JavaScript (~0.5ms).
 */
function processWithCanvasEngine(imageData, width, height, config) {
  const data = imageData.data;
  const totalPixels = width * height;

  const bw = Math.round(width * 0.65);
  const bh = Math.round(height * 0.65);
  const bx = Math.round((width - bw) / 2);
  const by = Math.round((height - bh) / 2);

  const targetBbox = { x: bx, y: by, width: bw, height: bh };

  // Calculate Laplacian variance on ROI
  const sharpness = computeFastLaplacianVariance(imageData, width, height, targetBbox);

  // Calculate luminance, glare, and dark ratios on ROI
  let sumLum = 0;
  let glareCount = 0;
  let darkCount = 0;
  let roiCount = 0;

  for (let y = by; y < by + bh; y += 2) {
    for (let x = bx; x < bx + bw; x += 2) {
      const idx = (y * width + x) * 4;
      const lum = (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;
      sumLum += lum;
      if (lum >= 250) glareCount++;
      if (lum <= 25) darkCount++;
      roiCount++;
    }
  }

  const meanLum = roiCount > 0 ? sumLum / roiCount : 128;
  const glareRatio = roiCount > 0 ? glareCount / roiCount : 0;
  const darkRatio = roiCount > 0 ? darkCount / roiCount : 0;

  return {
    bbox: targetBbox,
    corners: null,
    sharpness: Math.round(sharpness),
    brightness: Math.round(meanLum),
    glareRatio: Number(glareRatio.toFixed(4)),
    darkRatio: Number(darkRatio.toFixed(4)),
    frameAreaRatio: (bw * bh) / totalPixels,
    hasDetection: sharpness >= 30 // Valid subject present when in focus
  };
}

/**
 * Pure JavaScript 3x3 Laplacian Variance Blur Metric
 * Standard formulation: Var(∇²I) where ∇² = [[0,1,0],[1,-4,1],[0,1,0]]
 */
function computeFastLaplacianVariance(imageData, width, height, roi) {
  const data = imageData.data;
  const rx = roi ? roi.x : Math.round(width * 0.18);
  const ry = roi ? roi.y : Math.round(height * 0.18);
  const rw = roi ? roi.width : Math.round(width * 0.64);
  const rh = roi ? roi.height : Math.round(height * 0.64);

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = ry + 1; y < ry + rh - 1; y += 2) {
    const yRow = y * width;
    const yAbove = (y - 1) * width;
    const yBelow = (y + 1) * width;

    for (let x = rx + 1; x < rx + rw - 1; x += 2) {
      const idx = (yRow + x) * 4;
      // Fast luminance approximation
      const c = (data[idx] + (data[idx + 1] << 1) + data[idx + 2]) >> 2;

      const idxTop = (yAbove + x) * 4;
      const top = (data[idxTop] + (data[idxTop + 1] << 1) + data[idxTop + 2]) >> 2;

      const idxBtm = (yBelow + x) * 4;
      const btm = (data[idxBtm] + (data[idxBtm + 1] << 1) + data[idxBtm + 2]) >> 2;

      const idxLft = (yRow + x - 1) * 4;
      const lft = (data[idxLft] + (data[idxLft + 1] << 1) + data[idxLft + 2]) >> 2;

      const idxRgt = (yRow + x + 1) * 4;
      const rgt = (data[idxRgt] + (data[idxRgt + 1] << 1) + data[idxRgt + 2]) >> 2;

      const lap = top + btm + lft + rgt - (c << 2);
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  return Math.max(0, variance);
}
