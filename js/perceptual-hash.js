/**
 * perceptual-hash.js - Perceptual Hashing for Image Deduplication
 * Computes difference hash (dHash) and Hamming distance in pure JavaScript.
 */

/**
 * Computes a 64-bit difference hash (dHash) from an HTMLCanvasElement, HTMLImageElement, or ImageBitmap.
 * Resizes to 9x8, converts to luminance, and compares adjacent horizontal pixels.
 * @param {HTMLCanvasElement|HTMLImageElement|ImageBitmap} source
 * @returns {string} 16-character hex hash string
 */
export function computeDHash(source) {
  const canvas = document.createElement('canvas');
  canvas.width = 9;
  canvas.height = 8;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, 9, 8);

  const imgData = ctx.getImageData(0, 0, 9, 8);
  const data = imgData.data;

  // Convert 9x8 pixels to luminance
  const grays = new Float32Array(72);
  for (let i = 0; i < 72; i++) {
    const idx = i * 4;
    grays[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  let hash = 0n;
  let bitPos = 0n;

  // 8 rows x 8 horizontal gradient comparisons = 64 bits
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = grays[y * 9 + x];
      const right = grays[y * 9 + (x + 1)];
      if (left > right) {
        hash |= (1n << bitPos);
      }
      bitPos++;
    }
  }

  return hash.toString(16).padStart(16, '0');
}

/**
 * Computes 64-bit DCT-based pHash for high frequency analysis.
 * @param {HTMLCanvasElement|HTMLImageElement} source
 * @returns {string} 16-character hex hash string
 */
export function computePHash(source) {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, size, size);

  const data = ctx.getImageData(0, 0, size, size).data;
  const matrix = new Float64Array(size * size);

  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    matrix[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // Compute top-left 8x8 DCT
  const dctValues = new Float64Array(64);
  const N = size;

  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      let sum = 0;
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          sum += matrix[x * N + y] *
                 Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) *
                 Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
        }
      }
      const cu = (u === 0) ? (1 / Math.sqrt(2)) : 1;
      const cv = (v === 0) ? (1 / Math.sqrt(2)) : 1;
      dctValues[u * 8 + v] = (2 / N) * cu * cv * sum;
    }
  }

  // Median of 8x8 AC coefficients (excluding DC term at [0])
  const acList = Array.from(dctValues.slice(1));
  acList.sort((a, b) => a - b);
  const median = (acList[Math.floor(acList.length / 2)] + acList[Math.ceil(acList.length / 2)]) / 2;

  let hash = 0n;
  for (let i = 0; i < 64; i++) {
    if (dctValues[i] > median) {
      hash |= (1n << BigInt(i));
    }
  }

  return hash.toString(16).padStart(16, '0');
}

/**
 * Calculates the Hamming distance (number of differing bits) between two 16-character hex hashes.
 * @param {string} hash1
 * @param {string} hash2
 * @returns {number} Distance from 0 to 64
 */
export function getHammingDistance(hash1, hash2) {
  if (!hash1 || !hash2) return 64;
  let v1 = BigInt('0x' + hash1);
  let v2 = BigInt('0x' + hash2);
  let x = v1 ^ v2;

  // Kernighan bit count
  let count = 0;
  while (x > 0n) {
    count++;
    x &= (x - 1n);
  }
  return count;
}

/**
 * Checks if a hash is too similar to any previously saved hash.
 * @param {string} candidateHash
 * @param {string[]} savedHashes
 * @param {number} threshold - Maximum distance to consider as duplicate (e.g. 10)
 * @returns {boolean} true if duplicate, false if new view
 */
export function isDuplicate(candidateHash, savedHashes, threshold = 10) {
  if (!savedHashes || savedHashes.length === 0) return false;

  for (const saved of savedHashes) {
    const dist = getHammingDistance(candidateHash, saved);
    if (dist <= threshold) {
      return true; // Duplicate view
    }
  }
  return false;
}

/**
 * Gets the minimum Hamming distance to any previously saved hash.
 */
export function getMinHammingDistance(candidateHash, savedHashes) {
  if (!savedHashes || savedHashes.length === 0) return 64;
  let minDist = 64;
  for (const saved of savedHashes) {
    const dist = getHammingDistance(candidateHash, saved);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  return minDist;
}
