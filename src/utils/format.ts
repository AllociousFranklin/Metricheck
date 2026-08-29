import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'dd MMM yyyy');
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), 'dd MMM yyyy, hh:mm a');
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatScore(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getConfidenceLabel(confidence: number): { label: string; color: string } {
  if (confidence >= 0.85) return { label: 'High Confidence', color: 'text-success' };
  if (confidence >= 0.60) return { label: 'Moderate Confidence', color: 'text-warning' };
  return { label: 'Needs Review', color: 'text-error' };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLIANT':
    case 'PASS':
    case 'PRESENT':
    case 'ACCEPTED':
      return 'text-success';
    case 'NON_COMPLIANT':
    case 'FAIL':
    case 'MISSING':
    case 'REJECTED':
      return 'text-error';
    case 'NEEDS_REVIEW':
    case 'REVIEW':
    case 'UNCERTAIN':
    case 'PENDING':
    case 'FURTHER_REVIEW':
      return 'text-warning';
    default:
      return 'text-neutral-600';
  }
}

export function getStatusBgColor(status: string): string {
  switch (status) {
    case 'COMPLIANT':
    case 'PASS':
    case 'PRESENT':
    case 'ACCEPTED':
      return 'bg-white border-l-4 border-l-success text-success-700';
    case 'NON_COMPLIANT':
    case 'FAIL':
    case 'MISSING':
    case 'REJECTED':
      return 'bg-white border-l-4 border-l-error text-error-700';
    case 'NEEDS_REVIEW':
    case 'REVIEW':
    case 'UNCERTAIN':
    case 'PENDING':
    case 'FURTHER_REVIEW':
      return 'bg-white border-l-4 border-l-warning text-warning-700';
    case 'IN_PROGRESS':
    case 'DRAFT':
      return 'bg-white border-l-4 border-l-info text-info-700';
    default:
      return 'bg-neutral-25 text-neutral-600';
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'HIGH': return 'bg-white border-l-4 border-l-error text-error-700 border-error-200';
    case 'MEDIUM': return 'bg-white border-l-4 border-l-warning text-warning-700 border-warning-200';
    case 'LOW': return 'bg-white border-l-4 border-l-info text-info-700 border-info-200';
    default: return 'bg-neutral-25 text-neutral-600 border-neutral-200';
  }
}
