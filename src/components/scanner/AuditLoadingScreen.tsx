import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Scan, 
  FileCheck2, 
  CheckCircle2, 
  Terminal, 
  Layers, 
  Eye
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface AuditLoadingScreenProps {
  images: { blob: File | Blob; previewUrl: string }[];
}

const STAGES = [
  {
    id: 'ingest',
    title: 'Multi-View Perspective Normalization',
    desc: 'Ingesting perspective frames and aligning aspect ratios',
    icon: Layers,
  },
  {
    id: 'ocr',
    title: 'Gemini Multimodal OCR Extraction',
    desc: 'Parsing text, declarations, MRP, Net Qty, & Manufacturer details',
    icon: Cpu,
  },
  {
    id: 'rules',
    title: 'Legal Metrology Statutory Verification',
    desc: 'Testing compliance against PCR 2011 Rules 6(1)(a)-(e) & Schedule II',
    icon: ShieldCheck,
  },
  {
    id: 'synthesis',
    title: 'Compliance Scoring & Certificate Synthesis',
    desc: 'Generating structured compliance report & legal finding registry',
    icon: FileCheck2,
  }
];

const LOG_MESSAGES = [
  'Ingesting captured package views into multimodal vision pipeline...',
  'Normalizing RGB color space & computing edge sharpness metrics...',
  'Connecting to Gemini 2.5 Multimodal OCR engine...',
  'Extracting mandatory declarations: Manufacturer, Packer & Importer details...',
  'Detecting Commodity Name & Net Quantity standard metric units...',
  'Scanning Retail Sale Price (MRP) declaration & tax compliance phrasing...',
  'Validating Month & Year of Manufacture format...',
  'Cross-checking Consumer Care contact channels (Email & Helpline)...',
  'Executing Legal Metrology (Packaged Commodities) Rules, 2011 checks...',
  'Verifying Second Schedule standardized package sizes...',
  'Synthesizing compliance verdict and generating statutory audit report...'
];

export const AuditLoadingScreen: React.FC<AuditLoadingScreenProps> = ({ images }) => {
  const [progress, setProgress] = useState(14);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [logs, setLogs] = useState<string[]>([LOG_MESSAGES[0]]);
  const simulatedBoxes = [
    { top: 22, left: 18, width: 48, height: 20, label: 'MFG_DECLARATION' },
    { top: 52, left: 24, width: 38, height: 16, label: 'NET_QTY: 200g' },
    { top: 72, left: 42, width: 44, height: 18, label: 'MRP_INCL_TAX' }
  ];

  // Smooth progress increment
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 96;
        const inc = Math.random() * 6 + 3;
        const next = Math.min(96, Math.round(prev + inc));
        
        if (next < 30) setCurrentStageIdx(0);
        else if (next < 65) setCurrentStageIdx(1);
        else if (next < 90) setCurrentStageIdx(2);
        else setCurrentStageIdx(3);
        
        return next;
      });
    }, 400);

    return () => clearInterval(progressTimer);
  }, []);

  // Cycle preview images for multi-view scanner effect
  useEffect(() => {
    if (images.length <= 1) return;
    const imgTimer = setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % images.length);
    }, 1800);
    return () => clearInterval(imgTimer);
  }, [images.length]);

  // Stream terminal logs
  useEffect(() => {
    let msgIdx = 1;
    const logTimer = setInterval(() => {
      if (msgIdx < LOG_MESSAGES.length) {
        setLogs((prev) => [...prev.slice(-3), LOG_MESSAGES[msgIdx]]);
        msgIdx++;
      }
    }, 850);
    return () => clearInterval(logTimer);
  }, []);

  const activeImage = images[activeImageIdx] || images[0];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Banner & Progress */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-800 relative overflow-hidden">
        {/* Glowing Background Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>AI Multimodal Compliance Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Executing Legal Metrology Audit</span>
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </h2>
            <p className="text-sm text-neutral-400 max-w-xl">
              Analyzing {images.length} package view{images.length > 1 ? 's' : ''} across mandatory statutory declarations under the Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>
          </div>

          {/* Radial Progress Counter */}
          <div className="flex items-center gap-4 self-start md:self-auto bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-neutral-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-500 transition-all duration-500 ease-out"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-bold text-white font-mono">{progress}%</span>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-neutral-400">Current Phase</div>
              <div className="text-sm font-bold text-blue-400 truncate max-w-[140px]">
                {STAGES[currentStageIdx]?.title.split(' ')[0]} Engine
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 w-full bg-neutral-800/70 h-2 rounded-full overflow-hidden relative">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full"
            initial={{ width: '10%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
          />
        </div>
      </div>

      {/* Main Grid: Holographic Laser Scanner + Stage Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Futuristic Laser-Scanned Holographic Preview */}
        <div className="lg:col-span-6 bg-neutral-900 rounded-3xl p-5 border border-neutral-800 shadow-xl flex flex-col justify-between overflow-hidden relative group">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-neutral-400">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Multi-Angle Frame Inspection</span>
            </span>
            <span className="font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
              Angle {activeImageIdx + 1} of {images.length}
            </span>
          </div>

          {/* Laser Scanning Viewport */}
          <div className="relative w-full h-[300px] sm:h-[340px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800/80 flex items-center justify-center">
            {activeImage?.previewUrl ? (
              <img
                src={activeImage.previewUrl}
                alt="Package View Scanning"
                className="w-full h-full object-contain filter contrast-105 brightness-95"
              />
            ) : (
              <div className="text-neutral-500 flex flex-col items-center gap-2">
                <Scan className="w-12 h-12 text-blue-500 animate-pulse" />
                <span className="text-xs">Processing Visual Input</span>
              </div>
            )}

            {/* Glowing Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Holographic Laser Beam Sweeper */}
            <motion.div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_18px_4px_rgba(34,211,238,0.8)] pointer-events-none z-20"
              animate={{
                top: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Simulated Live OCR Bounding Boxes */}
            <AnimatePresence>
              {simulatedBoxes.map((box, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.2, repeat: Infinity, repeatType: 'reverse', duration: 2 }}
                  className="absolute border-2 border-emerald-400 bg-emerald-500/10 rounded pointer-events-none z-10"
                  style={{
                    top: `${box.top}%`,
                    left: `${box.left}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                >
                  <span className="absolute -top-5 left-0 bg-emerald-500 text-neutral-950 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    {box.label}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* View Angle Pill Indicator */}
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1 rounded-lg border border-neutral-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE OCR TRACKER ACTIVE</span>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={cn(
                    "relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer",
                    activeImageIdx === idx 
                      ? "border-blue-500 shadow-[0_0_10px_#3b82f6] scale-105" 
                      : "border-neutral-800 opacity-50 hover:opacity-100"
                  )}
                >
                  <img src={img.previewUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-mono text-center text-white">
                    V{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: 4-Stage AI Pipeline Execution List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <span>Statutory Verification Pipeline</span>
            </h3>

            <div className="space-y-3">
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isCurrent = idx === currentStageIdx;
                const isComplete = idx < currentStageIdx;

                return (
                  <motion.div
                    key={stage.id}
                    layout
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex items-start gap-4",
                      isCurrent
                        ? "bg-blue-50/50 border-blue-300 shadow-sm ring-1 ring-blue-400/30"
                        : isComplete
                        ? "bg-emerald-50/30 border-emerald-200"
                        : "bg-neutral-50/60 border-neutral-200/80 opacity-60"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                      isCurrent
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : isComplete
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                        : "bg-neutral-200 text-neutral-500"
                    )}>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Icon className="w-5 h-5 animate-pulse" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={cn(
                          "text-sm font-bold truncate",
                          isCurrent ? "text-blue-900" : isComplete ? "text-emerald-950" : "text-neutral-700"
                        )}>
                          {stage.title}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">
                            Processing
                          </span>
                        )}
                        {isComplete && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Passed ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {stage.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Live Telemetry Terminal Stream */}
          <div className="bg-neutral-950 text-neutral-300 rounded-3xl p-5 border border-neutral-800 shadow-xl space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live AI Audit Stream</span>
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                STREAMING
              </span>
            </div>

            <div className="space-y-1.5 pt-1 min-h-[85px] flex flex-col justify-end">
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 text-neutral-400"
                >
                  <span className="text-blue-400 font-bold">{'>'}</span>
                  <span className={cn(i === logs.length - 1 ? "text-emerald-300 font-medium" : "text-neutral-400")}>
                    {log}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
