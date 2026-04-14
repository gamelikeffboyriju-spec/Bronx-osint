const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.onrender.com/api';
const REAL_API_KEY = 'op';

// API Keys
const VALID_KEYS = ['BRONX_KEY_2026', 'DEMO_KEY', 'test123'];

// ========== CLEAN RESPONSE ==========
function cleanResponse(data) {
  if (!data) return data;
  let cleaned = JSON.parse(JSON.stringify(data));
  
  function removeFields(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach(item => removeFields(item));
      return;
    }
    delete obj.by;
    delete obj.channel;
    delete obj.BY;
    delete obj.CHANNEL;
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object') {
        removeFields(obj[key]);
      }
    });
  }
  
  removeFields(cleaned);
  cleaned.bronx_credit = "@BRONX_ULTRA";
  return cleaned;
}

// ========== API KEY CHECK ==========
function checkApiKey(req, res, next) {
  const key = req.query.key || req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ success: false, error: "❌ API Key Required" });
  }
  if (!VALID_KEYS.includes(key)) {
    return res.status(403).json({ success: false, error: "❌ Invalid API Key" });
  }
  next();
}

// ========== 19 ENDPOINTS ==========
const endpoints = [
  { path: '/number', param: 'num', example: '9876543210', desc: 'Indian Mobile Number Lookup' },
  { path: '/aadhar', param: 'num', example: '393933081942', desc: 'Aadhaar Number Lookup' },
  { path: '/name', param: 'name', example: 'abhiraaj', desc: 'Search by Name' },
  { path: '/numv2', param: 'num', example: '6205949840', desc: 'Number Info v2' },
  { path: '/adv', param: 'num', example: '9876543210', desc: 'Advanced Phone Lookup' },
  { path: '/upi', param: 'upi', example: 'example@ybl', desc: 'UPI ID Verification' },
  { path: '/ifsc', param: 'ifsc', example: 'SBIN0001234', desc: 'IFSC Code Details' },
  { path: '/pan', param: 'pan', example: 'AXDPR2606K', desc: 'PAN to GST Search' },
  { path: '/pincode', param: 'pin', example: '110001', desc: 'Pincode Details' },
  { path: '/ip', param: 'ip', example: '8.8.8.8', desc: 'IP Address Lookup' },
  { path: '/vehicle', param: 'vehicle', example: 'MH02FZ0555', desc: 'Vehicle Registration Info' },
  { path: '/rc', param: 'owner', example: 'UP92P2111', desc: 'RC Owner Details' },
  { path: '/ff', param: 'uid', example: '123456789', desc: 'Free Fire Player Info' },
  { path: '/bgmi', param: 'uid', example: '5121439477', desc: 'BGMI Player Info' },
  { path: '/insta', param: 'username', example: 'cristiano', desc: 'Instagram Profile Data' },
  { path: '/git', param: 'username', example: 'ftgamer2', desc: 'GitHub Profile' },
  { path: '/tg', param: 'info', example: 'JAUUOWNER', desc: 'Telegram User Lookup' },
  { path: '/pk', param: 'num', example: '03331234567', desc: 'Pakistan Number v1' },
  { path: '/pkv2', param: 'num', example: '3359736848', desc: 'Pakistan Number v2' }
];

// Proxy routes with API key check
app.use('/api/key-bronx', checkApiKey);

endpoints.forEach(ep => {
  app.get(`/api/key-bronx${ep.path}`, async (req, res) => {
    const paramValue = req.query[ep.param];
    if (!paramValue) {
      return res.status(400).json({ 
        success: false, 
        error: `Missing ${ep.param}`,
        example: `https://bronx-osint-api.onrender.com/api/key-bronx${ep.path}?key=YOUR_KEY&${ep.param}=${ep.example}`
      });
    }
    try {
      const realUrl = `${REAL_API_BASE}${ep.path}?key=${REAL_API_KEY}&${ep.param}=${paramValue}`;
      console.log(`📡 ${ep.path} -> called`);
      const response = await axios.get(realUrl, { timeout: 30000 });
      res.json(cleanResponse(response.data));
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
});

// ========== ROOT ROUTE - SIRF JSON (KOI HTML NAHI) ==========
app.get('/', (req, res) => {
  // Build endpoint list
  const endpointUrls = {};
  
  endpoints.forEach(ep => {
    endpointUrls[ep.path.replace('/', '')] = {
      url: `https://bronx-osint-api.onrender.com/api/key-bronx${ep.path}?key=YOUR_KEY&${ep.param}=${ep.example}`,
      example: `https://bronx-osint-api.onrender.com/api/key-bronx${ep.path}?key=BRONX_KEY_2026&${ep.param}=${ep.example}`,
      description: ep.desc
    };
  });
  
  // JSON response
  res.json({
    success: true,
    message: "✅ BRONX OSINT API - How to use:",
    credit: "@BRONX_ULTRA",
    authentication: {
      required: true,
      method: "?key=YOUR_KEY in query parameter",
      demo_key: "BRONX_KEY_2026",
      how_to_get: "Contact @BRONX_ULTRA on Telegram"
    },
    base_url: "https://bronx-osint-api.onrender.com",
    endpoints: endpointUrls,
    total_endpoints: endpoints.length,
    note: "Response se 'by': '@ftgamer2' aur 'channel' auto-hide ho jayenge"
  });
});

// Simple test route
app.get('/test', (req, res) => {
  res.json({ 
    status: '✅ BRONX OSINT API Running', 
    credit: '@BRONX_ULTRA',
    time: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ BRONX OSINT API running on port ${PORT}`);
  console.log(`🌐 https://bronx-osint-api.onrender.com`);
  console.log(`🔑 Valid API Keys: ${VALID_KEYS.join(', ')}`);
});
