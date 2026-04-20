const express = require('express');
const axios = require('axios');

const app = express();

// ========== CONFIG ==========
const ADMIN_PASSWORD = 'BRONX2026';

// ========== API ENDPOINTS ==========
const API_ENDPOINTS = {
    tg: 'http://45.91.248.51:3000/api/tgnum',
    aadhar: 'https://trial-api-ybh8.vercel.app/aadhaar',
    num: 'https://dark-osint-number-api.vercel.app/'
};

// ========== AVAILABLE SCOPES ==========
const AVAILABLE_SCOPES = ['tg', 'aadhar', 'num'];

// ========== KEY STORAGE ==========
let keyStorage = {
    'BRONX_ULTRA_MASTER_2026': {
        name: '👑 BRONX ULTRA OWNER',
        scopes: ['*'],
        type: 'owner',
        limit: Infinity,
        used: 0,
        expiry: null,
        expiryStr: 'Never',
        unlimited: true,
        hidden: true
    },
    'DEMO_KEY_2026': {
        name: '🎁 Demo User',
        scopes: ['tg', 'aadhar', 'num'],
        type: 'demo',
        limit: 10,
        used: 0,
        expiry: '2026-12-31T23:59:59.000Z',
        expiryStr: '31-12-2026',
        unlimited: false,
        hidden: false
    }
};

// ========== HELPERS ==========
function getIndiaTime() {
    return new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
}

function isKeyExpired(expiryDate) {
    if (!expiryDate) return false;
    return getIndiaTime() > new Date(expiryDate);
}

function checkKeyValid(apiKey) {
    const keyData = keyStorage[apiKey];
    if (!keyData) return { valid: false, error: 'Invalid API Key' };
    if (keyData.expiry && isKeyExpired(keyData.expiry)) return { valid: false, error: 'Key expired' };
    if (!keyData.unlimited && keyData.used >= keyData.limit) return { valid: false, error: 'Limit exhausted' };
    return { valid: true, keyData };
}

function incrementKeyUsage(apiKey) {
    if (keyStorage[apiKey] && !keyStorage[apiKey].unlimited) {
        keyStorage[apiKey].used++;
    }
}

function checkKeyScope(keyData, endpoint) {
    if (keyData.scopes.includes('*')) return true;
    return keyData.scopes.includes(endpoint);
}

// ========== CLEAN RESPONSES ==========
function cleanTGResponse(data) {
    if (!data || !data.RESULT) return data;
    
    return {
        success: true,
        result: {
            basic_info: data.RESULT.BASIC_INFO || {},
            status_info: data.RESULT.STATUS_INFO || {},
            activity_info: data.RESULT.ACTIVITY_INFO || {},
            number_info: data.RESULT.NUMBER_INFO || {}
        },
        powered_by: '@BRONX_ULTRA'
    };
}

function cleanAadharResponse(data) {
    if (!data || !data.Results) return data;
    
    // Only return the array of results
    return {
        success: true,
        results: data.Results,
        count: data.Results ? data.Results.length : 0,
        powered_by: '@BRONX_ULTRA'
    };
}

function cleanNumResponse(data) {
    if (!data) return data;
    
    // Only return data array
    return {
        success: data.status === 'success',
        results: data.data || [],
        count: data.results_count || 0,
        powered_by: '@BRONX_ULTRA'
    };
}

// ========== MIDDLEWARE ==========
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

// ========== API ROUTES ==========

// Telegram API
app.get('/tg', async (req, res) => {
    const apiKey = req.query.key;
    const id = req.query.id;
    
    if (!apiKey) return res.status(401).json({ error: 'API Key required. Use ?key=YOUR_KEY' });
    if (!id) return res.status(400).json({ error: 'Missing parameter: id. Use ?key=KEY&id=TELEGRAM_ID' });
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) return res.status(403).json({ error: keyCheck.error });
    
    if (!checkKeyScope(keyCheck.keyData, 'tg')) {
        return res.status(403).json({ error: 'Key cannot access /tg endpoint' });
    }
    
    try {
        const url = `${API_ENDPOINTS.tg}?id=${id}`;
        const response = await axios.get(url, { timeout: 30000 });
        incrementKeyUsage(apiKey);
        
        const cleaned = cleanTGResponse(response.data);
        res.json(cleaned);
    } catch (error) {
        res.status(500).json({ error: 'API request failed', details: error.message });
    }
});

// Aadhar API
app.get('/aadhar', async (req, res) => {
    const apiKey = req.query.key;
    const aadhar = req.query.aadhar;
    
    if (!apiKey) return res.status(401).json({ error: 'API Key required. Use ?key=YOUR_KEY' });
    if (!aadhar) return res.status(400).json({ error: 'Missing parameter: aadhar. Use ?key=KEY&aadhar=AADHAR_NUMBER' });
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) return res.status(403).json({ error: keyCheck.error });
    
    if (!checkKeyScope(keyCheck.keyData, 'aadhar')) {
        return res.status(403).json({ error: 'Key cannot access /aadhar endpoint' });
    }
    
    try {
        const url = `${API_ENDPOINTS.aadhar}/${aadhar}`;
        const response = await axios.get(url, { timeout: 30000 });
        incrementKeyUsage(apiKey);
        
        const cleaned = cleanAadharResponse(response.data);
        res.json(cleaned);
    } catch (error) {
        res.status(500).json({ error: 'API request failed', details: error.message });
    }
});

// Number API
app.get('/num', async (req, res) => {
    const apiKey = req.query.key;
    const num = req.query.num;
    
    if (!apiKey) return res.status(401).json({ error: 'API Key required. Use ?key=YOUR_KEY' });
    if (!num) return res.status(400).json({ error: 'Missing parameter: num. Use ?key=KEY&num=PHONE_NUMBER' });
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) return res.status(403).json({ error: keyCheck.error });
    
    if (!checkKeyScope(keyCheck.keyData, 'num')) {
        return res.status(403).json({ error: 'Key cannot access /num endpoint' });
    }
    
    try {
        const url = `${API_ENDPOINTS.num}?num=${num}`;
        const response = await axios.get(url, { timeout: 30000 });
        incrementKeyUsage(apiKey);
        
        const cleaned = cleanNumResponse(response.data);
        res.json(cleaned);
    } catch (error) {
        res.status(500).json({ error: 'API request failed', details: error.message });
    }
});

// ========== ADMIN ROUTES ==========
app.get('/admin/keys', (req, res) => {
    res.json({ success: true, keys: keyStorage });
});

app.post('/admin/generate-key', (req, res) => {
    const { password, keyName, ownerName, scopes, limit, expiryDate } = req.body;
    
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
    if (!keyName || !ownerName || !scopes || scopes.length === 0) return res.status(400).json({ error: 'Missing fields' });
    if (keyStorage[keyName]) return res.status(400).json({ error: 'Key already exists' });
    
    let expiry = null, expiryStr = 'Never';
    if (expiryDate) {
        const [year, month, day] = expiryDate.split('-').map(Number);
        expiry = new Date(Date.UTC(year, month - 1, day, 23, 59, 59)).toISOString();
        expiryStr = `${day}-${month}-${year}`;
    }
    
    keyStorage[keyName] = {
        name: ownerName,
        scopes: scopes,
        type: 'custom',
        limit: limit === 'unlimited' ? Infinity : parseInt(limit) || 100,
        used: 0,
        expiry: expiry,
        expiryStr: expiryStr,
        unlimited: limit === 'unlimited',
        hidden: false
    };
    
    res.json({ success: true, key: keyName });
});

app.delete('/admin/delete-key', (req, res) => {
    const { password, keyName } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
    if (!keyStorage[keyName]) return res.status(404).json({ error: 'Key not found' });
    delete keyStorage[keyName];
    res.json({ success: true });
});

app.post('/admin/reset-usage', (req, res) => {
    const { password, keyName } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
    if (!keyStorage[keyName]) return res.status(404).json({ error: 'Key not found' });
    keyStorage[keyName].used = 0;
    res.json({ success: true });
});

// ========== HOME ROUTE - API INFO ==========
app.get('/', (req, res) => {
    res.json({
        name: 'BRONX OSINT API',
        version: '1.0.0',
        owner: '@BRONX_ULTRA',
        endpoints: {
            '/tg': { method: 'GET', params: ['key', 'id'], example: '/tg?key=YOUR_KEY&id=7530266953' },
            '/aadhar': { method: 'GET', params: ['key', 'aadhar'], example: '/aadhar?key=YOUR_KEY&aadhar=533970021520' },
            '/num': { method: 'GET', params: ['key', 'num'], example: '/num?key=YOUR_KEY&num=9876543210' }
        },
        demo_key: 'DEMO_KEY_2026 (10 requests)',
        contact: '@BRONX_ULTRA on Telegram'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found', available: ['/tg', '/aadhar', '/num', '/'] });
});

module.exports = app;
