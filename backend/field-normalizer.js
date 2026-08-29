/**
 * field-normalizer.js - Multi-View Field Normalization and Standardization Layer
 * Coerces types, standardizes SI units, applies Rule 6 Explanation I, and formats fields for the rule engine.
 */

/**
 * Standardizes weight/volume values into base units (grams / millilitres / count)
 * @param {number|string|null} rawValue
 * @param {string|null} rawUnit
 * @returns {number|null}
 */
export function normalizeToStandardUnit(rawValue, rawUnit) {
  if (rawValue === null || rawValue === undefined) return null;

  let num = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return null;

  const unit = String(rawUnit || '').trim().toLowerCase();

  // Mass units -> grams
  if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms' || unit === 'kgs') {
    return num * 1000;
  }
  if (unit === 'g' || unit === 'gm' || unit === 'gms' || unit === 'gram' || unit === 'grams') {
    return num;
  }
  if (unit === 'mg' || unit === 'milligram' || unit === 'milligrams') {
    return num / 1000;
  }

  // Volume units -> millilitres
  if (unit === 'l' || unit === 'ltr' || unit === 'litre' || unit === 'litres' || unit === 'liter' || unit === 'liters') {
    return num * 1000;
  }
  if (unit === 'ml' || unit === 'millilitre' || unit === 'millilitres' || unit === 'milliliter') {
    return num;
  }

  // Number / count units -> raw count
  if (unit === 'n' || unit === 'u' || unit === 'unit' || unit === 'units' || unit === 'pcs' || unit === 'piece' || unit === 'pieces') {
    return num;
  }

  return num;
}

/**
 * Coerces numeric price from string or number
 * @param {number|string|null} rawPrice
 * @returns {number|null}
 */
export function normalizePrice(rawPrice) {
  if (rawPrice === null || rawPrice === undefined) return null;
  if (typeof rawPrice === 'number' && !isNaN(rawPrice)) return Number(rawPrice.toFixed(2));

  const str = String(rawPrice).replace(/,/g, '');
  const match = str.match(/([0-9]+(?:\.[0-9]{1,2})?)/);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? null : Number(val.toFixed(2));
  }
  return null;
}

/**
 * Helper to extract value safely from raw field entry
 */
function getVal(fieldEntry) {
  if (!fieldEntry) return null;
  if (typeof fieldEntry === 'object' && 'value' in fieldEntry) {
    const v = fieldEntry.value;
    return (typeof v === 'string') ? v.trim() || null : v;
  }
  return (typeof fieldEntry === 'string') ? fieldEntry.trim() || null : fieldEntry;
}

/**
 * Main Normalization Function
 * Converts raw Gemini extraction dictionary into structured, normalized product record.
 * @param {Object} rawFields - The "fields" object from Gemini JSON extraction
 * @returns {Object} Normalized product fields
 */
export function normalizeExtractedFields(rawFields = {}) {
  const mName = getVal(rawFields.manufacturer_name);
  const mAddr = getVal(rawFields.manufacturer_address);
  const pName = getVal(rawFields.packer_name);
  const pAddr = getVal(rawFields.packer_address);
  const iName = getVal(rawFields.importer_name);
  const iAddr = getVal(rawFields.importer_address);

  // Rule 6 Explanation I: If only one name/address is present without qualifier,
  // it is presumed to be the manufacturer.
  let finalMName = mName;
  let finalMAddr = mAddr;
  if (!finalMName && pName && !mName && !iName) {
    finalMName = pName;
    finalMAddr = pAddr;
  }

  const rawQtyVal = getVal(rawFields.net_quantity_value);
  const rawQtyUnit = getVal(rawFields.net_quantity_unit);
  const rawMrpText = getVal(rawFields.mrp_raw_text);
  const rawMrpVal = getVal(rawFields.mrp_value);

  const stdQty = normalizeToStandardUnit(rawQtyVal, rawQtyUnit);
  const numericMrp = normalizePrice(rawMrpVal) || normalizePrice(rawMrpText);

  return {
    manufacturer: {
      name: finalMName,
      address: finalMAddr,
      confidence: rawFields.manufacturer_name?.confidence || 'low',
      source_image_index: rawFields.manufacturer_name?.source_image_index ?? null
    },
    packer: {
      name: pName,
      address: pAddr,
      confidence: rawFields.packer_name?.confidence || 'low',
      source_image_index: rawFields.packer_name?.source_image_index ?? null
    },
    importer: {
      name: iName,
      address: iAddr,
      confidence: rawFields.importer_name?.confidence || 'low',
      source_image_index: rawFields.importer_name?.source_image_index ?? null
    },
    commodity_name: getVal(rawFields.commodity_name),
    net_quantity: {
      value_standard_units: stdQty,
      raw_value: typeof rawQtyVal === 'number' ? rawQtyVal : (rawQtyVal ? parseFloat(String(rawQtyVal)) : null),
      raw_unit: rawQtyUnit,
      confidence: rawFields.net_quantity_value?.confidence || 'low',
      source_image_index: rawFields.net_quantity_value?.source_image_index ?? null
    },
    mrp: {
      raw_text: rawMrpText,
      numeric_value: numericMrp,
      confidence: rawFields.mrp_raw_text?.confidence || 'low',
      source_image_index: rawFields.mrp_raw_text?.source_image_index ?? null
    },
    month_year_of_manufacture: getVal(rawFields.month_year_of_manufacture),
    consumer_care: {
      name: getVal(rawFields.consumer_care_name),
      address: getVal(rawFields.consumer_care_address),
      phone: getVal(rawFields.consumer_care_phone),
      email: getVal(rawFields.consumer_care_email),
      confidence: rawFields.consumer_care_name?.confidence || 'low',
      source_image_index: rawFields.consumer_care_name?.source_image_index ?? null
    },
    dimensions: getVal(rawFields.dimensions),
    country_of_origin: getVal(rawFields.country_of_origin)
  };
}
