import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download, FileEdit, ArrowLeft, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { getReport, exportReport } from '@/services/reportApi';
import { APP_CONFIG } from '@/app/config';

export const ReportPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['report', id],
    queryFn: () => getReport(id!),
    enabled: !!id,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = async () => {
    if (!report) return;
    try {
      const blob = await exportReport(report.id, 'json');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metricheck_report_${report.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Direct client fallback
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = `metricheck_report_${report.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  useEffect(() => {
    if (searchParams.get('print') === 'true' && report) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, report]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading report...</div>;
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center">
        <p className="text-error mb-4">Failed to load report.</p>
        <Button onClick={() => navigate('/reports')}>Back to Reports</Button>
      </div>
    );
  }

  const isCompliant = report.assessmentResult === 'COMPLIANT';

  return (
    <div className="min-h-screen bg-transparent pb-12">
      {/* Action Bar - Hidden on Print */}
      <div className="bg-white border-b border-neutral-200 p-4 sticky top-0 z-10 print:hidden flex justify-between items-center shadow-sm">
        <Button variant="ghost" onClick={() => navigate('/reports')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJson}>
            <FileEdit className="w-4 h-4 mr-2" /> Export JSON / Editable
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Report Container */}
      <div className="max-w-4xl mx-auto mt-8 bg-white p-10 shadow-lg print:shadow-none print:mt-0 print:p-0">
        
        {/* Report Header */}
        <div className="text-center border-b-2 border-primary pb-6 mb-8">
          <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold text-primary uppercase tracking-wider mb-2">
            METRICHECK Compliance Assessment Report
          </h1>
          <p className="text-neutral-600">Generated on {new Date(report.generatedAt || report.generatedDate || Date.now()).toLocaleString()}</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <h2 className="font-bold text-neutral-900 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wide">Inspection Details</h2>
            <div className="space-y-2">
              <p><span className="font-semibold text-neutral-600 inline-block w-32">Report ID:</span> {report.id}</p>
              <p><span className="font-semibold text-neutral-600 inline-block w-32">Inspection ID:</span> {report.inspectionId}</p>
              <p><span className="font-semibold text-neutral-600 inline-block w-32">Date:</span> {new Date(report.inspectionDate || report.generatedAt || Date.now()).toLocaleDateString()}</p>
              <p><span className="font-semibold text-neutral-600 inline-block w-32">Inspector:</span> {report.inspectorName}</p>
            </div>
          </div>
          <div>
            <h2 className="font-bold text-neutral-900 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wide">Product Details</h2>
            <div className="space-y-2">
              <p><span className="font-semibold text-neutral-600 inline-block w-32">Product Name:</span> {report.productName}</p>
              <p><span className="font-semibold text-neutral-600 inline-block w-32">Manufacturer:</span> {report.manufacturer || 'Declared Entity'}</p>
              <p><span className="font-semibold text-neutral-600 inline-block w-32">Category:</span> {report.category || 'Packaged Commodity'}</p>
            </div>
          </div>
        </div>

        {/* Assessment Result */}
        <div className={cn(
          "p-6 rounded border-2 mb-8 text-center",
          isCompliant ? "bg-white border-l-4 border-l-success border-success/30" : "bg-white border-l-4 border-l-error border-error/30"
        )}>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Final Assessment Result</h2>
          <div className={cn(
            "text-2xl font-bold uppercase tracking-wider mb-2",
            isCompliant ? "text-success" : "text-error"
          )}>
            {isCompliant ? "COMPLIANT" : "POTENTIAL NON-COMPLIANCE"}
          </div>
          <p className="text-neutral-700">Compliance Score: <span className="font-bold">{report.complianceScore ?? report.score ?? 100}%</span></p>
        </div>

        {/* Summary Stats */}
        <div className="mb-8">
          <h2 className="font-bold text-neutral-900 border-b border-neutral-200 pb-2 mb-4 uppercase tracking-wide">Assessment Summary</h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-neutral-25 p-4 rounded text-center border border-neutral-200">
              <p className="text-3xl font-bold text-success mb-1">{report.summary?.passedChecks ?? report.passedChecks ?? 0}</p>
              <p className="text-xs text-neutral-600 uppercase font-semibold">Checks Passed</p>
            </div>
            <div className="flex-1 bg-neutral-25 p-4 rounded text-center border border-neutral-200">
              <p className="text-3xl font-bold text-error mb-1">{report.summary?.totalFindings ?? report.failedChecks ?? 0}</p>
              <p className="text-xs text-neutral-600 uppercase font-semibold">Total Findings</p>
            </div>
            <div className="flex-1 bg-neutral-25 p-4 rounded text-center border border-neutral-200">
              <p className="text-3xl font-bold text-warning mb-1">{report.summary?.pendingReviews ?? report.reviewChecks ?? 0}</p>
              <p className="text-xs text-neutral-600 uppercase font-semibold">Pending Reviews</p>
            </div>
          </div>
        </div>

        {/* Findings Details */}
        {report.findings && report.findings.length > 0 && (
          <div className="mb-8 page-break-inside-avoid">
            <h2 className="font-bold text-neutral-900 border-b border-neutral-200 pb-2 mb-4 uppercase tracking-wide">Detailed Findings</h2>
            <div className="space-y-6">
              {report.findings.map((finding: any, index: number) => (
                <div key={finding.id} className="border border-neutral-200 rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-neutral-900">{index + 1}. {finding.type} - {finding.field}</h3>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded uppercase",
                      finding.severity === 'HIGH' ? "bg-white border-l-4 border-l-error text-error" :
                      finding.severity === 'MEDIUM' ? "bg-white border-l-4 border-l-warning text-warning" : "bg-white border-l-4 border-l-info text-info"
                    )}>
                      {finding.severity} SEVERITY
                    </span>
                  </div>
                  <p className="text-sm text-neutral-700 mb-3">{finding.description}</p>
                  
                  <div className="bg-neutral-25 p-3 rounded text-sm mb-3">
                    <p className="font-semibold text-neutral-900 mb-1">Rule Reference:</p>
                    <p className="text-neutral-700">{finding.ruleReference}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="border border-error/20 bg-white border-l-4 border-l-error p-2 rounded">
                      <span className="block text-xs font-semibold text-error mb-1">Extracted Value:</span>
                      <span className="font-mono">{finding.extractedValue || 'N/A'}</span>
                    </div>
                    <div className="border border-success/20 bg-white border-l-4 border-l-success p-2 rounded">
                      <span className="block text-xs font-semibold text-success mb-1">Expected:</span>
                      <span className="font-mono">{finding.expectedValue || 'As per rules'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-neutral-200 text-center text-xs text-neutral-500 print:mt-auto">
          <p>Generated by METRICHECK Compliance Inspection Platform</p>
          <p>Rule Set Version: v{APP_CONFIG.ruleSetVersion}</p>
          <p className="mt-2 text-neutral-500">This document is system generated and may require manual verification.</p>
        </div>

      </div>
    </div>
  );
};

