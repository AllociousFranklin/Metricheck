import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Badge } from './Badge';

export type ComplianceStatus =
  | 'COMPLIANT' | 'PASS' | 'PRESENT' | 'ACCEPTED'
  | 'NON_COMPLIANT' | 'FAIL' | 'MISSING' | 'REJECTED'
  | 'NEEDS_REVIEW' | 'REVIEW' | 'UNCERTAIN' | 'PENDING'
  | 'IN_PROGRESS' | 'DRAFT';

interface StatusBadgeProps {
  status: ComplianceStatus;
  label?: string; // Optional override for the text
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase();
  
  let variant: 'success' | 'error' | 'warning' | 'info' = 'info';
  let Icon = Info;
  let defaultLabel = 'Unknown';

  if (['COMPLIANT', 'PASS', 'PRESENT', 'ACCEPTED'].includes(normalizedStatus)) {
    variant = 'success';
    Icon = CheckCircle;
    defaultLabel = normalizedStatus === 'COMPLIANT' ? 'Compliant' : normalizedStatus === 'PASS' ? 'Passed' : normalizedStatus === 'PRESENT' ? 'Present' : 'Accepted';
  } else if (['NON_COMPLIANT', 'FAIL', 'MISSING', 'REJECTED'].includes(normalizedStatus)) {
    variant = 'error';
    Icon = XCircle;
    defaultLabel = normalizedStatus === 'NON_COMPLIANT' ? 'Non-Compliant' : normalizedStatus === 'FAIL' ? 'Failed' : normalizedStatus === 'MISSING' ? 'Missing' : 'Rejected';
  } else if (['NEEDS_REVIEW', 'REVIEW', 'UNCERTAIN', 'PENDING'].includes(normalizedStatus)) {
    variant = 'warning';
    Icon = AlertTriangle;
    defaultLabel = normalizedStatus.replace('_', ' ');
    defaultLabel = defaultLabel.charAt(0).toUpperCase() + defaultLabel.slice(1).toLowerCase();
  } else if (['IN_PROGRESS', 'DRAFT'].includes(normalizedStatus)) {
    variant = 'info';
    Icon = Info;
    defaultLabel = normalizedStatus === 'IN_PROGRESS' ? 'In Progress' : 'Draft';
  }

  const displayText = label || defaultLabel;

  return (
    <Badge variant={variant} className={className}>
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {displayText}
    </Badge>
  );
}
