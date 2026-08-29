import fs from 'fs';
import path from 'path';

let key = process.env.GEMINI_API_KEY || "";
try {
  const env = fs.readFileSync('.env', 'utf8');
  const m = env.match(/GEMINI_API_KEY=(.*)/);
  if (m) key = m[1].trim();
} catch (e) {}

console.log("Listing models with key:", key.substring(0, 10) + "...");

async function check() {
  // Test v1beta
  const resBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const dataBeta = await resBeta.json();
  console.log("\nv1beta models response:");
  if (dataBeta.models) {
    console.log(dataBeta.models.map(m => m.name).slice(0, 15));
  } else {
    console.log(JSON.stringify(dataBeta, null, 2));
  }

  // Test v1
  const resV1 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
  const dataV1 = await resV1.json();
  console.log("\nv1 models response:");
  if (dataV1.models) {
    console.log(dataV1.models.map(m => m.name).slice(0, 15));
  } else {
    console.log(JSON.stringify(dataV1, null, 2));
  }
}

check().catch(console.error);
