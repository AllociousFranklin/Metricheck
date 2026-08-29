import React, { useEffect, useRef, useState, useCallback } from 'react';
// @ts-ignore
import { CONFIG } from '../../../js/config.js';
// @ts-ignore
import { PackageCamera } from '../../../js/camera.js';
// @ts-ignore
import { FramePipeline } from '../../../js/pipeline.js';
// @ts-ignore
import { MotionTracker } from '../../../js/tracker.js';
// @ts-ignore
import { QualityScorer } from '../../../js/quality.js';
// @ts-ignore
import { CaptureManager } from '../../../js/capture-manager.js';
import { Zap, RotateCcw, Check, Sparkles } from 'lucide-react';

export interface CapturedView {
  id: number;
  thumbnailUrl: string;
  blob: Blob;
  hash: string;
  timestamp: string;
  metrics?: any;
}

interface PackageAutoScannerProps {
  onCapture?: (view: CapturedView, count: number, target: number) => void;
  onComplete?: (views: CapturedView[]) => void;
  suggestedViews?: number;
  maxViews?: number;
}

export const PackageAutoScanner: React.FC<PackageAutoScannerProps> = ({
  onCapture,
  onComplete,
  suggestedViews = 4,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [statusPrimary, setStatusPrimary] = useState('Align product in camera frame');
  const [statusSecondary, setStatusSecondary] = useState('Place against plain contrasting surface');
  const [badgeState, setBadgeState] = useState<'waiting' | 'moving' | 'stable' | 'error'>('waiting');

  const [motionVal, setMotionVal] = useState<'STABLE' | 'MOVING' | '--'>('--');
  const [sharpnessVal, setSharpnessVal] = useState<number | string>('--');
  const [lightingVal, setLightingVal] = useState<number | string>('--');

  const [capturedViews, setCapturedViews] = useState<CapturedView[]>([]);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cameraRef = useRef<any>(null);
  const pipelineRef = useRef<any>(null);
  const trackerRef = useRef<any>(null);
  const captureManagerRef = useRef<any>(null);

  const cleanup = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.destroy();
      pipelineRef.current = null;
    }
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
  }, []);

  const triggerFlash = () => {
    if (navigator.vibrate) {
      try { navigator.vibrate(50); } catch (e) {}
    }
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 350);
  };

  const drawBoundingBox = (
    ctx: CanvasRenderingContext2D,
    bbox: { x: number; y: number; width: number; height: number },
    corners: Array<{ x: number; y: number }> | null,
    qualityReport: any,
    procW: number,
    procH: number,
    displayWidth: number,
    displayHeight: number,
    videoEl: HTMLVideoElement
  ) => {
    const videoAspect = (videoEl.videoWidth || procW) / (videoEl.videoHeight || procH);
    const screenAspect = displayWidth / displayHeight;

    let scale: number, offsetX = 0, offsetY = 0;

    if (screenAspect > videoAspect) {
      scale = displayWidth / procW;
      const scaledH = procH * scale;
      offsetY = (displayHeight - scaledH) / 2;
    } else {
      scale = displayHeight / procH;
      const scaledW = procW * scale;
      offsetX = (displayWidth - scaledW) / 2;
    }

    const bx = bbox.x * scale + offsetX;
    const by = bbox.y * scale + offsetY;
    const bw = bbox.width * scale;
    const bh = bbox.height * scale;

    let boxColor = '#3b82f6';
    let glowColor = 'rgba(59, 130, 246, 0.5)';

    if (qualityReport) {
      if (qualityReport.isAcceptable) {
        boxColor = '#10b981';
        glowColor = 'rgba(16, 185, 129, 0.6)';
      } else if (qualityReport.badgeClass === 'state-moving') {
        boxColor = '#f59e0b';
        glowColor = 'rgba(245, 158, 11, 0.5)';
      } else if (qualityReport.badgeClass === 'state-error') {
        boxColor = '#ef4444';
        glowColor = 'rgba(239, 68, 68, 0.5)';
      }
    }

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2.5;

    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(bx + radius, by);
    ctx.lineTo(bx + bw - radius, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius);
    ctx.lineTo(bx + bw, by + bh - radius);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - radius, by + bh);
    ctx.lineTo(bx + radius, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - radius);
    ctx.lineTo(bx, by + radius);
    ctx.quadraticCurveTo(bx, by, bx + radius, by);
    ctx.closePath();
    ctx.stroke();

    const bracketLen = Math.min(24, Math.min(bw, bh) * 0.25);
    ctx.lineWidth = 4.5;

    ctx.beginPath();
    ctx.moveTo(bx, by + bracketLen);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + bracketLen, by);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bx + bw - bracketLen, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw, by + bracketLen);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bx, by + bh - bracketLen);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bracketLen, by + bh);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bx + bw - bracketLen, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by + bh - bracketLen);
    ctx.stroke();

    if (corners && corners.length === 4) {
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#ffffff';
      for (const pt of corners) {
        const px = pt.x * scale + offsetX;
        const py = pt.y * scale + offsetY;
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  const startScanner = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setErrorMsg(null);

    try {
      cleanup();

      const video = videoRef.current;
      const camera = new PackageCamera(video);
      cameraRef.current = camera;

      await camera.start();
      setHasTorch(camera.hasTorch());

      const tracker = new MotionTracker(CONFIG);
      trackerRef.current = tracker;

      const captureManager = new CaptureManager(camera, CONFIG);
      captureManagerRef.current = captureManager;

      captureManager.onCapture((viewRecord: any, currentCount: number, targetCount: number) => {
        triggerFlash();
        setCapturedViews((prev) => {
          const updated = [...prev, viewRecord];
          if (onCapture) onCapture(viewRecord, currentCount, targetCount);
          return updated;
        });
      });

      const workerPath = '/workers/cv-worker.js';
      const pipeline = new FramePipeline(video, workerPath, CONFIG);
      pipelineRef.current = pipeline;

      pipeline.onResult(async (detection: any) => {
        if (captureManager.isDone()) return;

        const procW = detection.procW || CONFIG.PROCESSING_WIDTH || 480;
        const procH = detection.procH || CONFIG.PROCESSING_HEIGHT || 360;

        const trackerState = tracker.update(detection.bbox, procW, procH);
        const qualityReport = QualityScorer.evaluate(detection, trackerState, CONFIG);

        if (qualityReport) {
          setStatusPrimary(qualityReport.feedbackPrimary || 'Scanning...');
          setStatusSecondary(qualityReport.feedbackSecondary || '');
          if (qualityReport.isAcceptable) setBadgeState('stable');
          else if (qualityReport.badgeClass === 'state-moving') setBadgeState('moving');
          else if (qualityReport.badgeClass === 'state-error') setBadgeState('error');
          else setBadgeState('waiting');
        }

        setMotionVal(trackerState.state === 'STABLE' ? 'STABLE' : 'MOVING');
        setSharpnessVal(detection.sharpness || 0);
        setLightingVal(detection.brightness || 0);

        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, rect.width, rect.height);
            if (detection && trackerState && trackerState.smoothedBbox) {
              drawBoundingBox(
                ctx,
                trackerState.smoothedBbox,
                detection.corners,
                qualityReport,
                procW,
                procH,
                rect.width,
                rect.height,
                video
              );
            }
          }
        }

        if (detection.hasDetection && qualityReport.isAcceptable && trackerState.isReadyForCapture) {
          await captureManager.evaluateAndCapture(detection, trackerState, qualityReport);
        }
      });

      pipeline.start();
    } catch (err: any) {
      console.error('Failed to start package auto-scanner:', err);
      setErrorMsg(err.message || 'Camera access failed');
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      cleanup();
    };
  }, []);

  const handleToggleTorch = async () => {
    if (cameraRef.current) {
      const isTorch = await cameraRef.current.toggleTorch();
      setTorchOn(isTorch);
    }
  };

  const handleReset = () => {
    if (trackerRef.current) trackerRef.current.reset();
    if (captureManagerRef.current) captureManagerRef.current.reset();
    setCapturedViews([]);
    if (pipelineRef.current && !pipelineRef.current.isRunning) {
      pipelineRef.current.start();
    }
  };

  const handleFinishScan = () => {
    if (capturedViews.length === 0) {
      setErrorMsg('Capture at least 1 angle before completing inspection.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    if (pipelineRef.current) pipelineRef.current.stop();
    if (captureManagerRef.current) captureManagerRef.current.finish();
    if (onComplete) {
      onComplete(capturedViews);
    }
  };

  const dotColorClass =
    badgeState === 'stable'
      ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
      : badgeState === 'moving'
      ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
      : badgeState === 'error'
      ? 'bg-red-400 shadow-[0_0_8px_#ef4444]'
      : 'bg-neutral-400';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] md:h-[580px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col justify-between"
    >
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {isFlashing && (
        <div className="absolute inset-0 bg-white/80 z-20 pointer-events-none transition-opacity duration-300" />
      )}

      <div className="relative z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-bold tracking-wider rounded bg-blue-600/30 text-blue-400 border border-blue-500/40 uppercase">
            Auto Scanner
          </span>
          <span className="text-xs text-neutral-300 font-medium hidden sm:inline">
            Constraint #1 Hands-Free Multi-View
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`p-2 rounded-full border backdrop-blur-md transition-all ${
                torchOn
                  ? 'bg-amber-500/30 border-amber-500/50 text-amber-300'
                  : 'bg-neutral-900/60 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
              }`}
              title="Toggle Flashlight"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-full bg-neutral-900/60 border border-neutral-700 text-neutral-300 hover:bg-neutral-800 backdrop-blur-md transition-all"
            title="Reset Scanner"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative z-30 self-center px-4 py-2 rounded-full border bg-neutral-900/80 border-neutral-700 backdrop-blur-md shadow-lg flex items-center gap-3 transition-all max-w-[90%]">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColorClass}`} />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white tracking-wide">{statusPrimary}</span>
          {statusSecondary && (
            <span className="text-[10px] text-neutral-400">{statusSecondary}</span>
          )}
        </div>
      </div>

      <div className="absolute top-16 right-4 z-30 bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-2.5 text-[11px] font-mono backdrop-blur-md flex flex-col gap-1 shadow-md text-neutral-300 pointer-events-none">
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">MOTION</span>
          <span
            className={`font-bold ${
              motionVal === 'STABLE' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {motionVal}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">SHARP</span>
          <span
            className={`font-bold ${
              Number(sharpnessVal) >= 80 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {sharpnessVal}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">LIGHT</span>
          <span
            className={`font-bold ${
              Number(lightingVal) >= 70 && Number(lightingVal) <= 200
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {lightingVal}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 text-white px-4 py-2 rounded-lg text-xs font-medium backdrop-blur-md shadow-lg">
          {errorMsg}
        </div>
      )}

      <div className="relative z-30 p-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-400 uppercase font-semibold tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Distinct Views Captured
          </span>
          <span className="font-mono font-bold text-white">
            {capturedViews.length} / {suggestedViews} views
          </span>
        </div>

        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.round((capturedViews.length / suggestedViews) * 100))}%`,
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none max-w-[calc(100%-140px)]">
            {Array.from({ length: Math.max(suggestedViews, capturedViews.length) }).map((_, idx) => {
              const view = capturedViews[idx];
              return (
                <div
                  key={idx}
                  className={`relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border transition-all ${
                    view
                      ? 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : idx === capturedViews.length
                      ? 'border-blue-500 border-dashed bg-blue-500/10'
                      : 'border-neutral-800 border-dashed bg-neutral-900/50'
                  }`}
                >
                  {view ? (
                    <>
                      <img
                        src={view.thumbnailUrl}
                        alt={`Angle ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-white drop-shadow">
                        ✓{idx + 1}
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-neutral-500 text-[11px] font-mono font-bold">
                      {idx + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleFinishScan}
            disabled={capturedViews.length === 0}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all shadow-md ${
              capturedViews.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-900/30'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Done ({capturedViews.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

