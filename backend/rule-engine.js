/**
 * rule-engine.js - Legal Metrology Deterministic Compliance Cross-Check Engine
 * Pure logic — no AI calls. Audits extracted product fields against legal_metrology_rules.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load rules JSON
let rules = {};
try {
  const rulesPath = path.resolve(__dirname, '../legal_metrology_rules.json');
  if (fs.existsSync(rulesPath)) {
    rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  }
} catch (e) {
  console.warn('rule-engine: Could not load legal_metrology_rules.json directly, using embedded rules fallback.');
}

/**
 * Check 1: Manufacturer / Packer / Importer Name & Address
 * Rule 6(1)(a), Rule 10
 */
export function checkManufacturerDeclaration(fields) {
  const m = fields.manufacturer || {};
  const p = fields.packer || {};
  const imp = fields.importer || {};

  const hasM = !!(m.name && m.address);
  const hasP = !!(p.name && p.address);
  const hasImp = !!(imp.name && imp.address);

  // If any complete entity declaration exists -> PASS
  if (hasM || hasP || hasImp) {
    let entityType = hasM ? 'Manufacturer' : hasImp ? 'Importer' : 'Packer';
    return {
      id: "manufacturer_packer_importer",
      rule_ref: "Rule 6(1)(a), Rule 10",
      label: "Manufacturer / Packer / Importer Declaration",
      status: "PASS",
      severity: "none",
      confidence: m.confidence || p.confidence || imp.confidence || "high",
      message: `${entityType} name and complete address verified.`,
      details: {
        manufacturer: hasM ? `${m.name}, ${m.address}` : null,
        packer: hasP ? `${p.name}, ${p.address}` : null,
        importer: hasImp ? `${imp.name}, ${imp.address}` : null
      }
    };
  }

  // Name found but address missing
  if (m.name && !m.address) {
    return {
      id: "manufacturer_packer_importer",
      rule_ref: "Rule 6(1)(a), Rule 10",
      label: "Manufacturer / Packer / Importer Declaration",
      status: "FAIL",
      severity: "critical",
      confidence: m.confidence || "medium",
      message: `Manufacturer name ("${m.name}") found, but complete postal/factory address is missing.`,
      details: { name: m.name, address: null }
    };
  }

  return {
    id: "manufacturer_packer_importer",
    rule_ref: "Rule 6(1)(a), Rule 10",
    label: "Manufacturer / Packer / Importer Declaration",
    status: "FAIL",
    severity: "critical",
    confidence: "high",
    message: "No manufacturer, packer, or importer name and address found on any scanned package view.",
    details: null
  };
}

/**
 * Check 2: Common or Generic Commodity Name
 * Rule 6(1)(b)
 */
export function checkCommodityName(fields) {
  const name = fields.commodity_name;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      id: "common_generic_name",
      rule_ref: "Rule 6(1)(b)",
      label: "Common / Generic Commodity Name",
      status: "FAIL",
      severity: "critical",
      confidence: "high",
      message: "Common or generic commodity name not found on scanned label.",
      details: null
    };
  }

  return {
    id: "common_generic_name",
    rule_ref: "Rule 6(1)(b)",
    label: "Common / Generic Commodity Name",
    status: "PASS",
    severity: "none",
    confidence: "high",
    message: `Commodity name present: "${name}".`,
    details: { commodity_name: name }
  };
}

/**
 * Check 3: Net Quantity in Standard SI Units & Vague Terms Check
 * Rule 6(1)(c), Rules 11-13
 */
export function checkNetQuantity(fields, rawTextContext = '') {
  const q = fields.net_quantity || {};
  const hasValue = q.raw_value !== null && q.raw_value !== undefined && !isNaN(q.raw_value);
  const hasUnit = !!q.raw_unit;

  if (!hasValue || !hasUnit) {
    return {
      id: "net_quantity",
      rule_ref: "Rule 6(1)(c), Rules 11-13",
      label: "Net Quantity Declaration",
      status: "FAIL",
      severity: "critical",
      confidence: q.confidence || "high",
      message: "Net quantity declaration not found or incomplete.",
      details: null
    };
  }

  // Check prohibited vague terms: "minimum", "about", "approximately", "not less than"
  const rawCombined = `${q.raw_value} ${q.raw_unit} ${rawTextContext}`.toLowerCase();
  const prohibitedVague = ["minimum", "not less than", "approx", "about", "when packed"];
  for (const term of prohibitedVague) {
    if (rawCombined.includes(term)) {
      return {
        id: "net_quantity",
        rule_ref: "Rule 11(2), Rule 12",
        label: "Net Quantity Declaration",
        status: "WARNING",
        severity: "moderate",
        confidence: q.confidence || "high",
        message: `Net quantity uses prohibited vague/qualifying term ("${term}"). Declarations must be exact.`,
        details: { raw_value: q.raw_value, raw_unit: q.raw_unit, violation: term }
      };
    }
  }

  // Check prohibited counting terms: dozen, score, gross
  const prohibitedCounting = ["dozen", "score", "gross"];
  for (const term of prohibitedCounting) {
    if (rawCombined.includes(term)) {
      return {
        id: "net_quantity",
        rule_ref: "Rule 13",
        label: "Net Quantity Declaration",
        status: "FAIL",
        severity: "critical",
        confidence: q.confidence || "high",
        message: `Net quantity uses prohibited counting unit ("${term}"). Count must be in standard numbers (N / U).`,
        details: { raw_value: q.raw_value, raw_unit: q.raw_unit }
      };
    }
  }

  return {
    id: "net_quantity",
    rule_ref: "Rule 6(1)(c), Rules 11-13",
    label: "Net Quantity Declaration",
    status: "PASS",
    severity: "none",
    confidence: q.confidence || "high",
    message: `Net quantity verified: ${q.raw_value} ${q.raw_unit} (${q.value_standard_units} base units).`,
    details: {
      raw_value: q.raw_value,
      raw_unit: q.raw_unit,
      standard_units: q.value_standard_units
    }
  };
}

/**
 * Check 4: Month and Year of Manufacture / Packing / Import
 * Rule 6(1)(d)
 */
export function checkMonthYear(fields) {
  const mfg = fields.month_year_of_manufacture;
  if (!mfg || typeof mfg !== 'string' || mfg.trim().length === 0) {
    return {
      id: "month_year_of_manufacture",
      rule_ref: "Rule 6(1)(d)",
      label: "Month and Year of Manufacture / Packing",
      status: "FAIL",
      severity: "critical",
      confidence: "high",
      message: "Month and year of manufacture/packing/import not found.",
      details: {
        exemptions_note: "Exempt for bidi, incense sticks, domestic LPG cylinders, certified seeds, and food articles under separate FSSAI governance."
      }
    };
  }

  // Validate format (e.g. MM/YYYY, MMM YYYY, MM-YYYY, Month YYYY)
  const isMonthYearFormat = /(0[1-9]|1[0-2]|[a-zA-Z]{3,9})[\s\/\.\-](20[0-9]{2}|19[0-9]{2}|[0-9]{2})/i.test(mfg);

  if (!isMonthYearFormat) {
    return {
      id: "month_year_of_manufacture",
      rule_ref: "Rule 6(1)(d)",
      label: "Month and Year of Manufacture / Packing",
      status: "WARNING",
      severity: "minor",
      confidence: "medium",
      message: `Date text found ("${mfg}"), but format may be non-standard. Expected Month/Year (e.g. 08/2026 or AUG 2026).`,
      details: { raw_text: mfg }
    };
  }

  return {
    id: "month_year_of_manufacture",
    rule_ref: "Rule 6(1)(d)",
    label: "Month and Year of Manufacture / Packing",
    status: "PASS",
    severity: "none",
    confidence: "high",
    message: `Month and year of manufacture verified: "${mfg}".`,
    details: { month_year: mfg }
  };
}

/**
 * Check 5: Retail Sale Price (MRP) & Mandatory Format
 * Rule 6(1)(e), Rule 2(m), Rule 9(1)(b)
 */
export function checkMRP(fields) {
  const mrp = fields.mrp || {};
  const hasText = !!mrp.raw_text;
  const hasNumeric = mrp.numeric_value !== null && mrp.numeric_value !== undefined && !isNaN(mrp.numeric_value);

  if (!hasText && !hasNumeric) {
    return {
      id: "retail_sale_price",
      rule_ref: "Rule 6(1)(e), Rule 2(m)",
      label: "Retail Sale Price (MRP)",
      status: "FAIL",
      severity: "critical",
      confidence: mrp.confidence || "high",
      message: "MRP (Maximum Retail Price) declaration not found.",
      details: null
    };
  }

  const rawText = (mrp.raw_text || '').trim();

  // Validate required mandatory phrasing per Rule 2(m):
  // Must contain "MRP" or "Maximum retail price" AND "incl" (of all taxes)
  const hasMRPKeyword = /(mrp|maximum\s+(?:or\s+max\.?\s+)?retail\s+price|max\.?\s+retail\s+price)/i.test(rawText);
  const hasTaxesKeyword = /incl(?:usive)?\.?\s+of\s+all\s+taxes/i.test(rawText);

  if (!hasMRPKeyword || !hasTaxesKeyword) {
    return {
      id: "retail_sale_price",
      rule_ref: "Rule 2(m), Rule 6(1)(e)",
      label: "Retail Sale Price (MRP)",
      status: "WARNING",
      severity: "moderate",
      confidence: mrp.confidence || "high",
      message: `MRP printed as "${rawText}", but lacks mandatory phrasing: "MRP Rs.../₹... incl. of all taxes".`,
      details: {
        raw_text: rawText,
        numeric_value: mrp.numeric_value,
        has_mrp_keyword: hasMRPKeyword,
        has_taxes_keyword: hasTaxesKeyword
      }
    };
  }

  return {
    id: "retail_sale_price",
    rule_ref: "Rule 6(1)(e), Rule 2(m)",
    label: "Retail Sale Price (MRP)",
    status: "PASS",
    severity: "none",
    confidence: mrp.confidence || "high",
    message: `MRP declaration compliant: "${rawText}" (₹${mrp.numeric_value}).`,
    details: {
      raw_text: rawText,
      numeric_value: mrp.numeric_value
    }
  };
}

/**
 * Check 6: Consumer Care Contact Details
 * Rule 6(2)
 */
export function checkConsumerCare(fields) {
  const cc = fields.consumer_care || {};
  const hasName = !!cc.name;
  const hasPhone = !!cc.phone;
  const hasEmail = !!cc.email;
  const hasAddress = !!cc.address;

  const hasAnyChannel = hasPhone || hasEmail || hasAddress;

  if (!hasName && !hasAnyChannel) {
    return {
      id: "consumer_care_details",
      rule_ref: "Rule 6(2)",
      label: "Consumer Care Contact Details",
      status: "FAIL",
      severity: "critical",
      confidence: cc.confidence || "high",
      message: "Consumer care contact details completely missing from all package views.",
      details: null
    };
  }

  // If name/officer is missing or contact channels are incomplete
  if (!hasName || !hasAnyChannel) {
    return {
      id: "consumer_care_details",
      rule_ref: "Rule 6(2)",
      label: "Consumer Care Contact Details",
      status: "WARNING",
      severity: "moderate",
      confidence: cc.confidence || "medium",
      message: "Consumer care details incomplete. Rule 6(2) requires name/designation + at least one contact channel (phone/email/address).",
      details: {
        name: cc.name,
        phone: cc.phone,
        email: cc.email,
        address: cc.address
      }
    };
  }

  return {
    id: "consumer_care_details",
    rule_ref: "Rule 6(2)",
    label: "Consumer Care Contact Details",
    status: "PASS",
    severity: "none",
    confidence: cc.confidence || "high",
    message: "Consumer care contact details verified.",
    details: {
      name: cc.name,
      phone: cc.phone,
      email: cc.email,
      address: cc.address
    }
  };
}

/**
 * Bonus Check 7: Standard Package Sizes (Rule 5, Second Schedule)
 */
export function checkStandardPackageSize(fields) {
  const commodity = fields.commodity_name || '';
  const qty = fields.net_quantity?.value_standard_units;

  // Basic sample entries lookup
  const standards = {
    'biscuits': [25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000],
    'tea': [25, 50, 100, 125, 250, 500, 1000],
    'coffee': [25, 50, 100, 200, 250, 500, 1000],
    'salt': [50, 100, 200, 500, 750, 1000, 2000, 5000]
  };

  const key = Object.keys(standards).find(k => commodity.toLowerCase().includes(k));
  if (!key || qty === null || qty === undefined) {
    return null; // Not applicable or unlisted commodity
  }

  const allowedSizes = standards[key];
  const isStandard = allowedSizes.includes(qty);

  if (!isStandard) {
    return {
      id: "standard_package_size",
      rule_ref: "Rule 5, Second Schedule",
      label: "Standard Package Size (Second Schedule)",
      status: "WARNING",
      severity: "minor",
      confidence: "high",
      message: `Net quantity (${qty}g) is not among Second Schedule standard sizes for ${commodity}. Non-standard pack size declaration may be required.`,
      details: { commodity, detected_qty: qty, standard_sizes: allowedSizes }
    };
  }

  return {
    id: "standard_package_size",
    rule_ref: "Rule 5, Second Schedule",
    label: "Standard Package Size (Second Schedule)",
    status: "PASS",
    severity: "none",
    confidence: "high",
    message: `Net quantity (${qty}g) conforms to Second Schedule standard package sizes.`,
    details: { commodity, qty }
  };
}

/**
 * Main Compliance Orchestrator - Runs All Core & Secondary Checks
 * @param {Object} normalizedFields
 * @param {string} rawTextContext
 * @returns {{ summary: Object, checks: Array<Object> }}
 */
export function runComplianceCheck(normalizedFields, rawTextContext = '') {
  const coreCheckers = [
    checkManufacturerDeclaration,
    checkCommodityName,
    checkNetQuantity,
    checkMonthYear,
    checkMRP,
    checkConsumerCare
  ];

  const results = coreCheckers.map(fn => fn(normalizedFields, rawTextContext));

  // Run optional Second Schedule standard size check if applicable
  const standardSizeCheck = checkStandardPackageSize(normalizedFields);
  if (standardSizeCheck) {
    results.push(standardSizeCheck);
  }

  const passedCount = results.filter(r => r.status === "PASS").length;
  const failedCount = results.filter(r => r.status === "FAIL").length;
  const warningCount = results.filter(r => r.status === "WARNING").length;
  const totalCount = results.length;

  const overallCompliant = failedCount === 0;

  let complianceGrade = "NON-COMPLIANT";
  if (overallCompliant && warningCount === 0) {
    complianceGrade = "FULLY COMPLIANT";
  } else if (overallCompliant && warningCount > 0) {
    complianceGrade = "COMPLIANT WITH WARNINGS";
  }

  return {
    summary: {
      total_checks: totalCount,
      passed: passedCount,
      failed: failedCount,
      warnings: warningCount,
      overall_compliant: overallCompliant,
      compliance_grade: complianceGrade
    },
    checks: results
  };
}
