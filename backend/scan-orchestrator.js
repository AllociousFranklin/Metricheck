/**
 * scan-orchestrator.js - End-to-End Scanning & Compliance Coordinator
 * Orchestrates: Preprocessing -> Multimodal Gemini Extraction -> Field Normalization -> Rule Engine -> Final Report.
 */

import { prepareImageBatch } from './preprocessing.js';
import { extractLabelFields } from './gemini-extractor.js';
import { normalizeExtractedFields } from './field-normalizer.js';
import { runComplianceCheck } from './rule-engine.js';
import { buildComplianceReport } from './report-builder.js';

/**
 * Runs the full end-to-end Legal Metrology compliance pipeline on 1-4 captured package views.
 * @param {Array<string|Buffer>} imageBuffers - 1 to 4 captured package images (base64, dataURL, or Buffer)
 * @param {Object} options - { apiKey, model, notes }
 * @returns {Promise<Object>} Final structured compliance report
 */
export async function processFullScan(imageBuffers, options = {}) {
  const startTime = performance.now();

  if (!Array.isArray(imageBuffers) || imageBuffers.length === 0) {
    throw new Error('processFullScan: At least 1 image is required for compliance audit');
  }

  // 1. Image Preprocessing
  const preparedImages = prepareImageBatch(imageBuffers);

  // 2. Multimodal Gemini API Extraction (single call across all views)
  const extractionResult = await extractLabelFields(preparedImages, options);

  if (!extractionResult.success) {
    throw new Error(`Extraction Stage Failed: ${extractionResult.error}`);
  }

  const rawFields = extractionResult.data?.fields || {};
  const scanNotes = extractionResult.data?.notes || options.notes || "Multi-view scan analyzed.";

  // 3. Field Normalization & Unit Standardization
  const normalizedFields = normalizeExtractedFields(rawFields);

  // 4. Deterministic Rule Engine Compliance Audit
  const checkResults = runComplianceCheck(normalizedFields, scanNotes);

  // 5. Build Final Compliance Report
  const durationMs = Math.round(performance.now() - startTime);

  const report = buildComplianceReport(
    {
      imageCount: preparedImages.length,
      scanDurationMs: durationMs,
      notes: scanNotes
    },
    normalizedFields,
    checkResults
  );

  return report;
}
