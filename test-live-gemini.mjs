import { extractLabelFields } from './backend/gemini-extractor.js';
import { prepareImageForGemini } from './backend/preprocessing.js';
import { normalizeExtractedFields } from './backend/field-normalizer.js';
import { runComplianceCheck } from './backend/rule-engine.js';
import { buildComplianceReport, formatReportAsMarkdown } from './backend/report-builder.js';

console.log('Testing live Gemini API with key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : 'NOT SET');

// Sample test image (1x1 transparent PNG)
const samplePng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const prep = prepareImageForGemini(`data:image/png;base64,${samplePng}`);

console.log('\nSending test image to Gemini API...');
const result = await extractLabelFields([prep], {
  model: 'gemini-2.5-flash',
  allowMock: false
});

console.log('\n--- Gemini API Response ---');
if (result.success) {
  console.log('✓ Gemini API Call Successful!');
  console.log('Images Analyzed:', result.data.images_analyzed);
  console.log('Sample Extracted Fields:');
  console.log(JSON.stringify(result.data.fields, null, 2).substring(0, 500) + '...\n');

  const normalized = normalizeExtractedFields(result.data.fields);
  const audit = runComplianceCheck(normalized);
  const report = buildComplianceReport({ imageCount: 1 }, normalized, audit);
  console.log('✓ Compliance Audit Complete:');
  console.log(formatReportAsMarkdown(report));
} else {
  console.error('✗ Gemini API Error:', result.error);
}
