import { getHammingDistance, isDuplicate } from "./js/perceptual-hash.js";
import { MotionTracker } from "./js/tracker.js";
import { QualityScorer } from "./js/quality.js";
import { CONFIG } from "./js/config.js";

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

console.log("--- TEST 1: Perceptual Hash & Hamming Distance ---");
const hash1 = "1a2b3c4d5e6f7a8b";
const hash2 = "1a2b3c4d5e6f7a8b";
const hash3 = "1a2b3c4d5e6f7a8f";
const hash4 = "ffffffffffffffff";

assert(getHammingDistance(hash1, hash2) === 0, "Identical hashes = distance 0");
assert(getHammingDistance(hash1, hash3) === 1, "1-bit difference = distance 1");
assert(getHammingDistance(hash1, hash4) === 29, "Large difference = distance 29");
assert(isDuplicate(hash2, [hash1], 10) === true, "Identical hash flagged as duplicate");
assert(isDuplicate(hash4, [hash1], 10) === false, "Distant hash flagged as new view");

console.log("\n--- TEST 2: Motion Tracker State Machine ---");
const tracker = new MotionTracker(CONFIG);
let state = tracker.update(null);
assert(state.state === "NO_OBJECT", "No bbox → NO_OBJECT state");

state = tracker.update({ x: 100, y: 80, width: 200, height: 180 });
assert(state.state === "MOVING", "First bbox → MOVING state");

// Feed stable frames
for (let i = 0; i < 8; i++) {
  state = tracker.update({ x: 100 + (i % 2), y: 80, width: 200, height: 180 });
}
assert(state.state === "STABLE", "After 8 stable frames → STABLE");
assert(state.isReadyForCapture === true, "isReadyForCapture = true after MIN_STABLE_FRAMES");

// Sudden large movement resets
state = tracker.update({ x: 300, y: 200, width: 200, height: 180 });
assert(state.state === "MOVING", "Large displacement → back to MOVING");
assert(state.stableFrameCount === 0, "Stable counter reset to 0");

console.log("\n--- TEST 3: Quality Scorer (Good Frame) ---");
const stableState = { state: "STABLE", stableFrameCount: 10, isReadyForCapture: true, stabilityRatio: 1.0 };

const goodDetection = {
  bbox: { x: 100, y: 80, width: 200, height: 180 },
  sharpness: 120, brightness: 130, frameAreaRatio: 0.35,
  glareRatio: 0.01, darkRatio: 0.05,
  hasDetection: true
};
const qGood = QualityScorer.evaluate(goodDetection, stableState, CONFIG);
assert(qGood.isAcceptable === true, `Good frame accepted (score=${qGood.overallScore})`);

console.log("\n--- TEST 4: Quality Scorer (Blurry Frame) ---");
const blurryDetection = {
  bbox: { x: 100, y: 80, width: 200, height: 180 },
  sharpness: 20, brightness: 130, frameAreaRatio: 0.35,
  glareRatio: 0.01, darkRatio: 0.05,
  hasDetection: true
};
const qBlurry = QualityScorer.evaluate(blurryDetection, stableState, CONFIG);
assert(qBlurry.isAcceptable === false, `Blurry frame rejected (sharpness=20, msg='${qBlurry.feedbackPrimary}')`);

console.log("\n--- TEST 5: Quality Scorer (Glare Detected) ---");
const glareDetection = {
  bbox: { x: 100, y: 80, width: 200, height: 180 },
  sharpness: 150, brightness: 130, frameAreaRatio: 0.35,
  glareRatio: 0.12, darkRatio: 0.02,
  hasDetection: true
};
const qGlare = QualityScorer.evaluate(glareDetection, stableState, CONFIG);
assert(qGlare.isAcceptable === false, `Glare frame rejected (glareRatio=12%, msg='${qGlare.feedbackPrimary}')`);

console.log("\n--- TEST 6: Quality Scorer (Too Dark) ---");
const darkDetection = {
  bbox: { x: 100, y: 80, width: 200, height: 180 },
  sharpness: 150, brightness: 40, frameAreaRatio: 0.35,
  glareRatio: 0.0, darkRatio: 0.55,
  hasDetection: true
};
const qDark = QualityScorer.evaluate(darkDetection, stableState, CONFIG);
assert(qDark.isAcceptable === false, `Dark frame rejected (brightness=40, darkRatio=55%, msg='${qDark.feedbackPrimary}')`);

console.log("\n--- TEST 7: Quality Scorer (hasDetection=false gates capture) ---");
const fallbackDetection = {
  bbox: { x: 100, y: 80, width: 200, height: 180 },
  sharpness: 0, brightness: 130, frameAreaRatio: 0.36,
  glareRatio: 0, darkRatio: 0,
  hasDetection: false
};
const qFallback = QualityScorer.evaluate(fallbackDetection, stableState, CONFIG);
assert(qFallback.isAcceptable === false, `Fallback (CV not loaded) frame rejected (sharpness=0)`);

console.log("\n--- TEST 8: Quality Scorer (Too Far Away) ---");
const farDetection = {
  bbox: { x: 200, y: 150, width: 50, height: 40 },
  sharpness: 150, brightness: 130, frameAreaRatio: 0.05,
  glareRatio: 0.0, darkRatio: 0.0,
  hasDetection: true
};
const qFar = QualityScorer.evaluate(farDetection, stableState, CONFIG);
assert(qFar.isAcceptable === false, `Too-far frame rejected (areaRatio=5%, msg='${qFar.feedbackPrimary}')`);

console.log("\n========================================");
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL TESTS PASSED ✓");
}
