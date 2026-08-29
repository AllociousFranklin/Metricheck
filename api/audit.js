/**
 * api/audit.js - Vercel Serverless Function Handler
 * Processes multi-view package images through Gemini multimodal extraction
 * and the Legal Metrology rule engine.
 */

import { processFullScan } from '../backend/scan-orchestrator.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'Legal Metrology Compliance Engine',
      supported_methods: ['POST /api/audit']
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST /api/audit' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const images = body?.images;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: 'Invalid payload: "images" array containing 1 or more base64 or DataURL strings is required'
      });
    }

    const apiKey = body.apiKey || process.env.GEMINI_API_KEY;
    const model = body.model || 'gemini-2.5-flash';

    console.log(`Processing audit request with ${images.length} images using model ${model}...`);

    const report = await processFullScan(images, {
      apiKey,
      model,
      allowMock: true
    });

    return res.status(200).json(report);
  } catch (err) {
    console.error('Vercel API Audit Handler Error:', err);
    return res.status(500).json({
      error: 'Internal Compliance Audit Error',
      details: err.message
    });
  }
}
