export interface OcrField {
  label: string;
  value: string;
  confidence: number;
}

export interface OcrResult {
  text: string;
  fields: OcrField[];
}

import Tesseract from 'tesseract.js';

export const analyzeImage = async (
  image: File | Blob | string,
  onProgress?: (progress: number) => void
): Promise<OcrResult> => {
  try {
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress);
        }
      },
    });

    const { data } = await worker.recognize(image);
    await worker.terminate();

    const fields = extractFieldsFromText(data.text);
    // Average confidence of the result text
    const textConfidence = data.confidence / 100;

    // Apply some confidence normalizations
    const normalizedFields = fields.map(f => ({
      ...f,
      confidence: f.confidence === 1.0 ? textConfidence : f.confidence
    }));

    return {
      text: data.text,
      fields: normalizedFields
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to analyze image with OCR.');
  }
};

const extractFieldsFromText = (text: string): OcrField[] => {
  const fields: OcrField[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const extractMatch = (label: string, regex: RegExp, confidence: number) => {
    const match = text.match(regex);
    if (match && match[1]) {
      fields.push({ label, value: match[1].trim(), confidence });
    }
  };

  // Common Legal Metrology Fields
  extractMatch("Net Quantity", /(?:NET\s*(?:WT|WEIGHT|QUANTITY|QTY)|Volume)\s*[:\-]?\s*([0-9]+\s*(?:g|kg|ml|l|oz|lb))/i, 0.9);
  extractMatch("MRP", /(?:MRP|M\.R\.P|MAXIMUM RETAIL PRICE)[^0-9]*([0-9.,]+)/i, 0.85);
  extractMatch("Date of Packing", /(?:PKD|PACKED ON|MFG|MFD|DATE OF PACKING|DATE OF MANUFACTURE)[^0-9a-z]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[A-Za-z]{3,}\s+[0-9]{2,4})/i, 0.8);
  extractMatch("Batch Number", /(?:BATCH NO|B\.NO|LOT NO)[^0-9a-z]*([A-Z0-9]+)/i, 0.75);
  extractMatch("Country of Origin", /(?:MADE IN|PRODUCT OF|COUNTRY OF ORIGIN)\s*[:\-]?\s*([A-Za-z\s]+)/i, 0.8);
  
  return fields;
};

// Keep for backward compatibility or simple mock fallbacks if ever needed
export const mockAnalyzeImage = async (file: File | Blob | string): Promise<OcrResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text: "METRICHECK TEST SCANNED TEXT\nNET WEIGHT: 500g\nMRP: $10.99\nMANUFACTURER: Test Corp",
        fields: [
          { label: "Net Weight", value: "500g", confidence: 0.95 },
          { label: "MRP", value: "$10.99", confidence: 0.82 },
          { label: "Manufacturer", value: "Test Corp", confidence: 0.98 },
        ]
      });
    }, 3000); 
  });
};
