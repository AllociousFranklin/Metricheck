import handler from './api/audit.js';

const mockReq = {
  method: 'POST',
  body: {
    images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==']
  }
};

let resStatus = null;
let resData = null;

const mockRes = {
  setHeader: () => {},
  status: (code) => {
    resStatus = code;
    return {
      json: (data) => { resData = data; return data; },
      end: () => {}
    };
  }
};

console.log('Testing Vercel Serverless Function Handler (api/audit.js)...');
await handler(mockReq, mockRes);

console.log(`Response Status: ${resStatus}`);
console.log(`Scan ID: ${resData?.scan_id}`);
console.log(`Overall Status: ${resData?.summary?.status}`);
console.log('Checks Count:', resData?.compliance?.length);

if (resStatus === 200 && resData?.scan_id) {
  console.log('✓ Vercel Serverless Handler Verified Successfully!');
} else {
  console.error('✗ Handler verification failed:', resData);
}
