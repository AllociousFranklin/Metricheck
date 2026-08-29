# Multi-View Package Scanning System ("Constraint #1")

An automated, hands-free client-side browser computer vision system that captures 4 clean, high-quality, de-duplicated images covering all sides of a product as the user rotates it.

---

## 🎯 Features

1. **Camera Feed & Live Preview**: Uses `navigator.mediaDevices.getUserMedia` with progressive fallback (4K → 1080p → 720p) and hardware continuous autofocus/auto-exposure.
2. **Real-Time Package Detection**: Web Worker powered by **OpenCV.js WASM** runs Canny edge detection, contour analysis, and polygon approximation (`cv.approxPolyDP`) without blocking the UI thread.
3. **Motion Tracking State Machine**: Analyzes frame-to-frame center displacement ($\Delta\text{pos}$) and area delta ($\Delta\text{size}$) to classify motion as `NO_OBJECT`, `MOVING`, or `STABLE`.
4. **5-Point Frame Quality Scoring**:
   - **Sharpness**: Laplacian variance on package ROI (rejects blur).
   - **Framing / Size**: Ensures package occupies 12% to 88% of viewport.
   - **Exposure & Glare**: Analyzes brightness histogram, dark pixels, and specular reflection highlights.
   - **Motion Stability**: Requires $\ge 7$ consecutive stable frames before triggering capture.
   - **Aspect Ratio**: Rejects extreme skew angles.
5. **Perceptual Hash (dHash) Deduplication**: 64-bit gradient hash with Hamming distance comparison prevents duplicate captures of the same angle.
6. **High-Resolution Auto-Capture**: Utilizes `ImageCapture.takePhoto()` (12MP+) when criteria pass, with zero button presses.
7. **Coverage UI & Live Feedback**: Real-time HUD, color-coded bounding box, live telemetry, and thumbnail strip.

---

## 🚀 How to Run

### Option 1: Python HTTP Server
```bash
python -m http.server 3000
```
Open `http://localhost:3000` in Google Chrome, Edge, or Firefox.

### Option 2: Node.js Serve
```bash
npm run serve
```

### 📱 Testing on Mobile Phone (Over Wi-Fi / HTTPS)
Mobile browsers require HTTPS for camera access. You can expose your local server using `ngrok`:
```bash
npx ngrok http 3000
```
Scan or open the generated HTTPS URL on your phone's browser (iOS Safari or Android Chrome).

---

## 🧪 Testing the 7 Scenarios

| # | Scenario | Expected Behavior |
|:--|:---------|:------------------|
| 1 | **Hold Still** | Exactly 1 view is captured; duplicate frames are rejected by dHash. |
| 2 | **Rotate Slowly** | Automatically captures 4 distinct views, one for each side. |
| 3 | **Shake Device/Product** | Motion state stays `MOVING`; 0 captures during shake. |
| 4 | **Too Far Away** | Status prompts *"Move closer"*; capture gated until size $\ge 12\%$. |
| 5 | **Too Close / Full Frame** | Status prompts *"Move back slightly"*; capture gated. |
| 6 | **Dim Lighting** | Status prompts *"Improve lighting"*; capture gated. |
| 7 | **Fast Rotation** | System waits for stability before locking in a sharp frame. |

---

## 📂 Project Structure

```
├── index.html              # Main scanning interface & overlays
├── css/
│   └── styles.css          # Glassmorphism UI & responsive HUD styling
├── js/
│   ├── config.js           # Central configuration & tunable thresholds
│   ├── camera.js           # getUserMedia & ImageCapture controller
│   ├── pipeline.js         # rVFC frame loop & worker message bridge
│   ├── tracker.js          # Motion tracking & stability state machine
│   ├── quality.js          # Laplacian sharpness & exposure scoring
│   ├── perceptual-hash.js  # dHash computation & Hamming distance dedup
│   ├── capture-manager.js  # Auto-capture sequencer & dataset manager
│   ├── ui-renderer.js      # Canvas HUD & thumbnail renderer
│   └── main.js             # Application orchestrator
├── workers/
│   └── cv-worker.js        # OpenCV.js Web Worker for contour detection
└── test-suite.mjs          # Unit tests for core algorithms
```
