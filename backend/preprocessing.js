/**
 * preprocessing.js - Image Preprocessing for Multimodal Gemini API
 * Prepares and normalizes captured image buffers/base64 strings for LLM extraction.
 */

/**
 * Normalizes an input image (buffer, dataURL, or raw base64) to a clean base64 payload.
 * @param {string|Buffer|Uint8Array} imageInput - The image input in base64, dataURL, or Buffer format
 * @param {Object} options - Configuration options (maxDimension, quality, mimeType)
 * @returns {Object} { base64: string, mimeType: string, estimatedSizeKb: number }
 */
export function prepareImageForGemini(imageInput, options = {}) {
  const defaultMimeType = options.mimeType || 'image/jpeg';

  if (!imageInput) {
    throw new Error('prepareImageForGemini: Image input is required');
  }

  let cleanBase64 = '';
  let detectedMimeType = defaultMimeType;

  if (typeof imageInput === 'string') {
    // Check if it is a Data URL (e.g. data:image/jpeg;base64,....)
    if (imageInput.startsWith('data:')) {
      const match = imageInput.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        detectedMimeType = match[1] || defaultMimeType;
        cleanBase64 = match[2];
      } else {
        cleanBase64 = imageInput.replace(/^data:[^;]+;base64,/, '');
      }
    } else {
      // Plain base64 string
      cleanBase64 = imageInput.trim();
    }
  } else if (Buffer.isBuffer(imageInput) || imageInput instanceof Uint8Array) {
    cleanBase64 = Buffer.from(imageInput).toString('base64');
  } else {
    throw new Error('prepareImageForGemini: Unsupported image input type');
  }

  // Calculate approximate byte size
  const estimatedSizeBytes = Math.round((cleanBase64.length * 3) / 4);
  const estimatedSizeKb = Number((estimatedSizeBytes / 1024).toFixed(1));

  return {
    base64: cleanBase64,
    mimeType: detectedMimeType,
    estimatedSizeKb
  };
}

/**
 * Prepares an array of 1 to 4 images for multi-image Gemini API call.
 * @param {Array<string|Buffer>} imageArray
 * @returns {Array<{ base64: string, mimeType: string, index: number }>}
 */
export function prepareImageBatch(imageArray) {
  if (!Array.isArray(imageArray) || imageArray.length === 0) {
    throw new Error('prepareImageBatch: Expected non-empty array of images');
  }

  return imageArray.map((img, idx) => {
    const prep = prepareImageForGemini(img);
    return {
      ...prep,
      index: idx
    };
  });
}
