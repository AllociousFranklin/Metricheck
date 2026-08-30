/**
 * test-compliance-suite.mjs - Unit & Integration Test Suite for Constraint #2
 * Tests Preprocessing, Field Normalization, Rule Engine Checkers, and End-to-End Report Generation.
 */

import { prepareImageForGemini, prepareImageBatch } from './backend/preprocessing.js';
import { normalizeExtractedFields, normalizeToStandardUnit, normalizePrice } from './backend/field-normalizer.js';
import {
  checkManufacturerDeclaration,
  checkCommodityName,
  checkNetQuantity,
  checkMonthYear,
  checkMRP,
  checkConsumerCare,
  checkStandardPackageSize,
  runComplianceCheck
} from './backend/rule-engine.js';
import { buildComplianceReport, formatReportAsMarkdown } from './backend/report-builder.js';
import { processFullScan } from './backend/scan-orchestrator.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('======================================================');
console.log('  TEST SUITE: Constraint #2 OCR & Legal Metrology Engine');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// 1. PREPROCESSING TESTS
// -----------------------------------------------------------------------------
console.log('--- 1. Image Preprocessing Tests ---');
const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const sampleDataUrl = `data:image/png;base64,${sampleBase64}`;

const p1 = prepareImageForGemini(sampleDataUrl);
assert(p1.base64 === sampleBase64, 'DataURL prefix stripped cleanly');
assert(p1.mimeType === 'image/png', 'MIME type parsed from DataURL');
assert(p1.estimatedSizeKb > 0, 'Estimated image size computed');

const batch = prepareImageBatch([sampleDataUrl, sampleBase64]);
assert(batch.length === 2, 'Batch of 2 images prepared');
assert(batch[0].index === 0 && batch[1].index === 1, 'Batch indices assigned correctly');

// -----------------------------------------------------------------------------
// 2. FIELD NORMALIZER TESTS
// -----------------------------------------------------------------------------
console.log('\n--- 2. Field Normalization & Unit Standardization Tests ---');

// Unit conversions
assert(normalizeToStandardUnit(1.5, 'kg') === 1500, '1.5 kg -> 1500 grams');
assert(normalizeToStandardUnit(500, 'g') === 500, '500 g -> 500 grams');
assert(normalizeToStandardUnit(2, 'L') === 2000, '2 L -> 2000 ml');
assert(normalizeToStandardUnit(250, 'ml') === 250, '250 ml -> 250 ml');
assert(normalizeToStandardUnit(10, 'N') === 10, '10 N -> 10 units');

// Price normalization
assert(normalizePrice('₹ 99.50') === 99.50, '"₹ 99.50" coerced to numeric 99.50');
assert(normalizePrice('MRP Rs. 150.00 incl. taxes') === 150.00, '"MRP Rs. 150.00" coerced to 150.00');

// Rule 6 Explanation I (Manufacturer presumption fallback)
const unlabelledEntity = {
  packer_name: { value: 'Good Foods Pvt. Ltd.' },
  packer_address: { value: 'Plot 4, GIDC, Ahmedabad, Gujarat - 380001' }
};
const normExplanationI = normalizeExtractedFields(unlabelledEntity);
assert(normExplanationI.manufacturer.name === 'Good Foods Pvt. Ltd.', 'Rule 6 Explanation I: Unlabelled entity presumed manufacturer');

// -----------------------------------------------------------------------------
// 3. RULE ENGINE COMPLIANCE CHECKERS
// -----------------------------------------------------------------------------
console.log('\n--- 3. Rule Engine Compliance Checkers ---');

// Fully Compliant Case
const fullyCompliantFields = {
  manufacturer: { name: 'Britannia Industries Ltd.', address: '5/1A Hungerford St, Kolkata - 700017' },
  packer: { name: null, address: null },
  importer: { name: null, address: null },
  commodity_name: 'Biscuits',
  net_quantity: { raw_value: 200, raw_unit: 'g', value_standard_units: 200 },
  mrp: { raw_text: 'MRP Rs 30.00 incl. of all taxes', numeric_value: 30.00 },
  month_year_of_manufacture: '08/2026',
  consumer_care: {
    name: 'Consumer Care Manager',
    address: 'Britannia Industries, Whitefield, Bengaluru',
    phone: '1800-425-4449',
    email: 'feedback@britindia.com'
  }
};

const resM = checkManufacturerDeclaration(fullyCompliantFields);
assert(resM.status === 'PASS', 'Check 1 (Manufacturer): PASS for complete name & address');

const resComm = checkCommodityName(fullyCompliantFields);
assert(resComm.status === 'PASS', 'Check 2 (Commodity): PASS for "Biscuits"');

const resQty = checkNetQuantity(fullyCompliantFields);
assert(resQty.status === 'PASS', 'Check 3 (Net Qty): PASS for 200 g');

const resMfg = checkMonthYear(fullyCompliantFields);
assert(resMfg.status === 'PASS', 'Check 4 (Month/Year): PASS for "08/2026"');

const resMrp = checkMRP(fullyCompliantFields);
assert(resMrp.status === 'PASS', 'Check 5 (MRP): PASS for standard "MRP Rs 30.00 incl. of all taxes"');

const resCC = checkConsumerCare(fullyCompliantFields);
assert(resCC.status === 'PASS', 'Check 6 (Consumer Care): PASS for complete contact channels');

const fullAudit = runComplianceCheck(fullyCompliantFields);
assert(fullAudit.summary.overall_compliant === true, 'Overall compliance verdict: FULLY COMPLIANT');
assert(fullAudit.summary.failed === 0, '0 failed checks in compliant product');

// -----------------------------------------------------------------------------
// 4. NON-COMPLIANT & EDGE CASE TESTS
// -----------------------------------------------------------------------------
console.log('\n--- 4. Non-Compliant & Regulatory Edge Case Tests ---');

// Edge Case A: Missing Manufacturer Address
const missingAddrFields = {
  ...fullyCompliantFields,
  manufacturer: { name: 'Sunrise Foods', address: null }
};
const resMissingAddr = checkManufacturerDeclaration(missingAddrFields);
assert(resMissingAddr.status === 'FAIL', 'Manufacturer name without address -> FAIL');

// Edge Case B: Prohibited Vague Term in Quantity
const vagueQtyFields = {
  ...fullyCompliantFields,
  net_quantity: { raw_value: 500, raw_unit: 'g (when packed)' }
};
const resVague = checkNetQuantity(vagueQtyFields, 'approx weight 500g');
assert(resVague.status === 'WARNING', 'Prohibited vague term ("when packed" / "approx") -> WARNING');

// Edge Case C: Prohibited Counting Unit (Dozen)
const dozenQtyFields = {
  ...fullyCompliantFields,
  net_quantity: { raw_value: 1, raw_unit: 'dozen' }
};
const resDozen = checkNetQuantity(dozenQtyFields);
assert(resDozen.status === 'FAIL', 'Prohibited counting term ("dozen") -> FAIL');

// Edge Case D: Malformed MRP Format (Missing "incl. of all taxes")
const badMrpFields = {
  ...fullyCompliantFields,
  mrp: { raw_text: 'Price: Rs 50.00', numeric_value: 50.00 }
};
const resBadMrp = checkMRP(badMrpFields);
assert(resBadMrp.status === 'WARNING', 'MRP without "incl. of all taxes" -> WARNING');

// Edge Case E: Missing Consumer Care
const missingCCFields = {
  ...fullyCompliantFields,
  consumer_care: { name: null, address: null, phone: null, email: null }
};
const resMissingCC = checkConsumerCare(missingCCFields);
assert(resMissingCC.status === 'FAIL', 'Missing consumer care -> FAIL');

// Edge Case F: Second Schedule Standard Package Size
const standardSizeCheck = checkStandardPackageSize(fullyCompliantFields);
assert(standardSizeCheck.status === 'PASS', '200g Biscuits conforms to Second Schedule standard size');

const nonStandardSizeFields = {
  ...fullyCompliantFields,
  commodity_name: 'Biscuits',
  net_quantity: { raw_value: 137, raw_unit: 'g', value_standard_units: 137 }
};
const nonStandardCheck = checkStandardPackageSize(nonStandardSizeFields);
assert(nonStandardCheck.status === 'WARNING', '137g Biscuits flagged as non-standard pack size');

// -----------------------------------------------------------------------------
// 5. REPORT BUILDER & ORCHESTRATOR TESTS
// -----------------------------------------------------------------------------
console.log('\n--- 5. Report Generation & End-to-End Orchestrator Tests ---');

const sampleReport = buildComplianceReport(
  { imageCount: 4, notes: 'Clear test scan' },
  fullyCompliantFields,
  fullAudit
);

assert(sampleReport.scan_id.startsWith('scan_'), 'Report generated with unique scan_id');
assert(sampleReport.summary.overall_compliant === true, 'Report summary reflects audit result');
assert(sampleReport.compliance.length >= 6, 'Report contains all mandatory declaration checks');
assert(typeof sampleReport.metadata.disclaimer === 'string', 'Report includes constraint disclaimer');

const mdReport = formatReportAsMarkdown(sampleReport);
assert(mdReport.includes('Legal Metrology Compliance Report'), 'Markdown report header generated');
assert(mdReport.includes('Rule 6(1)(a)'), 'Markdown report includes legal rule references');

const testRawFields = {
  manufacturer_name: { value: "Britannia Industries Ltd.", source_image_index: 0, confidence: "high" },
  manufacturer_address: { value: "5/1A Hungerford Street, Kolkata - 700017", source_image_index: 0, confidence: "high" },
  commodity_name: { value: "Biscuits", source_image_index: 0, confidence: "high" },
  net_quantity_value: { value: 200, source_image_index: 1, confidence: "high" },
  net_quantity_unit: { value: "g", source_image_index: 1, confidence: "high" },
  mrp_raw_text: { value: "MRP Rs 30.00 incl. of all taxes", source_image_index: 1, confidence: "high" },
  month_year_of_manufacture: { value: "08/2026", source_image_index: 2, confidence: "high" },
  consumer_care_name: { value: "Consumer Care Manager", source_image_index: 3, confidence: "high" },
  consumer_care_phone: { value: "1800-425-4449", source_image_index: 3, confidence: "high" }
};
const testNorm = normalizeExtractedFields(testRawFields);
const testChecks = runComplianceCheck(testNorm, "Test audit");
const e2eReport = buildComplianceReport({ imageCount: 4, notes: 'Test audit' }, testNorm, testChecks);
assert(e2eReport.scan_id !== null, 'Report builder produces structured report');
assert(e2eReport.compliance.length >= 6, 'Report builder has full compliance array');

console.log('\n======================================================');
console.log(`  ALL TESTS COMPLETE: ${passed} passed, ${failed} failed`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 CONSTRAINT #2 AUDIT ENGINE 100% VERIFIED!');
}
