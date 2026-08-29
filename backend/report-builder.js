/**
 * report-builder.js - Structured Compliance Report Generator
 * Packages extracted data, rule engine audits, confidence metrics, and audit trail into a clean API response.
 */

import { randomUUID } from 'crypto';

/**
 * Generates a unique scan ID
 */
function generateScanId() {
  if (typeof randomUUID === 'function') {
    return `scan_${randomUUID().substring(0, 8)}`;
  }
  return `scan_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Builds the final Legal Metrology compliance audit report.
 * @param {Object} productMeta - { imageCount, scanDurationMs, notes }
 * @param {Object} normalizedFields - Output from field-normalizer
 * @param {Object} checkResults - Output from rule-engine
 * @returns {Object} Structured compliance report
 */
export function buildComplianceReport(productMeta = {}, normalizedFields = {}, checkResults = {}) {
  const scanId = generateScanId();
  const timestamp = new Date().toISOString();

  const commodityName = normalizedFields.commodity_name || 'Unidentified Commodity';
  const imagesAnalyzed = productMeta.imageCount || 4;

  const report = {
    scan_id: scanId,
    timestamp: timestamp,
    product: {
      commodity_name: commodityName,
      images_analyzed: imagesAnalyzed,
      scan_notes: productMeta.notes || "Standard multi-view scan processed."
    },
    summary: checkResults.summary || {
      total_checks: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      overall_compliant: false,
      compliance_grade: "UNKNOWN"
    },
    compliance: checkResults.checks || [],
    extracted_fields: normalizedFields,
    metadata: {
      engine_version: "Legal Metrology Compliance Engine v1.0",
      rules_reference: "The Legal Metrology (Packaged Commodities) Rules, 2011 (G.S.R. 202(E))",
      disclaimer: "Font size and principal display panel area measurements excluded from this report (pending Constraint #3)."
    }
  };

  return report;
}

/**
 * Converts report into a human-readable text / markdown summary
 */
export function formatReportAsMarkdown(report) {
  const s = report.summary;
  let md = `# Legal Metrology Compliance Report\n\n`;
  md += `**Scan ID:** \`${report.scan_id}\` | **Date:** ${new Date(report.timestamp).toLocaleString()}\n`;
  md += `**Commodity:** ${report.product.commodity_name} | **Images Analyzed:** ${report.product.images_analyzed}\n`;
  md += `**Overall Status:** **${s.compliance_grade}** (${s.passed}/${s.total_checks} Checks Passed, ${s.failed} Failed, ${s.warnings} Warnings)\n\n`;

  md += `## Detailed Checklist\n\n`;
  md += `| Declaration | Rule Reference | Status | Details |\n`;
  md += `|:------------|:---------------|:------:|:--------|\n`;

  for (const c of report.compliance) {
    const icon = c.status === 'PASS' ? '✅ PASS' : c.status === 'WARNING' ? '⚠️ WARN' : '❌ FAIL';
    md += `| **${c.label}** | \`${c.rule_ref}\` | ${icon} | ${c.message} |\n`;
  }

  md += `\n> *${report.metadata.disclaimer}*\n`;
  return md;
}
