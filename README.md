# Multi-View Package Scanner & Legal Metrology Compliance Engine

An end-to-end client/server system for:
1. **Constraint #1**: Live multi-view package capture with zero button presses + Dynamic Batch Image Upload option.
2. **Constraint #2**: Multimodal Gemini label extraction and deterministic Legal Metrology rules cross-check (`legal_metrology_rules.json`).

---

## 🎯 Input Options

### Option A: 📹 Live Camera Auto-Scanner
- Optimized for mobile rear cameras (`facingMode: environment`, `playsinline`, auto-focus/exposure).
- Real-time pure JS & OpenCV.js Laplacian blur detection running in a dedicated Web Worker.
- Motion tracking state machine (`MOVING` vs `STABLE`).
- 5-point quality gate (Laplacian blur, glare detection, framing, brightness histogram, aspect ratio).
- Perceptual hash (`dHash`) deduplication to capture distinct angles hands-free.
- User-controlled **"✓ Done Scanning"** button to finalize scanning at any view count.

### Option B: 📁 Batch Image Upload
- Dynamic gallery supporting any number of package photos ($N \ge 1$).
- Drag-and-drop or select images with individual angle preview cards and remove controls.
- Click **"Run Legal Metrology Audit"** to process immediately through the compliance engine.

---

## 🚀 Deploying to Vercel

The project is structured with native Vercel serverless function support in `api/audit.js` and configuration in `vercel.json`.

### Option 1: Deploy with Vercel CLI
```bash
npm install -g vercel
vercel
```
When prompted:
- Link to existing project? **No (create new)**
- Set Environment Variable in Vercel:
  - `GEMINI_API_KEY`: Your Gemini API key

### Option 2: Deploy with GitHub
1. Push this repository to GitHub.
2. Import the repo in [Vercel Dashboard](https://vercel.com/new).
3. Under **Settings → Environment Variables**, add:
   - Key: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key`
4. Click **Deploy**.

---

## 💻 Local Development

### Start Local Server
```bash
npm start
```
Open **`http://localhost:3000`** in your browser.

### Run All Unit & Integration Tests (53 Tests)
```bash
npm test
```
