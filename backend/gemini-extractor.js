import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load .env file if present and GEMINI_API_KEY is not already set
if (!process.env.GEMINI_API_KEY) {
  try {
    const envPath = path.resolve(ROOT_DIR, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...vals] = trimmed.split('=');
          const val = vals.join('=').trim().replace(/^["'](.*)["']$/, '$1');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      });
    }
  } catch (e) {
    // Ignore .env read error
  }
}

export const EXTRACTION_PROMPT = `You are analyzing package label images for Legal Metrology compliance in India.
You are given one or more images (indexed from 0 upwards), each showing a different side, surface, or angle of the SAME product package.

Extract the following fields by examining ALL images together. For each field, report the exact value found, which image index it was found in (0, 1, 2, ...), and a confidence level.

Return ONLY valid JSON. No explanation, no markdown formatting, no backticks, no markdown fences — just the raw JSON object.

Fields to extract:
1. manufacturer_name: string or null
2. manufacturer_address: string or null
3. packer_name: string or null (if different from manufacturer)
4. packer_address: string or null
5. importer_name: string or null (only if imported product)
6. importer_address: string or null
7. commodity_name: string or null (common/generic product name, e.g. "Biscuits", "Soap", "Atta")
8. net_quantity_value: number or null (e.g. 500, 1.5, 200)
9. net_quantity_unit: string or null (e.g. "g", "kg", "ml", "L", "N", "U")
10. mrp_raw_text: string or null (EXACT text as printed on label, including all surrounding words like "MRP Rs 50.00 incl. of all taxes")
11. mrp_value: number or null (numeric price only, e.g. 50.00)
12. month_year_of_manufacture: string or null (as printed, e.g. "08/2026", "AUG 2026", "August 2026")
13. consumer_care_name: string or null
14. consumer_care_address: string or null
15. consumer_care_phone: string or null
16. consumer_care_email: string or null
17. dimensions: string or null (only if applicable — e.g. "2m x 1.5m", "100cm x 50cm")
18. country_of_origin: string or null (e.g. "India", "Made in India")

For each field, provide:
- "value": string | number | null
- "source_image_index": number | null
- "confidence": "high" | "medium" | "low"

Output JSON structure:
{
  "fields": {
    "manufacturer_name": {"value": null, "source_image_index": null, "confidence": "low"},
    "manufacturer_address": {"value": null, "source_image_index": null, "confidence": "low"},
    "packer_name": {"value": null, "source_image_index": null, "confidence": "low"},
    "packer_address": {"value": null, "source_image_index": null, "confidence": "low"},
    "importer_name": {"value": null, "source_image_index": null, "confidence": "low"},
    "importer_address": {"value": null, "source_image_index": null, "confidence": "low"},
    "commodity_name": {"value": null, "source_image_index": null, "confidence": "low"},
    "net_quantity_value": {"value": null, "source_image_index": null, "confidence": "low"},
    "net_quantity_unit": {"value": null, "source_image_index": null, "confidence": "low"},
    "mrp_raw_text": {"value": null, "source_image_index": null, "confidence": "low"},
    "mrp_value": {"value": null, "source_image_index": null, "confidence": "low"},
    "month_year_of_manufacture": {"value": null, "source_image_index": null, "confidence": "low"},
    "consumer_care_name": {"value": null, "source_image_index": null, "confidence": "low"},
    "consumer_care_address": {"value": null, "source_image_index": null, "confidence": "low"},
    "consumer_care_phone": {"value": null, "source_image_index": null, "confidence": "low"},
    "consumer_care_email": {"value": null, "source_image_index": null, "confidence": "low"},
    "dimensions": {"value": null, "source_image_index": null, "confidence": "low"},
    "country_of_origin": {"value": null, "source_image_index": null, "confidence": "low"}
  },
  "images_analyzed": 1,
  "notes": "string detailing any label observations or legibility notes"
}

If a field is genuinely not visible on ANY of the provided images, set its value to null.
Do NOT guess or hallucinate values. Do NOT infer information that is not explicitly printed on the package.`;

/**
 * Strips markdown formatting and parses JSON defensively.
 * @param {string} rawText
 * @returns {{ success: boolean, data?: Object, error?: string, raw?: string }}
 */
export function parseAndValidateJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { success: false, error: 'Empty or invalid response received from model', raw: rawText };
  }

  // Strip markdown code fences (e.g. ```json ... ``` or ``` ...)
  let cleaned = rawText
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/m, '')
    .trim();

  // Find the outermost JSON object bounds if extra text was included
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object' || !parsed.fields) {
      throw new Error("Missing 'fields' object in JSON payload");
    }
    return { success: true, data: parsed };
  } catch (err) {
    return { success: false, error: `JSON Parse Failure: ${err.message}`, raw: rawText };
  }
}

/**
 * Calls Gemini multimodal API to extract label declarations across multiple package images.
 * @param {Array<{ base64: string, mimeType: string }>} preparedImages - 1-4 images
 * @param {Object} options - { apiKey, model, forceJsonOnly }
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function extractLabelFields(preparedImages, options = {}) {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  const modelName = options.model || 'gemini-2.5-flash';

  if (!apiKey) {
    return {
      success: false,
      error: 'GEMINI_API_KEY environment variable or options.apiKey is required for live extraction.'
    };
  }

  // Construct Gemini generateContent payload
  const promptText = options.forceJsonOnly
    ? `${EXTRACTION_PROMPT}\n\nCRITICAL INSTRUCTION: Your previous output had invalid formatting. Return strictly raw JSON only starting with { and ending with }, without any surrounding text.`
    : EXTRACTION_PROMPT;

  // Parts array with prompt text and all image inline data
  const parts = [
    { text: promptText },
    ...preparedImages.map((img) => ({
      inlineData: {
        mimeType: img.mimeType || 'image/jpeg',
        data: img.base64
      }
    }))
  ];

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.1, // Low temperature for high extraction fidelity
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API HTTP ${response.status}: ${errorText}`);
    }

    const jsonResponse = await response.json();
    const candidateText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('No candidate content text returned from Gemini API');
    }

    const validated = parseAndValidateJSON(candidateText);

    // If initial parse fails, retry once with strict JSON prompt
    if (!validated.success && !options.isRetry) {
      console.warn('Initial Gemini JSON parse failed, triggering retry...', validated.error);
      return extractLabelFields(preparedImages, {
        ...options,
        forceJsonOnly: true,
        isRetry: true
      });
    }

    return validated;
  } catch (err) {
    return {
      success: false,
      error: `Gemini Extraction Failed: ${err.message}`
    };
  }
}
