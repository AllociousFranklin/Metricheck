import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload, X, CheckCircle, AlertTriangle, Scan, Camera, ShieldAlert, Check, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { runLegalMetrologyAudit, AuditResponse, ComplianceCheck, ExtractedData } from '@/services/inspectionApi';
import { PackageAutoScanner, CapturedView } from '@/components/scanner/PackageAutoScanner';
import { cn } from '@/utils/cn';

export const NewInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [step, setStep] = useState<'capture' | 'processing' | 'results'>('capture');
  
  // Store dynamic captured/uploaded images
  const [capturedImages, setCapturedImages] = useState<{ blob: File | Blob; previewUrl: string }[]>([]);
  
  // Audit Results
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [editableExtracted, setEditableExtracted] = useState<ExtractedData>({});
  
  // Error handling
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleScannerCapture = (view: CapturedView) => {
    setCapturedImages(prev => [
      ...prev,
      { blob: view.blob, previewUrl: view.thumbnailUrl }
    ]);
  };

  const handleScannerComplete = (views: CapturedView[]) => {
    const formatted = views.map(v => ({ blob: v.blob, previewUrl: v.thumbnailUrl }));
    setCapturedImages(formatted);
    startAnalysisWithImages(formatted);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      const newImages = newFiles.map(file => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) return null;
        if (file.size > 20 * 1024 * 1024) return null;
        return { blob: file, previewUrl: URL.createObjectURL(file) };
      }).filter(Boolean) as { blob: File | Blob; previewUrl: string }[];
      
      setCapturedImages(prev => [...prev, ...newImages]);
      setErrorMsg(null);
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      const newImages = newFiles.map(file => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) return null;
        if (file.size > 20 * 1024 * 1024) return null;
        return { blob: file, previewUrl: URL.createObjectURL(file) };
      }).filter(Boolean) as { blob: File | Blob; previewUrl: string }[];
      
      setCapturedImages(prev => [...prev, ...newImages]);
      setErrorMsg(null);
    }
  };

  const startAnalysisWithImages = async (imagesToAudit: { blob: File | Blob; previewUrl: string }[]) => {
    if (imagesToAudit.length === 0) {
      setErrorMsg('Please capture or upload at least 1 image before auditing.');
      return;
    }
    
    setStep('processing');
    setErrorMsg(null);
    
    try {
      const blobs = imagesToAudit.map(img => img.blob);
      const result = await runLegalMetrologyAudit(blobs);
      
      setAuditData(result);
      setEditableExtracted(result.extractedData);
      setStep('results');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to complete compliance audit.');
      setStep('capture');
    }
  };

  const startAnalysis = async () => {
    await startAnalysisWithImages(capturedImages);
  };

  const handleFieldChange = (key: keyof ExtractedData, newValue: string) => {
    setEditableExtracted(prev => ({ ...prev, [key]: newValue }));
  };

  const confirmResults = () => {
    if (auditData?.scanId) {
      navigate(`/inspections/${auditData.scanId}`);
    } else {
      navigate('/inspections');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <Check className="w-5 h-5 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'FAIL': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-neutral-500" />;
    }
  };

  const renderField = (key: keyof ExtractedData, label: string) => {
    return (
      <div className="mb-3">
        <label className="block text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wider">{label}</label>
        <Input 
          value={editableExtracted[key] || ''}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          placeholder={`Not detected on package`}
          className="w-full text-sm font-medium"
        />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-12 px-2 sm:px-0">
      <PageHeader
        title="New Compliance Inspection"
        subtitle="Multi-View Auto-Capture & Multimodal AI Legal Metrology Audit"
      />

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-l-red-500 text-red-700 p-3 sm:p-4 rounded-md flex items-center justify-between text-sm">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setErrorMsg(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {step === 'capture' && (
        <div className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center sm:justify-start gap-2 bg-neutral-100 p-1.5 rounded-xl max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                activeTab === 'camera'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Live Auto-Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                activeTab === 'upload'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Batch Upload</span>
            </button>
          </div>

          {activeTab === 'camera' && (
            <PackageAutoScanner
              onCapture={handleScannerCapture}
              onComplete={handleScannerComplete}
              suggestedViews={4}
            />
          )}

          {activeTab === 'upload' && (
            <Card className="bg-white shadow-sm border-neutral-100">
              <CardContent className="p-4 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Upload Package Photos</h3>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                    Upload photos covering all available angles of the package (1 or more views).
                  </p>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-200 hover:border-blue-500/60 rounded-2xl p-8 text-center cursor-pointer transition-all bg-neutral-50/50 hover:bg-blue-50/20 flex flex-col items-center justify-center gap-3"
                >
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    multiple
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">
                      Click to browse or drag & drop package photos
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Supports JPG, PNG, WebP (Upload 1, 2, 4, 6 or any number of angles)
                    </p>
                  </div>
                </div>

                {/* Uploaded Gallery Grid */}
                {capturedImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
                      <span>{capturedImages.length} Image{capturedImages.length > 1 ? 's' : ''} Ready for Audit</span>
                      <button
                        type="button"
                        onClick={() => setCapturedImages([])}
                        className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {capturedImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 shadow-sm"
                        >
                          <img
                            src={img.previewUrl}
                            alt={`Uploaded View ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(idx);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-all"
                            aria-label="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-1 left-1.5 text-[10px] font-mono font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">
                            #{idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-100 flex justify-end">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={startAnalysis}
                    disabled={capturedImages.length === 0}
                    className="w-full sm:w-auto px-8 justify-center shadow-md cursor-pointer"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    <span>Run Legal Metrology Audit ({capturedImages.length} Photos)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Captured Preview Strip when in Camera tab with images */}
          {activeTab === 'camera' && capturedImages.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-xl border border-neutral-100 shadow-sm gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-700">
                  {capturedImages.length} distinct angles captured
                </span>
              </div>
              <Button
                variant="primary"
                onClick={startAnalysis}
                className="w-full sm:w-auto px-6 cursor-pointer"
              >
                <Scan className="w-4 h-4 mr-2" />
                <span>Run Compliance Audit on Captured Views</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {step === 'processing' && (
        <Card className="bg-white shadow-sm border-neutral-100 text-center py-16">
          <CardContent className="flex flex-col items-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-neutral-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              <Scan className="absolute inset-0 m-auto w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              Executing Legal Metrology Compliance Audit
            </h3>
            <p className="text-sm text-neutral-500 max-w-md px-4">
              Running Gemini Multimodal OCR extraction across captured package views & deterministic statutory rule verification...
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'results' && auditData && (
        <div className="space-y-6">
          {/* Top Grade Banner */}
          <Card
            className={cn(
              'border-t-4',
              auditData.overallStatus === 'FULLY COMPLIANT'
                ? 'border-t-emerald-500'
                : auditData.overallStatus === 'NON-COMPLIANT'
                ? 'border-t-red-500'
                : 'border-t-amber-500'
            )}
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <p className="text-xs font-mono text-neutral-500">Scan ID: {auditData.scanId}</p>
                  <h2 className="text-2xl font-bold mt-1 text-neutral-900">{auditData.overallStatus}</h2>
                  <p className="text-xs text-neutral-600 mt-1">
                    Audit completed on {new Date(auditData.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
                  <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center min-w-[90px]">
                    <p className="text-2xl font-bold text-emerald-600">{auditData.summary.passed}</p>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase">Passed</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-center min-w-[90px]">
                    <p className="text-2xl font-bold text-amber-600">{auditData.summary.warnings}</p>
                    <p className="text-[10px] font-bold text-amber-700 uppercase">Warnings</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl text-center min-w-[90px]">
                    <p className="text-2xl font-bold text-red-600">{auditData.summary.failed}</p>
                    <p className="text-[10px] font-bold text-red-700 uppercase">Failed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rule Engine Results */}
            <Card className="bg-white shadow-sm border-neutral-100 flex flex-col">
              <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 py-4">
                <CardTitle className="text-base font-bold text-neutral-800">
                  Statutory Rule Engine Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-grow overflow-y-auto max-h-[500px]">
                <div className="divide-y divide-neutral-100">
                  {auditData.checks.map((check, idx) => (
                    <div key={idx} className="p-4 hover:bg-neutral-50/60 transition-colors">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">{getStatusIcon(check.status)}</div>
                          <h4 className="font-semibold text-neutral-900 text-sm">{check.ruleName}</h4>
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                          {check.ruleReference}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 pl-7">{check.explanation}</p>
                      {check.detectedValue && (
                        <p className="text-xs text-neutral-800 pl-7 mt-1">
                          Detected:{' '}
                          <span className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded font-medium">
                            {check.detectedValue}
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Extracted Declarations */}
            <div className="space-y-6">
              <Card className="bg-white shadow-sm border-neutral-100">
                <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 py-4">
                  <CardTitle className="text-base font-bold text-neutral-800">
                    Extracted Declarations (Review / Edit)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 overflow-y-auto max-h-[420px]">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-blue-600 border-b border-neutral-100 pb-1 mb-3">
                        MANUFACTURER / PACKER
                      </h4>
                      {renderField('manufacturer_name', 'Manufacturer Name')}
                      {renderField('manufacturer_address', 'Manufacturer Address')}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-600 border-b border-neutral-100 pb-1 mb-3">
                        PRODUCT INFO & QUANTITY
                      </h4>
                      {renderField('commodity_name', 'Commodity Name')}
                      <div className="grid grid-cols-2 gap-3">
                        {renderField('net_quantity_value', 'Net Qty Value')}
                        {renderField('net_quantity_unit', 'Net Qty Unit')}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-600 border-b border-neutral-100 pb-1 mb-3">
                        PRICE & DATES
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {renderField('mrp_value', 'MRP Value')}
                        {renderField('month_year_of_manufacture', 'Manufacture Date')}
                      </div>
                      {renderField('mrp_raw_text', 'MRP Raw Text')}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-600 border-b border-neutral-100 pb-1 mb-3">
                        CONSUMER CARE
                      </h4>
                      {renderField('consumer_care_email', 'Email')}
                      {renderField('consumer_care_phone', 'Phone')}
                      {renderField('consumer_care_address', 'Address')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 justify-center"
                  onClick={() => setStep('capture')}
                >
                  Recapture Images
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 justify-center cursor-pointer shadow-md"
                  onClick={confirmResults}
                >
                  <span>Confirm & Open Full Report</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
