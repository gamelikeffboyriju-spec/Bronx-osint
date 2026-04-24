const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== PERMANENT FILE STORAGE ==========
const DATA_DIR = path.join(__dirname, 'data');
const KEYS_FILE = path.join(DATA_DIR, 'keys.json');

// Create data folder if not exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data folder');
}

// Create keys file if not exists
if (!fs.existsSync(KEYS_FILE)) {
    fs.writeFileSync(KEYS_FILE, '{}', 'utf8');
    console.log('📄 Created keys.json file');
}

// ========== LOAD KEYS FROM FILE (PERMANENT) ==========
function loadKeysFromDisk() {
    try {
        const raw = fs.readFileSync(KEYS_FILE, 'utf8');
        const data = JSON.parse(raw);
        console.log(`✅ Loaded ${Object.keys(data).length} keys from disk`);
        return data;
    } catch (err) {
        console.error('❌ Failed to load keys:', err.message);
        return {};
    }
}

// ========== SAVE KEYS TO FILE (IMMEDIATE) ==========
function saveKeysToDisk() {
    try {
        const clean = {};
        Object.entries(keyStorage).forEach(([k, v]) => {
            clean[k] = { ...v };
            // Convert Date to string for JSON
            if (clean[k].expiry instanceof Date) {
                clean[k].expiry = clean[k].expiry.toISOString();
            }
            if (clean[k].expiryDate instanceof Date) {
                clean[k].expiryDate = clean[k].expiryDate.toISOString();
            }
        });
        fs.writeFileSync(KEYS_FILE, JSON.stringify(clean, null, 2), 'utf8');
        console.log(`💾 SAVED to disk! Total keys: ${Object.keys(clean).length}`);
        return true;
    } catch (err) {
        console.error('❌ SAVE FAILED:', err.message);
        return false;
    }
}

// ========== INITIALIZE KEY STORAGE ==========
let keyStorage = {};

// Load existing keys FIRST
const diskKeys = loadKeysFromDisk();

if (Object.keys(diskKeys).length > 0) {
    // Keys exist on disk - USE THEM
    keyStorage = diskKeys;
    console.log('📂 Using saved keys from disk');
} else {
    // No keys on disk - Add defaults
    console.log('🆕 Adding default keys...');
    
    keyStorage['BRONX_ULTRA_MASTER_2026'] = {
        name: '👑 OWNER',
        scopes: ['*'],
        type: 'owner',
        limit: Infinity,
        used: 0,
        expiry: null,
        expiryStr: 'Never',
        created: new Date().toISOString(),
        unlimited: true,
        hidden: true
    };
    
    keyStorage['DEMO_KEY_2026'] = {
        name: '🎁 Demo User',
        scopes: ['number', 'aadhar', 'pincode'],
        type: 'demo',
        limit: 10,
        used: 0,
        expiry: null,
        expiryStr: '31-12-2026',
        created: new Date().toISOString(),
        unlimited: false,
        hidden: false
    };
    
    keyStorage['TEST_KEY_2026'] = {
        name: '🧪 Test User',
        scopes: ['number'],
        type: 'test',
        limit: 5,
        used: 0,
        expiry: null,
        expiryStr: '30-06-2026',
        created: new Date().toISOString(),
        unlimited: false,
        hidden: false
    };
    
    // SAVE defaults to disk
    saveKeysToDisk();
    console.log('✅ Default keys saved to disk');
}
const app = express();

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = 'backup-bot';

// ========== EXTRA CUSTOM APIS (10 Slots - SIMPLE VERSION) ==========
let customAPIs = [
    { 
        id: 1, 
        name: 'Number Info backup ✅', 
        endpoint: 'bronx-api', 
        param: 'num', 
        example: '9876543210', 
        desc: 'india Number Lookup Vip Bronx api',
        category: '🔧 Custom APIs',
        visible: true,
        realAPI: 'https://bronx-api-info-ultra.vercel.app/api/number?num={param}'
    },
    { 
        id: 2, 
        name: 'Vehicle Details Api 🚕', 
        endpoint: 'rc-details', 
        param: 'ca_number', 
        example: 'MH02FZ0555', 
        desc: 'Vehicle RC Details Lookup',
        category: '🔧 Custom APIs',
        visible: true,
        realAPI: 'https://bronx-rc-api.vercel.app/?ca_number={param}'
    },
    { 
        id: 3, 
        name: 'Adhar Detail api', 
        endpoint: 'aadhar-details', 
        param: 'aadhar', 
        example: '393933081942', 
        desc: 'Aadhar Number Lookup',
        category: '🔧 Custom APIs',
        visible: true,
        realAPI: 'https://bronx-adhr.vercel.app/api/aadhaar?num={param}'
    },
    { 
        id: 4, 
        name: '📧 Email Lookup API', 
        endpoint: 'email-lookup', 
        param: 'mail', 
        example: 'user@gmail.com', 
        desc: 'Email Information Lookup',
        category: '🔧 Custom APIs',
        visible: true,
        realAPI: 'https://bronx-mail-api.vercel.app/mail={param}'
    },
    { 
        id: 5, 
        name: '📲 Telegram Number API', 
        endpoint: 'telegram-num', 
        param: 'id', 
        example: '7530266953', 
        desc: 'Telegram Number Lookup',
        category: '🔧 Custom APIs',
        visible: true,
        realAPI: 'https://bronx-tg-ultra.vercel.app/tg?id={param}'
    },
    { id: 6, name: 'Custom API 6', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 7, name: 'Custom API 7', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 8, name: 'Custom API 8', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 9, name: 'Custom API 9', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 10, name: 'Custom API 10', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' }
];

// ========== INDIA TIME HELPER ==========
function getIndiaTime() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
}

function getIndiaDate() {
    return getIndiaTime().toISOString().split('T')[0];
}

function getIndiaDateTime() {
    return getIndiaTime().toISOString().replace('T', ' ').substring(0, 19);
}

// ========== EXPIRY CHECK ==========
function isKeyExpired(expiryDate) {
    if (!expiryDate) return false;
    const indiaNow = getIndiaTime();
    const expiry = new Date(expiryDate);
    return indiaNow > expiry;
}

function parseExpiryDate(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59);
}

// ========== ENHANCED KEY STORAGE ==========
let keyStorage = {};

// ========== UNLIMITED MASTER KEY (HIDDEN FROM PUBLIC) ==========
keyStorage['BRONX_ULTRA_MASTER_2026'] = {
    name: '👑 BRONX ULTRA OWNER',
    scopes: ['*'],
    type: 'owner',
    limit: Infinity,
    used: 0,
    expiry: null,
    created: getIndiaDateTime(),
    resetType: 'never',
    unlimited: true,
    hidden: true // HIDE FROM PUBLIC
};

// ========== 49 PREMIUM KEYS ==========
const premiumKeys = [
    { key: 'demo1', name: '📱 Number Hunter Pro', scopes: ['number', 'numv2', 'adv'], limit: 10, expiry: '31-12-2026' },
    { key: 'demo2', name: '🆔 Aadhar Master', scopes: ['aadhar'], limit: 5, expiry: '30-06-2026' },
    { key: 'demo3', name: '🌐 Social Intel', scopes: ['insta', 'git', 'tg'], limit: 20, expiry: '31-12-2026' },
    { key: 'PREMIUM_VEHICLE_001', name: '🚗 Vehicle Tracker Pro', scopes: ['vehicle', 'rc'], limit: 75, expiry: '31-10-2026' },
    { key: 'PREMIUM_GAMING_001', name: '🎮 Gaming Intel', scopes: ['ff', 'bgmi'], limit: 150, expiry: '31-12-2026' },
    { key: 'PREMIUM_FINANCE_001', name: '💰 Finance Pro', scopes: ['upi', 'ifsc', 'pan'], limit: 60, expiry: '30-09-2026' },
    { key: 'PREMIUM_LOCATION_001', name: '📍 Location Master', scopes: ['pincode', 'ip'], limit: 100, expiry: '31-12-2026' },
    { key: 'PREMIUM_NAME_001', name: '🔍 Name Search Pro', scopes: ['name'], limit: 80, expiry: '31-08-2026' },
    { key: 'PREMIUM_PAK_001', name: '🇵🇰 Pakistan Intel', scopes: ['pk', 'pkv2'], limit: 50, expiry: '31-12-2026' },
    { key: 'PREMIUM_COMBO_001', name: '🎯 Combo Pack 1', scopes: ['number', 'aadhar', 'pan'], limit: 120, expiry: '31-12-2026' },
    { key: 'PREMIUM_COMBO_002', name: '🎯 Combo Pack 2', scopes: ['vehicle', 'rc', 'pincode'], limit: 90, expiry: '30-11-2026' },
    { key: 'PREMIUM_COMBO_003', name: '🎯 Combo Pack 3', scopes: ['insta', 'git', 'tg', 'ff'], limit: 180, expiry: '31-12-2026' },
    { key: 'PREMIUM_BASIC_001', name: '⭐ Basic User 1', scopes: ['number'], limit: 30, expiry: '31-07-2026' },
    { key: 'PREMIUM_BASIC_002', name: '⭐ Basic User 2', scopes: ['pincode'], limit: 40, expiry: '31-08-2026' },
    { key: 'PREMIUM_BASIC_003', name: '⭐ Basic User 3', scopes: ['ip'], limit: 50, expiry: '30-09-2026' },
    { key: 'PREMIUM_ADVANCED_001', name: '🌟 Advanced User 1', scopes: ['number', 'numv2', 'adv', 'name'], limit: 200, expiry: '31-12-2026' },
    { key: 'PREMIUM_ADVANCED_002', name: '🌟 Advanced User 2', scopes: ['aadhar', 'pan', 'upi'], limit: 100, expiry: '31-12-2026' },
    { key: 'PREMIUM_ADVANCED_003', name: '🌟 Advanced User 3', scopes: ['vehicle', 'rc', 'pincode', 'ip'], limit: 150, expiry: '31-12-2026' },
    { key: 'PREMIUM_ELITE_001', name: '💎 Elite User 1', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name'], limit: 300, expiry: '31-12-2026' },
    { key: 'PREMIUM_ELITE_002', name: '💎 Elite User 2', scopes: ['insta', 'git', 'tg', 'ff', 'bgmi'], limit: 250, expiry: '31-12-2026' },
    { key: 'PREMIUM_BUSINESS_001', name: '🏢 Business Pack 1', scopes: ['number', 'aadhar', 'pan', 'upi', 'ifsc'], limit: 500, expiry: '31-12-2026' },
    { key: 'PREMIUM_BUSINESS_002', name: '🏢 Business Pack 2', scopes: ['vehicle', 'rc', 'pincode', 'ip', 'name'], limit: 400, expiry: '31-12-2026' },
    { key: 'PREMIUM_STUDENT_001', name: '🎓 Student Pack 1', scopes: ['number', 'pincode', 'ip'], limit: 50, expiry: '31-12-2026' },
    { key: 'PREMIUM_STUDENT_002', name: '🎓 Student Pack 2', scopes: ['insta', 'git', 'ff'], limit: 60, expiry: '31-12-2026' },
    { key: 'PREMIUM_DEV_001', name: '💻 Developer 1', scopes: ['number', 'ip', 'git'], limit: 200, expiry: '31-12-2026' },
    { key: 'PREMIUM_DEV_002', name: '💻 Developer 2', scopes: ['number', 'numv2', 'adv', 'ip', 'git'], limit: 250, expiry: '31-12-2026' },
    { key: 'PREMIUM_SECURITY_001', name: '🛡️ Security Pro', scopes: ['aadhar', 'pan', 'vehicle'], limit: 100, expiry: '31-12-2026' },
    { key: 'PREMIUM_INVESTIGATOR_001', name: '🔎 Investigator', scopes: ['number', 'numv2', 'adv', 'aadhar', 'vehicle', 'rc'], limit: 350, expiry: '31-12-2026' },
    { key: 'PREMIUM_SOCIALPRO_001', name: '📸 Social Media Pro', scopes: ['insta', 'git', 'tg'], limit: 300, expiry: '31-12-2026' },
    { key: 'PREMIUM_GAMERPRO_001', name: '🎮 Gamer Pro', scopes: ['ff', 'bgmi'], limit: 200, expiry: '31-12-2026' },
    { key: 'PREMIUM_FINANCEPRO_001', name: '💵 Finance Pro Max', scopes: ['upi', 'ifsc', 'pan'], limit: 150, expiry: '31-12-2026' },
    { key: 'PREMIUM_LOCATIONPRO_001', name: '🗺️ Location Pro', scopes: ['pincode', 'ip'], limit: 200, expiry: '31-12-2026' },
    { key: 'PREMIUM_PREMIUM_001', name: '👔 Premium User 1', scopes: ['number', 'aadhar', 'name', 'pincode'], limit: 150, expiry: '31-12-2026' },
    { key: 'PREMIUM_PREMIUM_002', name: '👔 Premium User 2', scopes: ['vehicle', 'rc', 'pan', 'upi'], limit: 120, expiry: '30-11-2026' },
    { key: 'PREMIUM_PREMIUM_003', name: '👔 Premium User 3', scopes: ['insta', 'tg', 'ff', 'bgmi'], limit: 180, expiry: '31-10-2026' },
    { key: 'PREMIUM_GOLD_001', name: '🥇 Gold Member 1', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'pincode'], limit: 400, expiry: '31-12-2026' },
    { key: 'PREMIUM_GOLD_002', name: '🥇 Gold Member 2', scopes: ['vehicle', 'rc', 'pan', 'upi', 'ifsc', 'ip'], limit: 350, expiry: '31-12-2026' },
    { key: 'PREMIUM_PLATINUM_001', name: '💠 Platinum User 1', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'vehicle', 'rc'], limit: 500, expiry: '31-12-2026' },
    { key: 'PREMIUM_PLATINUM_002', name: '💠 Platinum User 2', scopes: ['insta', 'git', 'tg', 'ff', 'bgmi', 'ip', 'pincode'], limit: 450, expiry: '31-12-2026' },
    { key: 'PREMIUM_DIAMOND_001', name: '💎 Diamond User', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'pan', 'upi'], limit: 600, expiry: '31-12-2026' },
    { key: 'PREMIUM_ULTIMATE_001', name: '🏆 Ultimate User', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'vehicle', 'rc', 'pan', 'upi', 'ifsc'], limit: 750, expiry: '31-12-2026' },
    { key: 'PREMIUM_STARTER_001', name: '🌱 Starter Pack', scopes: ['number', 'pincode'], limit: 25, expiry: '31-07-2026' },
    { key: 'PREMIUM_STARTER_002', name: '🌱 Starter Pack 2', scopes: ['ip', 'git'], limit: 30, expiry: '31-08-2026' },
    { key: 'PREMIUM_WEEKLY_001', name: '📅 Weekly Pass', scopes: ['number', 'aadhar', 'name'], limit: 40, expiry: '30-06-2026' },
    { key: 'PREMIUM_MONTHLY_001', name: '📆 Monthly Pass', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name'], limit: 100, expiry: '31-07-2026' },
    { key: 'PREMIUM_QUARTERLY_001', name: '📊 Quarterly Pass', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'vehicle', 'rc'], limit: 250, expiry: '30-09-2026' },
    { key: 'PREMIUM_YEARLY_001', name: '🎯 Yearly Pass', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'vehicle', 'rc', 'pan', 'upi', 'ifsc', 'pincode', 'ip'], limit: 1000, expiry: '31-12-2026' },
    { key: 'PREMIUM_VIP_001', name: '👑 VIP Member', scopes: ['number', 'numv2', 'adv', 'aadhar', 'name', 'insta', 'git', 'tg'], limit: 500, expiry: '31-12-2026' }
];

// Initialize premium keys
premiumKeys.forEach(keyData => {
    keyStorage[keyData.key] = {
        name: keyData.name,
        scopes: keyData.scopes,
        type: 'premium',
        limit: keyData.limit,
        used: 0,
        expiry: parseExpiryDate(keyData.expiry),
        expiryStr: keyData.expiry,
        created: getIndiaDateTime(),
        resetType: 'never',
        unlimited: false,
        hidden: false
    };
});

// Demo/Test keys
keyStorage['DEMO_KEY_2026'] = {
    name: '🎁 Demo User',
    scopes: ['number', 'aadhar', 'pincode'],
    type: 'demo',
    limit: 10,
    used: 0,
    expiry: parseExpiryDate('31-12-2026'),
    expiryStr: '31-12-2026',
    created: getIndiaDateTime(),
    resetType: 'never',
    unlimited: false,
    hidden: false
};

keyStorage['TEST_KEY_2026'] = {
    name: '🧪 Test User',
    scopes: ['number'],
    type: 'test',
    limit: 5,
    used: 0,
    expiry: parseExpiryDate('30-06-2026'),
    expiryStr: '30-06-2026',
    created: getIndiaDateTime(),
    resetType: 'never',
    unlimited: false,
    hidden: false
};

// ========== KEY MANAGEMENT FUNCTIONS ==========
function checkKeyValid(apiKey) {
    const keyData = keyStorage[apiKey];
    if (!keyData) {
        return { valid: false, error: '❌ Invalid API Key. Contact @BRONX_ULTRA to purchase.' };
    }
    
    if (keyData.expiry && isKeyExpired(keyData.expiry)) {
        return { 
            valid: false, 
            error: '⏰ Your Key has EXPIRED! Please purchase a new key. Contact @BRONX_ULTRA on Telegram.',
            expired: true,
            expiredDate: keyData.expiryStr
        };
    }
    
    if (!keyData.unlimited && keyData.used >= keyData.limit) {
        return {
            valid: false,
            error: `🛑 Limit Exhausted! You have used ${keyData.used}/${keyData.limit} requests. Contact @BRONX_ULTRA for more.`,
            limitExhausted: true
        };
    }
    
    return { valid: true, keyData };
}

function incrementKeyUsage(apiKey) {
    if (keyStorage[apiKey] && !keyStorage[apiKey].unlimited) {
        keyStorage[apiKey].used++;
    }
    return keyStorage[apiKey];
}

function getRemainingQuota(apiKey) {
    const keyData = keyStorage[apiKey];
    if (!keyData) return 0;
    if (keyData.unlimited) return Infinity;
    return Math.max(0, keyData.limit - keyData.used);
}

function checkKeyScope(keyData, endpoint) {
    if (keyData.scopes.includes('*')) return { valid: true };
    if (keyData.scopes.includes(endpoint)) return { valid: true };
    return { 
        valid: false, 
        error: `❌ This key cannot access '${endpoint}'. Allowed scopes: ${keyData.scopes.join(', ')}` 
    };
}

// ========== ENDPOINTS ==========
const endpoints = {
    number: { param: 'num', category: '📱 Phone Intelligence', example: '9876543210', desc: 'Indian Mobile Number Lookup' },
    aadhar: { param: 'num', category: '📱 Phone Intelligence', example: '393933081942', desc: 'Aadhaar Number Lookup' },
    name: { param: 'name', category: '📱 Phone Intelligence', example: 'abhiraaj', desc: 'Name to Records Search' },
    numv2: { param: 'num', category: '📱 Phone Intelligence', example: '6205949840', desc: 'Number Info v2' },
    adv: { param: 'num', category: '📱 Phone Intelligence', example: '9876543210', desc: 'Advanced Phone Lookup' },
    upi: { param: 'upi', category: '💰 Financial', example: 'example@ybl', desc: 'UPI ID Verification' },
    ifsc: { param: 'ifsc', category: '💰 Financial', example: 'SBIN0001234', desc: 'IFSC Code Details' },
    pan: { param: 'pan', category: '💰 Financial', example: 'AXDPR2606K', desc: 'PAN to GST Search' },
    pincode: { param: 'pin', category: '📍 Location', example: '110001', desc: 'Pincode Details' },
    ip: { param: 'ip', category: '📍 Location', example: '8.8.8.8', desc: 'IP Lookup' },
    vehicle: { param: 'vehicle', category: '🚗 Vehicle', example: 'MH02FZ0555', desc: 'Vehicle Registration' },
    rc: { param: 'owner', category: '🚗 Vehicle', example: 'UP92P2111', desc: 'RC Owner Details' },
    ff: { param: 'uid', category: '🎮 Gaming', example: '123456789', desc: 'Free Fire Info' },
    bgmi: { param: 'uid', category: '🎮 Gaming', example: '5121439477', desc: 'BGMI Info' },
    insta: { param: 'username', category: '🌐 Social', example: 'cristiano', desc: 'Instagram Profile' },
    git: { param: 'username', category: '🌐 Social', example: 'ftgamer2', desc: 'GitHub Profile' },
    tg: { param: 'info', category: '🌐 Social', example: 'JAUUOWNER', desc: 'Telegram Lookup' },
    pk: { param: 'num', category: '🇵🇰 Pakistan', example: '03331234567', desc: 'Pakistan Number v1' },
    pkv2: { param: 'num', category: '🇵🇰 Pakistan', example: '3359736848', desc: 'Pakistan Number v2' }
};

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
        delete obj.developer;
        Object.keys(obj).forEach(key => {
            if (obj[key] && typeof obj[key] === 'object') {
                removeFields(obj[key]);
            }
        });
    }
    
    removeFields(cleaned);
    cleaned.by = "@BRONX_ULTRA";
    cleaned.powered_by = "BRONX OSINT API";
    return cleaned;
}

// ========== ADMIN PANEL (100% FIXED) - ADD BEFORE module.exports ==========

const ADMIN_PASSWORD = 'bronxKING';

// ========== IMPORTANT: Body Parser Middleware ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== ADMIN LOGIN PAGE ==========
app.get('/admin', (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 BRONX ADMIN</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #0a0a0a 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .login-box {
            background: #1a0033;
            border: 3px solid #ff00ff;
            border-radius: 30px;
            padding: 50px 40px;
            width: 400px;
            box-shadow: 0 0 80px #ff00ff66;
            animation: glow 3s infinite;
        }
        @keyframes glow {
            0%, 100% { box-shadow: 0 0 30px #ff00ff66, 0 0 60px #00ff4133; }
            50% { box-shadow: 0 0 50px #00ff4166, 0 0 80px #ff00ff33; }
        }
        h1 { color: #00ff41; text-align: center; font-size: 36px; margin-bottom: 10px; text-shadow: 0 0 30px #00ff41; }
        .subtitle { color: #ff00ff; text-align: center; margin-bottom: 30px; font-size: 14px; }
        .input-group { margin-bottom: 25px; }
        .input-group label { color: #00ff41; display: block; margin-bottom: 10px; font-size: 14px; }
        .input-group input {
            width: 100%; padding: 15px; background: #0a0a0a; border: 2px solid #00ff41;
            border-radius: 15px; color: #00ff41; font-size: 16px; font-family: 'Courier New', monospace;
        }
        .btn {
            width: 100%; padding: 15px; background: linear-gradient(45deg, #ff00ff, #00ff41);
            border: none; border-radius: 15px; color: #000; font-weight: bold; font-size: 18px;
            cursor: pointer; transition: all 0.3s;
        }
        .btn:hover { transform: scale(1.05); box-shadow: 0 0 40px #00ff41; }
        .error { color: #ff0000; text-align: center; margin-top: 15px; }
        .hint { color: #ffff00; text-align: center; margin-top: 20px; font-size: 12px; opacity: 0.7; }
    </style>
</head>
<body>
    <div class="login-box">
        <h1>⚡ BRONX</h1>
        <div class="subtitle">ADMIN PANEL</div>
        <div class="input-group">
            <label>🔑 ADMIN PASSWORD</label>
            <input type="password" id="password" placeholder="Enter password" autofocus>
        </div>
        <button class="btn" onclick="login()">🚀 LOGIN</button>
        <div id="error" class="error"></div>
        <div class="hint">Default: Welcome</div>
    </div>
    <script>
        const ADMIN_PASS = '${ADMIN_PASSWORD}';
        
        function login() {
            const pass = document.getElementById('password').value;
            if (pass === ADMIN_PASS) {
                localStorage.setItem('bronx_admin_auth', 'true');
                window.location.href = '/admin/dashboard';
            } else {
                document.getElementById('error').textContent = '❌ Invalid password!';
            }
        }
        
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });

        if (localStorage.getItem('bronx_admin_auth') === 'true') {
            window.location.href = '/admin/dashboard';
        }
    </script>
</body>
</html>`;
    res.send(html);
});

// ========== ADMIN DASHBOARD ==========
app.get('/admin/dashboard', (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 BRONX ADMIN | DASHBOARD</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #0a0a0a 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header {
            background: #1a0033;
            border: 3px solid #ff00ff;
            border-radius: 20px;
            padding: 25px 30px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 0 50px #ff00ff33;
        }
        .header h1 { color: #00ff41; font-size: 32px; text-shadow: 0 0 30px #00ff41; }
        .btn {
            padding: 12px 25px; border-radius: 12px; font-weight: bold; cursor: pointer;
            transition: all 0.3s; font-family: 'Courier New', monospace; border: none;
        }
        .btn-danger { background: #ff000033; border: 2px solid #ff0000; color: #ff6b6b; }
        .btn-primary { background: linear-gradient(45deg, #ff00ff, #00ff41); color: #000; }
        .btn-success { background: #00ff4120; border: 2px solid #00ff41; color: #00ff41; }
        .btn-warning { background: #ffff0020; border: 2px solid #ffff00; color: #ffff00; }
        .btn:hover { transform: scale(1.05); }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 20px;
            margin-bottom: 25px;
        }
        .stat-card {
            background: #1a0033; border: 2px solid; border-radius: 15px;
            padding: 20px; text-align: center;
        }
        .stat-card:nth-child(1) { border-color: #ff00ff; }
        .stat-card:nth-child(2) { border-color: #00ff41; }
        .stat-card:nth-child(3) { border-color: #ffff00; }
        .stat-card:nth-child(4) { border-color: #ff0000; }
        .stat-card:nth-child(5) { border-color: #00ffff; }
        .stat-value {
            font-size: 42px; font-weight: bold;
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .stat-label { color: #fff; font-size: 14px; margin-top: 8px; }
        
        .panel {
            background: #1a0033; border: 2px solid #00ff41; border-radius: 20px;
            padding: 25px; margin-bottom: 25px;
        }
        .panel-title { color: #00ff41; font-size: 22px; margin-bottom: 20px; }
        
        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px; margin-bottom: 20px;
        }
        .form-group label { color: #00ff41; display: block; margin-bottom: 8px; font-size: 13px; }
        .form-group input, .form-group select {
            width: 100%; padding: 12px; background: #0a0a0a; border: 2px solid #00ff41;
            border-radius: 10px; color: #00ff41; font-family: 'Courier New', monospace;
        }
        
        .scope-selector {
            display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0;
            max-height: 200px; overflow-y: auto; padding: 10px;
            background: #0a0a0a; border-radius: 10px;
        }
        .scope-item {
            padding: 8px 15px; background: #1a0033; border: 1px solid #00ff41;
            border-radius: 20px; color: #00ff41; cursor: pointer; font-size: 12px;
        }
        .scope-item.selected { background: #00ff41; color: #000; border-color: #00ff41; }
        
        .key-table {
            width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;
        }
        .key-table th {
            background: linear-gradient(45deg, #ff00ff, #00ff41); color: #000;
            padding: 12px; text-align: left; position: sticky; top: 0;
        }
        .key-table td { padding: 10px; border-bottom: 1px solid #ffffff20; color: #fff; }
        .key-table tr:hover { background: #ffffff10; }
        
        .status-badge {
            padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold;
        }
        .status-active { background: #00ff4120; color: #00ff41; border: 1px solid #00ff41; }
        .status-expired { background: #ff000020; color: #ff6b6b; border: 1px solid #ff0000; }
        .status-exhausted { background: #ffff0020; color: #ffff00; border: 1px solid #ffff00; }
        
        .action-btn {
            padding: 5px 12px; margin: 0 3px; border-radius: 8px; font-size: 11px;
            cursor: pointer; background: transparent; border: 1px solid;
        }
        .action-btn.edit { border-color: #00ff41; color: #00ff41; }
        .action-btn.reset { border-color: #ffff00; color: #ffff00; }
        .action-btn.delete { border-color: #ff0000; color: #ff6b6b; }
        .action-btn.copy { border-color: #ff00ff; color: #ff00ff; }
        
        .toast {
            position: fixed; bottom: 30px; right: 30px; background: #1a0033;
            color: #00ff41; padding: 15px 30px; border-radius: 50px;
            border: 2px solid #00ff41; box-shadow: 0 0 40px #00ff41;
            z-index: 9999; animation: slideIn 0.3s;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .table-container { max-height: 500px; overflow-y: auto; }
        
        .preset-buttons {
            display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;
        }
        .preset-btn {
            padding: 8px 15px; background: #0a0a0a; border: 1px solid #ff00ff;
            border-radius: 20px; color: #ff00ff; cursor: pointer; font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ BRONX ADMIN PANEL</h1>
            <div style="display: flex; gap: 15px;">
                <button class="btn btn-success" onclick="refreshData()">🔄 REFRESH</button>
                <button class="btn btn-danger" onclick="logout()">🚪 LOGOUT</button>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="totalKeys">0</div>
                <div class="stat-label">TOTAL KEYS</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="activeKeys">0</div>
                <div class="stat-label">ACTIVE KEYS</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="totalRequests">0</div>
                <div class="stat-label">TOTAL REQUESTS</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="todayRequests">0</div>
                <div class="stat-label">TODAY REQUESTS</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="customApisCount">0</div>
                <div class="stat-label">CUSTOM APIs</div>
            </div>
        </div>
        
        <!-- Key Generator Panel -->
        <div class="panel">
            <div class="panel-title">🔑 KEY GENERATOR</div>
            <div class="form-grid">
                <div class="form-group">
                    <label>🔐 API KEY (blank = auto)</label>
                    <input type="text" id="newKey" placeholder="Auto-generated">
                </div>
                <div class="form-group">
                    <label>👤 OWNER NAME</label>
                    <input type="text" id="newName" value="Premium User">
                </div>
                <div class="form-group">
                    <label>📊 REQUEST LIMIT</label>
                    <input type="number" id="newLimit" value="100">
                </div>
                <div class="form-group">
                    <label>⏰ EXPIRY (DD-MM-YYYY)</label>
                    <input type="text" id="newExpiry" value="31-12-2026">
                </div>
            </div>
            
            <div class="preset-buttons">
                <span class="preset-btn" onclick="selectAllScopes()">✅ All</span>
                <span class="preset-btn" onclick="clearAllScopes()">❌ Clear</span>
                <span class="preset-btn" onclick="selectPhone()">📱 Phone</span>
                <span class="preset-btn" onclick="selectFinance()">💰 Finance</span>
                <span class="preset-btn" onclick="selectVehicle()">🚗 Vehicle</span>
                <span class="preset-btn" onclick="selectSocial()">🌐 Social</span>
            </div>
            
            <label style="color: #00ff41; margin: 10px 0; display: block;">📌 SELECT SCOPES:</label>
            <div class="scope-selector" id="scopeSelector"></div>
            
            <div class="form-grid">
                <div class="form-group">
                    <label>✨ UNLIMITED</label>
                    <select id="newUnlimited">
                        <option value="false">No (Use limit)</option>
                        <option value="true">Yes (Unlimited)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>👁️ VISIBILITY</label>
                    <select id="newHidden">
                        <option value="false">Visible</option>
                        <option value="true">Hidden</option>
                    </select>
                </div>
            </div>
            
            <button class="btn btn-primary" style="width: 100%; padding: 15px;" onclick="generateKey()">🚀 GENERATE KEY</button>
        </div>
        
        <!-- Keys Table -->
        <div class="panel">
            <div class="panel-title">📋 ALL KEYS MANAGEMENT</div>
            <div class="table-container">
                <table class="key-table">
                    <thead>
                        <tr>
                            <th>KEY</th>
                            <th>OWNER</th>
                            <th>LIMIT</th>
                            <th>USED</th>
                            <th>REMAINING</th>
                            <th>EXPIRY</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="keysTableBody"></tbody>
                </table>
            </div>
        </div>
    </div>
    
    <div id="toastContainer"></div>
    
    <script>
        if (localStorage.getItem('bronx_admin_auth') !== 'true') {
            window.location.href = '/admin';
        }
        
        const SCOPES = ['number', 'numv2', 'adv', 'name', 'aadhar', 'upi', 'ifsc', 'pan', 'pincode', 'ip', 'vehicle', 'rc', 'ff', 'bgmi', 'insta', 'git', 'tg', 'pk', 'pkv2'];
        
        const scopeDiv = document.getElementById('scopeSelector');
        SCOPES.forEach(scope => {
            const span = document.createElement('span');
            span.className = 'scope-item';
            span.textContent = scope;
            span.onclick = function() { this.classList.toggle('selected'); };
            scopeDiv.appendChild(span);
        });
        
        function showToast(msg, isError = false) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.style.color = isError ? '#ff6b6b' : '#00ff41';
            toast.textContent = msg;
            document.getElementById('toastContainer').appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
        
        function generateRandomKey() {
            return 'BRONX_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_' + Date.now().toString(36).toUpperCase();
        }
        
        function getSelectedScopes() {
            return Array.from(document.querySelectorAll('#scopeSelector .scope-item.selected')).map(el => el.textContent);
        }
        
        function selectAllScopes() {
            document.querySelectorAll('#scopeSelector .scope-item').forEach(el => el.classList.add('selected'));
        }
        
        function clearAllScopes() {
            document.querySelectorAll('#scopeSelector .scope-item').forEach(el => el.classList.remove('selected'));
        }
        
        function selectPhone() {
            clearAllScopes();
            ['number', 'numv2', 'adv', 'name', 'aadhar'].forEach(s => {
                Array.from(document.querySelectorAll('#scopeSelector .scope-item')).find(el => el.textContent === s)?.classList.add('selected');
            });
        }
        
        function selectFinance() {
            clearAllScopes();
            ['upi', 'ifsc', 'pan'].forEach(s => {
                Array.from(document.querySelectorAll('#scopeSelector .scope-item')).find(el => el.textContent === s)?.classList.add('selected');
            });
        }
        
        function selectVehicle() {
            clearAllScopes();
            ['vehicle', 'rc'].forEach(s => {
                Array.from(document.querySelectorAll('#scopeSelector .scope-item')).find(el => el.textContent === s)?.classList.add('selected');
            });
        }
        
        function selectSocial() {
            clearAllScopes();
            ['insta', 'git', 'tg'].forEach(s => {
                Array.from(document.querySelectorAll('#scopeSelector .scope-item')).find(el => el.textContent === s)?.classList.add('selected');
            });
        }
        
        async function generateKey() {
            let key = document.getElementById('newKey').value;
            if (!key) key = generateRandomKey();
            
            const name = document.getElementById('newName').value || 'Premium User';
            const limit = parseInt(document.getElementById('newLimit').value) || 100;
            const expiry = document.getElementById('newExpiry').value || '31-12-2026';
            const unlimited = document.getElementById('newUnlimited').value === 'true';
            const hidden = document.getElementById('newHidden').value === 'true';
            const scopes = getSelectedScopes();
            
            if (scopes.length === 0) {
                showToast('❌ Select at least one scope!', true);
                return;
            }
            
            const payload = { key, name, scopes, limit, expiry, unlimited, hidden };
            console.log('Sending:', payload);
            
            try {
                const res = await fetch('/admin/generate-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                if (data.success) {
                    showToast('✅ Key generated: ' + key);
                    document.getElementById('newKey').value = '';
                    refreshData();
                } else {
                    showToast(data.error || 'Failed', true);
                }
            } catch (err) {
                showToast('❌ Error: ' + err.message, true);
            }
        }
        
        async function refreshData() {
            try {
                const res = await fetch('/admin/keys');
                const data = await res.json();
                
                if (data.success) {
                    const keys = data.keys;
                    const keysArray = Object.entries(keys);
                    
                    document.getElementById('totalKeys').textContent = keysArray.length;
                    
                    let active = 0, totalReqs = 0;
                    keysArray.forEach(([_, k]) => {
                        totalReqs += k.used || 0;
                        const notExpired = !k.expiry || k.expiry === 'Never' || new Date(k.expiry.split('-').reverse().join('-')) > new Date();
                        const hasQuota = k.limit === 'Unlimited' || k.used < k.limit;
                        if (notExpired && hasQuota) active++;
                    });
                    
                    document.getElementById('activeKeys').textContent = active;
                    document.getElementById('totalRequests').textContent = totalReqs;
                    document.getElementById('customApisCount').textContent = '6';
                    
                    const tbody = document.getElementById('keysTableBody');
                    tbody.innerHTML = keysArray.map(([keyName, k]) => {
                        const isExpired = k.expiry && k.expiry !== 'Never' && new Date(k.expiry.split('-').reverse().join('-')) < new Date();
                        const isExhausted = k.limit !== 'Unlimited' && k.used >= k.limit;
                        let status = '✅ Active', statusClass = 'status-active';
                        if (isExpired) { status = '⏰ Expired'; statusClass = 'status-expired'; }
                        else if (isExhausted) { status = '🛑 Exhausted'; statusClass = 'status-exhausted'; }
                        
                        const displayKey = keyName.length > 18 ? keyName.substring(0, 15) + '...' : keyName;
                        const remaining = k.limit === 'Unlimited' ? '∞' : Math.max(0, k.limit - k.used);
                        
                        return \`<tr>
                            <td><code style="color: #ff00ff;">\${displayKey}</code>\${k.hidden ? ' 🔒' : ''}</td>
                            <td>\${k.owner || '-'}</td>
                            <td>\${k.limit === 'Unlimited' ? '∞' : k.limit}</td>
                            <td>\${k.used || 0}</td>
                            <td style="color: \${remaining === 0 ? '#ff6b6b' : '#00ff41'};">\${remaining}</td>
                            <td>\${k.expiry || 'Never'}</td>
                            <td><span class="status-badge \${statusClass}">\${status}</span></td>
                            <td>
                                <button class="action-btn copy" onclick="copyKey('\${keyName}')">📋</button>
                                <button class="action-btn reset" onclick="resetKey('\${keyName}')">🔄</button>
                                <button class="action-btn delete" onclick="deleteKey('\${keyName}')">🗑️</button>
                            </td>
                        </tr>\`;
                    }).join('');
                }
            } catch (err) {
                console.error(err);
            }
        }
        
        function copyKey(key) {
            navigator.clipboard.writeText(key);
            showToast('📋 Copied!');
        }
        
        async function resetKey(key) {
            if (!confirm('Reset usage?')) return;
            await fetch('/admin/reset-usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            showToast('✅ Reset!');
            refreshData();
        }
        
        async function deleteKey(key) {
            if (!confirm('DELETE this key?')) return;
            await fetch('/admin/delete-key', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            showToast('✅ Deleted!');
            refreshData();
        }
        
        function logout() {
            localStorage.removeItem('bronx_admin_auth');
            window.location.href = '/admin';
        }
        
        refreshData();
    </script>
</body>
</html>`;
    res.send(html);
});

// ========== ADMIN API ENDPOINTS (WITH PERMANENT SAVE) ==========

// Get all keys
app.get('/admin/keys', (req, res) => {
    const allKeys = {};
    Object.entries(keyStorage).forEach(([key, data]) => {
        allKeys[key] = {
            owner: data.name || 'Unknown',
            scopes: data.scopes || [],
            limit: data.unlimited ? 'Unlimited' : (data.limit || 0),
            used: data.used || 0,
            expiry: data.expiryStr || 'Never',
            hidden: data.hidden || false,
            type: data.type || 'premium'
        };
    });
    
    res.json({ 
        success: true, 
        keys: allKeys,
        total: Object.keys(allKeys).length,
        saved_on_disk: true
    });
});

// Generate NEW KEY - SAVED FOREVER!
app.post('/admin/generate-key', (req, res) => {
    try {
        console.log('📥 REQUEST:', JSON.stringify(req.body));
        
        const { key, name, scopes, limit, expiry, unlimited, hidden } = req.body;
        
        // Validation
        if (!key || key.trim() === '') {
            return res.json({ success: false, error: '❌ Key name required!' });
        }
        
        if (keyStorage[key]) {
            return res.json({ success: false, error: '❌ Key already exists!' });
        }
        
        // Parse expiry
        let expiryDate = null;
        let expiryStr = 'Never';
        
        if (expiry && expiry !== 'never' && expiry !== 'Never') {
            const parts = String(expiry).split('-');
            if (parts.length === 3) {
                const d = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1;
                const y = parseInt(parts[2]);
                expiryDate = new Date(y, m, d, 23, 59, 59);
                expiryStr = expiry;
            }
        }
        
        // Create key data
        keyStorage[key] = {
            name: name || 'Premium User',
            scopes: Array.isArray(scopes) ? scopes : ['number'],
            type: 'premium',
            limit: unlimited ? Infinity : (parseInt(limit) || 100),
            used: 0,
            expiry: expiryDate,
            expiryDate: expiryDate,
            expiryStr: expiryStr,
            created: new Date().toISOString(),
            createdDate: new Date().toISOString(),
            unlimited: unlimited === true || unlimited === 'true',
            hidden: hidden === true || hidden === 'true'
        };
        
        // ⚡⚡⚡ IMMEDIATELY SAVE TO DISK! ⚡⚡⚡
        const saved = saveKeysToDisk();
        
        if (!saved) {
            // If save failed, remove from memory too
            delete keyStorage[key];
            return res.json({ success: false, error: '❌ Failed to save to disk!' });
        }
        
        console.log(`✅ KEY GENERATED & SAVED: ${key}`);
        console.log(`📊 Total keys now: ${Object.keys(keyStorage).length}`);
        
        res.json({ 
            success: true, 
            message: '✅ Key generated & saved permanently!', 
            key: key,
            saved_to_disk: true,
            total_keys: Object.keys(keyStorage).length
        });
        
    } catch (error) {
        console.error('❌ Generate error:', error);
        res.json({ success: false, error: error.message });
    }
});

// Reset usage - SAVED
app.post('/admin/reset-usage', (req, res) => {
    const key = req.body.key;
    
    if (!key || !keyStorage[key]) {
        return res.json({ success: false, error: 'Key not found' });
    }
    
    keyStorage[key].used = 0;
    saveKeysToDisk(); // ⚡ SAVE
    
    console.log(`🔄 Usage reset for: ${key}`);
    res.json({ success: true, message: 'Usage reset & saved!' });
});

// Delete key - REMOVED FROM DISK
app.delete('/admin/delete-key', (req, res) => {
    const key = req.body.key;
    
    if (!key || !keyStorage[key]) {
        return res.json({ success: false, error: 'Key not found' });
    }
    
    delete keyStorage[key];
    saveKeysToDisk(); // ⚡ SAVE
    
    console.log(`🗑️ Deleted: ${key}`);
    res.json({ success: true, message: 'Key deleted from disk!' });
});

// Force save all keys (backup)
app.post('/admin/force-save', (req, res) => {
    const saved = saveKeysToDisk();
    res.json({ 
        success: saved, 
        message: saved ? '✅ All keys saved!' : '❌ Save failed!',
        total_keys: Object.keys(keyStorage).length 
    });
});

// Check if keys are saved
app.get('/admin/check-save', (req, res) => {
    try {
        const fileExists = fs.existsSync(KEYS_FILE);
        const fileSize = fileExists ? fs.statSync(KEYS_FILE).size : 0;
        const memoryKeys = Object.keys(keyStorage).length;
        
        let diskKeys = 0;
        if (fileExists) {
            const raw = fs.readFileSync(KEYS_FILE, 'utf8');
            diskKeys = Object.keys(JSON.parse(raw)).length;
        }
        
        res.json({
            success: true,
            memory_keys: memoryKeys,
            disk_keys: diskKeys,
            file_exists: fileExists,
            file_size_bytes: fileSize,
            synced: memoryKeys === diskKeys,
            file_path: KEYS_FILE
        });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

console.log('✅ Admin Panel with PERMANENT storage ready!');
console.log(`📁 Keys stored at: ${KEYS_FILE}`);



// ========== SERVE ENHANCED HTML UI WITH DARK/LIGHT MODE ==========
function serveHTML(res) {
    const totalKeys = Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length;
    const premiumCount = Object.values(keyStorage).filter(k => k.type === 'premium' && !k.hidden).length;
    
    // Get visible custom APIs
    const visibleCustomAPIs = customAPIs.filter(api => api.visible && api.endpoint);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ BRONX OSINT | NEON API</title>
    <style>
        /* ========== LIGHT MODE VARIABLES ========== */
        :root {
            --bg-primary: #0a0a0a;
            --bg-secondary: #1a0033;
            --bg-card: rgba(10,10,10,0.9);
            --text-primary: #fff;
            --text-secondary: #00ff41;
            --border-glow: #ff00ff;
            --header-gradient: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #0a0a0a 100%);
            --card-border: 2px solid;
            --code-bg: #000;
            --table-header: linear-gradient(45deg, #ff00ff, #00ff41);
        }
        
        /* ========== LIGHT MODE ========== */
        body.light-mode {
            --bg-primary: #f5f5f5;
            --bg-secondary: #e0e0e0;
            --bg-card: rgba(255,255,255,0.95);
            --text-primary: #1a1a1a;
            --text-secondary: #0066cc;
            --border-glow: #0066cc;
            --header-gradient: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f5f5f5 100%);
            --card-border: 2px solid #0066cc;
            --code-bg: #1e1e1e;
            --table-header: linear-gradient(45deg, #0066cc, #00aa00);
        }
        
        body.light-mode .header h1 {
            background: linear-gradient(45deg, #0066cc, #00aa00, #cc6600, #cc0000, #009999);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        body.light-mode .stat-num {
            background: linear-gradient(45deg, #0066cc, #00aa00, #cc6600);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        body.light-mode .badge-1 { background: #0066cc20; color: #0066cc; border-color: #0066cc; }
        body.light-mode .badge-2 { background: #00aa0020; color: #00aa00; border-color: #00aa00; }
        body.light-mode .badge-3 { background: #cc660020; color: #cc6600; border-color: #cc6600; }
        body.light-mode .badge-4 { background: #cc000020; color: #cc0000; border-color: #cc0000; }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: var(--header-gradient);
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
            color: var(--text-primary);
            transition: all 0.3s ease;
        }
        body::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(0deg, rgba(0,255,65,0.03) 0px, transparent 1px, transparent 2px);
            pointer-events: none;
            z-index: 1;
        }
        .container { max-width: 1300px; margin: 0 auto; padding: 20px; position: relative; z-index: 2; }
        
        /* Theme Toggle */
        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            gap: 10px;
        }
        .theme-btn {
            padding: 12px 20px;
            border-radius: 50px;
            border: 2px solid;
            cursor: pointer;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
        }
        .theme-btn.dark {
            background: #0a0a0a;
            color: #00ff41;
            border-color: #00ff41;
            box-shadow: 0 0 20px #00ff4166;
        }
        .theme-btn.light {
            background: #f5f5f5;
            color: #0066cc;
            border-color: #0066cc;
            box-shadow: 0 0 20px #0066cc66;
        }
        .theme-btn:hover {
            transform: scale(1.1);
        }
        
        /* Animated Background */
        @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 20px #ff00ff33, 0 0 40px #00ff4133, 0 0 60px #ffff0033; }
            33% { box-shadow: 0 0 30px #00ff4133, 0 0 50px #ff00ff33, 0 0 70px #00ffff33; }
            66% { box-shadow: 0 0 25px #ffff0033, 0 0 45px #ff000033, 0 0 65px #00ff4133; }
        }
        
        /* Header */
        .header {
            text-align: center;
            padding: 40px;
            border: 3px solid;
            border-image: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00, #ff0000) 1;
            border-radius: 30px;
            margin-bottom: 30px;
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            animation: glowPulse 3s infinite;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, #ff00ff10, #00ff4110, #ffff0010, transparent);
            animation: rotate 10s linear infinite;
        }
        @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .header h1 {
            font-size: 56px;
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00, #ff6b6b, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 30px #ff00ff66;
            letter-spacing: 5px;
            position: relative;
            z-index: 2;
        }
        .header h1 span {
            display: inline-block;
            animation: flicker 2s infinite;
        }
        @keyframes flicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .badge-container {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
            position: relative;
            z-index: 2;
        }
        .badge {
            padding: 10px 25px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 2px;
            border: 2px solid;
            animation: badgeGlow 2s infinite;
        }
        .badge-1 { background: #ff00ff20; color: #ff00ff; border-color: #ff00ff; box-shadow: 0 0 20px #ff00ff66; }
        .badge-2 { background: #00ff4120; color: #00ff41; border-color: #00ff41; box-shadow: 0 0 20px #00ff4166; }
        .badge-3 { background: #ffff0020; color: #ffff00; border-color: #ffff00; box-shadow: 0 0 20px #ffff0066; }
        .badge-4 { background: #ff000020; color: #ff6b6b; border-color: #ff0000; box-shadow: 0 0 20px #ff000066; }
        @keyframes badgeGlow {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* Stats */
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        .stat-card {
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: var(--card-border);
            border-radius: 20px;
            padding: 20px 35px;
            text-align: center;
            transition: all 0.3s;
        }
        .stat-card:nth-child(1) { border-color: #ff00ff; box-shadow: 0 0 30px #ff00ff33; }
        .stat-card:nth-child(2) { border-color: #00ff41; box-shadow: 0 0 30px #00ff4133; }
        .stat-card:nth-child(3) { border-color: #ffff00; box-shadow: 0 0 30px #ffff0033; }
        .stat-card:nth-child(4) { border-color: #ff0000; box-shadow: 0 0 30px #ff000033; }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-num { 
            font-size: 42px; 
            font-weight: bold;
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .stat-label { 
            font-size: 12px; 
            letter-spacing: 3px;
            color: var(--text-primary);
            text-shadow: 0 0 10px currentColor;
        }
        
        /* Limit Alert */
        .limit-alert {
            background: linear-gradient(135deg, #ff00ff10, #00ff4110, #ffff0010);
            border: 2px solid;
            border-image: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00) 1;
            border-radius: 20px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        .limit-alert div:first-child {
            font-size: 20px;
            background: linear-gradient(45deg, #ff00ff, #ffff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: bold;
        }
        .reset-time {
            font-weight: bold;
            font-size: 20px;
            color: #00ff41;
            text-shadow: 0 0 20px #00ff41;
        }
        
        /* Owner Section - HIDDEN */
        .owner-section {
            display: none;
        }
        
        /* Auth Grid */
        .auth-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .auth-card {
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: var(--card-border);
            border-radius: 20px;
            padding: 25px;
            transition: all 0.3s;
        }
        .auth-card:nth-child(1) { border-color: #ff00ff; }
        .auth-card:nth-child(2) { border-color: #00ff41; }
        .auth-card:nth-child(3) { border-color: #ffff00; }
        .auth-card:hover { transform: translateY(-3px); box-shadow: 0 0 40px currentColor; }
        .auth-card h3 {
            color: var(--text-primary);
            margin-bottom: 15px;
            font-size: 20px;
        }
        .code {
            background: var(--code-bg);
            border: 1px solid #00ff41;
            border-radius: 12px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
            color: #00ff41;
            box-shadow: inset 0 0 20px #00ff4133;
        }
        
        /* Categories */
        .category {
            font-size: 28px;
            font-weight: bold;
            margin: 40px 0 20px;
            padding-left: 20px;
            border-left: 6px solid;
            background: linear-gradient(90deg, currentColor 0%, transparent 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        /* Endpoint Grid */
        .endpoint-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 18px;
        }
        .endpoint {
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: 2px solid;
            border-radius: 16px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        .endpoint::before {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            transition: left 0.5s;
        }
        .endpoint:hover::before { left: 100%; }
        .endpoint:hover { transform: translateY(-5px) scale(1.02); }
        .endpoint[data-category="📱 Phone Intelligence"] { border-color: #ff00ff; }
        .endpoint[data-category="💰 Financial"] { border-color: #00ff41; }
        .endpoint[data-category="📍 Location"] { border-color: #ffff00; }
        .endpoint[data-category="🚗 Vehicle"] { border-color: #ff0000; }
        .endpoint[data-category="🎮 Gaming"] { border-color: #00ffff; }
        .endpoint[data-category="🌐 Social"] { border-color: #ff8800; }
        .endpoint[data-category="🇵🇰 Pakistan"] { border-color: #00ff88; }
        .endpoint[data-category="🔧 Custom APIs"] { border-color: #ff00ff; background: linear-gradient(135deg, var(--bg-card), #ff00ff10); }
        
        .method {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .method.get { background: #00ff4120; color: #00ff41; border: 1px solid #00ff41; }
        .method.custom { background: #ff00ff20; color: #ff00ff; border: 1px solid #ff00ff; }
        .endpoint-name {
            font-size: 22px;
            font-weight: bold;
            margin: 12px 0 8px;
            background: linear-gradient(45deg, var(--text-primary), #00ff41);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .endpoint-url {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #ff00ff;
            word-break: break-all;
            opacity: 0.9;
        }
        .param { 
            font-size: 12px; 
            color: #ffff00; 
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #ffffff30;
        }
        
        /* Custom API Admin Panel */
        .admin-panel {
            background: linear-gradient(135deg, #1a0033, #0a0a0a);
            border: 3px solid #ff00ff;
            border-radius: 20px;
            padding: 30px;
            margin: 40px 0;
            box-shadow: 0 0 60px #ff00ff66;
        }
        body.light-mode .admin-panel {
            background: linear-gradient(135deg, #e0e0e0, #f5f5f5);
            border-color: #0066cc;
            box-shadow: 0 0 60px #0066cc66;
        }
        .admin-panel h2 {
            color: #00ff41;
            font-size: 28px;
            margin-bottom: 20px;
            text-shadow: 0 0 30px #00ff41;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .admin-panel h2 small {
            font-size: 14px;
            color: #ffff00;
        }
        .custom-api-form {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .custom-api-form input, .custom-api-form select {
            padding: 12px 15px;
            background: #0a0a0a;
            border: 2px solid #00ff41;
            border-radius: 10px;
            color: #00ff41;
            font-size: 14px;
            font-family: 'Courier New', monospace;
        }
        body.light-mode .custom-api-form input,
        body.light-mode .custom-api-form select {
            background: #fff;
            border-color: #0066cc;
            color: #1a1a1a;
        }
        .custom-api-form button {
            padding: 12px 20px;
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            border: none;
            border-radius: 10px;
            color: #000;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .custom-api-form button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px #00ff41;
        }
        .toggle-visibility {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-primary);
        }
        .toggle-visibility input {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }
        .custom-apis-list {
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
        }
        .custom-api-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: var(--bg-card);
            border: 1px solid #00ff41;
            border-radius: 10px;
            margin-bottom: 8px;
        }
        .custom-api-item .api-info {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        .custom-api-item .status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
        }
        .status.visible { background: #00ff4120; color: #00ff41; border: 1px solid #00ff41; }
        .status.hidden { background: #ff000020; color: #ff6b6b; border: 1px solid #ff0000; }
        .custom-api-item button {
            padding: 6px 15px;
            background: #ff00ff20;
            border: 1px solid #ff00ff;
            border-radius: 8px;
            color: #ff00ff;
            cursor: pointer;
            margin-left: 5px;
        }
        
        /* API Testing Panel */
        .api-panel {
            background: linear-gradient(135deg, #1a0033, #0a0a0a);
            border: 3px solid #ff00ff;
            border-radius: 20px;
            padding: 30px;
            margin: 40px 0;
            box-shadow: 0 0 60px #ff00ff66;
        }
        body.light-mode .api-panel {
            background: linear-gradient(135deg, #e0e0e0, #f5f5f5);
            border-color: #0066cc;
            box-shadow: 0 0 60px #0066cc66;
        }
        .api-panel h2 {
            color: #00ff41;
            font-size: 28px;
            margin-bottom: 20px;
            text-shadow: 0 0 30px #00ff41;
        }
        .api-panel .input-group {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .api-panel input, .api-panel select {
            flex: 1;
            padding: 15px 20px;
            background: #0a0a0a;
            border: 2px solid #00ff41;
            border-radius: 50px;
            color: #00ff41;
            font-size: 16px;
            font-family: 'Courier New', monospace;
        }
        body.light-mode .api-panel input,
        body.light-mode .api-panel select {
            background: #fff;
            border-color: #0066cc;
            color: #1a1a1a;
        }
        .api-panel button {
            padding: 15px 30px;
            background: linear-gradient(45deg, #ff00ff, #00ff41);
            border: none;
            border-radius: 50px;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 0 30px #ff00ff66;
        }
        .api-panel button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 50px #00ff41;
        }
        .api-result {
            margin-top: 20px;
            padding: 20px;
            background: #000;
            border: 1px solid #00ff41;
            border-radius: 12px;
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
            color: #00ff41;
        }
        body.light-mode .api-result {
            background: #1e1e1e;
        }
        
        /* Key Table */
        .key-info-section {
            margin: 40px 0;
            padding: 30px;
            background: var(--bg-card);
            backdrop-filter: blur(10px);
            border: 2px solid #ff00ff;
            border-radius: 20px;
        }
        .key-info-title {
            font-size: 24px;
            color: #00ff41;
            margin-bottom: 20px;
            text-shadow: 0 0 20px #00ff41;
        }
        .key-table-container {
            max-height: 400px;
            overflow-y: auto;
            border-radius: 12px;
        }
        .key-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        .key-table th {
            background: var(--table-header);
            color: #000;
            padding: 12px;
            font-weight: bold;
            position: sticky;
            top: 0;
        }
        .key-table td {
            padding: 10px;
            border-bottom: 1px solid #ffffff20;
            color: var(--text-primary);
        }
        .key-table tr:hover { background: #ffffff10; }
        .status-active { color: #00ff41; }
        .status-expired { color: #ff0000; }
        .status-exhausted { color: #ffff00; }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 40px;
            margin-top: 50px;
            border-top: 2px solid;
            border-image: linear-gradient(90deg, #ff00ff, #00ff41, #ffff00, #ff0000) 1;
            background: linear-gradient(180deg, transparent, var(--bg-primary));
        }
        .footer p {
            margin: 10px 0;
            font-size: 14px;
            color: var(--text-primary);
        }
        .footer .glow-text {
            background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 18px;
            font-weight: bold;
        }
        
        /* Toast */
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #0a0a0a, #1a0033);
            color: #00ff41;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: bold;
            border: 2px solid #00ff41;
            box-shadow: 0 0 40px #00ff41;
            animation: slideIn 0.3s, glowPulse 2s infinite;
            z-index: 9999;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(#ff00ff, #00ff41, #ffff00); border-radius: 10px; }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 32px; }
            .stat-num { font-size: 28px; }
            .theme-toggle { top: 10px; right: 10px; }
            .theme-btn { padding: 8px 15px; font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="theme-toggle">
        <button class="theme-btn dark" onclick="setTheme('dark')">🌙 DARK</button>
        <button class="theme-btn light" onclick="setTheme('light')">☀️ LIGHT</button>
    </div>

    <div class="container">
        <div class="header">
            <h1>
                <span>⚡</span> BRONX OSINT <span>⚡</span>
            </h1>
            <div class="badge-container">
                <span class="badge badge-1">🔐 NEON INTELLIGENCE</span>
                <span class="badge badge-2">🌐 ${totalKeys}+ PREMIUM KEYS</span>
                <span class="badge badge-3">🔧 CUSTOM APIs</span>
                <span class="badge badge-4">⚡ REAL-TIME DATA</span>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-num">${Object.keys(endpoints).length + visibleCustomAPIs.length}</div>
                <div class="stat-label">ENDPOINTS</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">${totalKeys}</div>
                <div class="stat-label">ACTIVE KEYS</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">10</div>
                <div class="stat-label">CUSTOM SLOTS</div>
            </div>
            <div class="stat-card">
                <div class="stat-num">JSON</div>
                <div class="stat-label">RESPONSE</div>
            </div>
        </div>
        
        <div class="limit-alert">
            <div>⚡ KEY-BASED LIMIT SYSTEM</div>
            <div style="margin-top: 10px;">🔑 Premium Keys: Fixed Lifetime Limits | Custom APIs Available</div>
            <div style="margin-top: 10px;">⏰ Key Expiry: Auto-checked | 🇮🇳 India Time Zone</div>
        </div>
        
        <div class="auth-grid">
            <div class="auth-card">
                <h3>🔐 AUTHENTICATION</h3>
                <div class="code">GET /api/key-bronx/number?key=YOUR_KEY&num=9876543210</div>
                <div style="margin-top: 15px; color: #ffff00; font-size: 12px;">Header: x-api-key also supported</div>
            </div>
            <div class="auth-card">
                <h3>📊 CHECK QUOTA</h3>
                <div class="code">GET /quota?key=YOUR_KEY</div>
                <div style="margin-top: 15px; color: #00ff41; font-size: 12px;">Returns remaining requests</div>
            </div>
            <div class="auth-card">
                <h3>🔑 KEY INFO</h3>
                <div class="code">GET /key-info?key=YOUR_KEY</div>
                <div style="margin-top: 15px; color: #ff00ff; font-size: 12px;">Check expiry & limits</div>
            </div>
        </div>
        
        
    
        
        <!-- API Testing Panel -->
        <div class="api-panel">
            <h2>🧪 API TESTING PANEL</h2>
            <div class="input-group">
                <select id="endpointSelect">
                    <optgroup label="📱 Built-in APIs">
                        ${Object.entries(endpoints).map(([name, ep]) => `<option value="${name}">${name.toUpperCase()} - ${ep.desc}</option>`).join('')}
                    </optgroup>
                    ${visibleCustomAPIs.length > 0 ? `
                        <optgroup label="🔧 Custom APIs">
                            ${visibleCustomAPIs.map(api => `<option value="custom_${api.id}" data-custom="true" data-endpoint="${api.endpoint}" data-param="${api.param}" data-real="${api.realAPI}">🔧 ${api.name} - ${api.desc}</option>`).join('')}
                        </optgroup>
                    ` : ''}
                </select>
                <input type="text" id="apiKeyInput" placeholder="Enter API Key">
                <input type="text" id="paramInput" placeholder="Parameter Value">
                <button onclick="testAPI()">🚀 TEST API</button>
            </div>
            <div id="apiResult" class="api-result" style="display:none;"></div>
        </div>
        
        ${Object.entries({
            '📱 Phone Intelligence': '📱 Phone Intelligence',
            '💰 Financial': '💰 Financial',
            '📍 Location': '📍 Location',
            '🚗 Vehicle': '🚗 Vehicle',
            '🎮 Gaming': '🎮 Gaming',
            '🌐 Social': '🌐 Social',
            '🇵🇰 Pakistan': '🇵🇰 Pakistan'
        }).filter(([_, cat]) => Object.values(endpoints).some(e => e.category === cat)).map(([display, cat]) => `
            <div class="category">${display}</div>
            <div class="endpoint-grid">
                ${Object.entries(endpoints).filter(([_, e]) => e.category === cat).map(([name, ep]) => `
                    <div class="endpoint" data-category="${cat}" onclick="copyUrl('${name}', '${ep.param}', '${ep.example}')">
                        <span class="method get">GET</span>
                        <div class="endpoint-name">/${name}</div>
                        <div class="endpoint-url">/api/key-bronx/${name}</div>
                        <div class="param">📝 ${ep.desc}</div>
                        <div class="param">🔑 ${ep.param}=${ep.example}</div>
                    </div>
                `).join('')}
            </div>
        `).join('')}
        
        ${visibleCustomAPIs.length > 0 ? `
            <div class="category">🔧 Custom APIs</div>
            <div class="endpoint-grid">
                ${visibleCustomAPIs.map(api => `
                    <div class="endpoint" data-category="🔧 Custom APIs" onclick="copyCustomUrl('${api.endpoint}', '${api.param}', '${api.example}')">
                        <span class="method custom">CUSTOM</span>
                        <div class="endpoint-name">/${api.endpoint}</div>
                        <div class="endpoint-url">/api/custom/${api.endpoint}</div>
                        <div class="param">📝 ${api.desc}</div>
                        <div class="param">🔑 ${api.param}=${api.example}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        
        
        <div class="footer">
            <p class="glow-text">✨ BRONX OSINT API - NEON EDITION ✨</p>
            <p style="color: #ff00ff;">Powered by @BRONX_ULTRA</p>
            <p style="color: #00ff41;">🇮🇳 India Time Zone | Premium Keys | Custom API Support</p>
            <p style="color: #ffff00; margin-top: 15px;">⚠️ Keys are lifetime limited - No reset! Contact @BRONX_ULTRA for new keys.</p>
        </div>
    </div>

  <!-- ========== TELEGRAM POPUP ========== -->
<style>
    /* Popup Overlay */
    .telegram-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        animation: fadeIn 0.3s ease;
    }
    
    /* Popup Box */
    .telegram-popup {
        background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%);
        border: 3px solid;
        border-image: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00) 1;
        border-radius: 30px;
        padding: 35px 30px;
        max-width: 420px;
        width: 90%;
        text-align: center;
        box-shadow: 0 0 80px #ff00ff66, 0 0 150px #00ff4133;
        animation: slideUp 0.4s ease, glowPulse 3s infinite;
        position: relative;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 50px #ff00ff66, 0 0 100px #00ff4133; }
        50% { box-shadow: 0 0 70px #00ff4166, 0 0 120px #ff00ff33; }
    }
    
    /* Close Button */
    .popup-close {
        position: absolute;
        top: 15px;
        right: 20px;
        background: none;
        border: none;
        color: #ff00ff;
        font-size: 28px;
        cursor: pointer;
        transition: all 0.3s;
        font-weight: bold;
    }
    
    .popup-close:hover {
        color: #00ff41;
        transform: scale(1.2);
        text-shadow: 0 0 20px #00ff41;
    }
    
    /* Title */
    .popup-title {
        font-size: 22px;
        font-weight: bold;
        margin-bottom: 20px;
        background: linear-gradient(45deg, #ff00ff, #00ff41, #ffff00);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 30px #ff00ff66;
        letter-spacing: 2px;
    }
    
    /* Telegram Icon */
    .telegram-icon {
        width: 70px;
        height: 70px;
        margin: 0 auto 20px;
        background: linear-gradient(45deg, #0088cc, #00ff41);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        box-shadow: 0 0 40px #0088cc;
        animation: iconPulse 2s infinite;
    }
    
    @keyframes iconPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 30px #0088cc; }
        50% { transform: scale(1.05); box-shadow: 0 0 50px #00ff41; }
    }
    
    /* Buttons Container */
    .popup-buttons {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin: 25px 0 15px;
    }
    
    /* Telegram Button */
    .telegram-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 16px 25px;
        border-radius: 50px;
        font-weight: bold;
        font-size: 16px;
        text-decoration: none;
        transition: all 0.3s;
        border: 2px solid;
        font-family: 'Courier New', monospace;
    }
    
    .btn-channel {
        background: linear-gradient(45deg, #0088cc20, #00ff4120);
        border-color: #0088cc;
        color: #00ff41;
        box-shadow: 0 0 30px #0088cc33;
    }
    
    .btn-channel:hover {
        background: linear-gradient(45deg, #0088cc40, #00ff4140);
        transform: scale(1.02);
        box-shadow: 0 0 50px #0088cc;
        border-color: #00ff41;
    }
    
    .btn-group {
        background: linear-gradient(45deg, #ff00ff20, #ffff0020);
        border-color: #ff00ff;
        color: #ffff00;
        box-shadow: 0 0 30px #ff00ff33;
    }
    
    .btn-group:hover {
        background: linear-gradient(45deg, #ff00ff40, #ffff0040);
        transform: scale(1.02);
        box-shadow: 0 0 50px #ff00ff;
        border-color: #ffff00;
    }
    
    /* Owner Info */
    .popup-owner {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px dashed #ffffff30;
        color: #fff;
        font-size: 14px;
    }
    
    .owner-name {
        color: #ff00ff;
        font-weight: bold;
        font-size: 18px;
        text-shadow: 0 0 20px #ff00ff;
    }
    
    .popup-footer {
        margin-top: 15px;
        color: #888;
        font-size: 12px;
    }
    
    /* Don't show again checkbox */
    .dont-show-again {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 15px;
        color: #888;
        font-size: 13px;
        cursor: pointer;
    }
    
    .dont-show-again input {
        width: 16px;
        height: 16px;
        accent-color: #ff00ff;
        cursor: pointer;
    }
</style>

<!-- Telegram Popup HTML -->
<div id="telegramPopup" class="telegram-popup-overlay">
    <div class="telegram-popup">
        <button class="popup-close" onclick="closeTelegramPopup()">&times;</button>
        
        <div class="telegram-icon">
            📱
        </div>
        
        <div class="popup-title">
            ⚡ BRONX OSINT ⚡
        </div>
        
        <p style="color: #00ff41; margin-bottom: 10px; font-size: 14px;">
            Join our Telegram channels for updates & support
        </p>
        
        <div class="popup-buttons">
            <a href="https://t.me/bronx_ultra_osint" target="_blank" class="telegram-btn btn-channel">
                <span style="font-size: 24px;">📢</span>
                API CHANNEL LINK
                <span style="font-size: 20px;">→</span>
            </a>
            
            <a href="https://t.me/+i6N0YDhlYKBiZWUy" target="_blank" class="telegram-btn btn-group">
                <span style="font-size: 24px;">💬</span>
                OSINT INFO GROUP
                <span style="font-size: 20px;">→</span>
            </a>
        </div>
        
        <div class="popup-owner">
            <span style="color: #fff;">OWNER: </span>
            <span class="owner-name">@BRONX_ULTRA</span>
        </div>
        
        <div class="dont-show-again" onclick="toggleDontShow()">
            <input type="checkbox" id="dontShowCheck">
            <label for="dontShowCheck" style="cursor: pointer;">Don't show this again</label>
        </div>
        
        <div class="popup-footer">
            ⏤͟͟͞͞🦋⃟≛⃝🇧≛⃝ 🇷𝐎𝐍𝐗 𝗢𝗦𝗜𝗡𝗧 ł₦₣Ø ≛⃝💞࿐
        </div>
    </div>
</div>

<script>
    // ========== TELEGRAM POPUP SCRIPT ==========
    
    // Check if popup should be shown
    function shouldShowPopup() {
        const dontShow = localStorage.getItem('bronx_popup_dont_show');
        if (dontShow === 'true') return false;
        
        // Check if shown in last 24 hours
        const lastShown = localStorage.getItem('bronx_popup_last_shown');
        if (lastShown) {
            const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
            if (hoursSince < 24) return false;
        }
        
        return true;
    }
    
    // Show popup
    function showTelegramPopup() {
        if (shouldShowPopup()) {
            document.getElementById('telegramPopup').style.display = 'flex';
            localStorage.setItem('bronx_popup_last_shown', Date.now());
        }
    }
    
    // Close popup
    function closeTelegramPopup() {
        document.getElementById('telegramPopup').style.display = 'none';
        
        // Save preference if checkbox checked
        if (document.getElementById('dontShowCheck').checked) {
            localStorage.setItem('bronx_popup_dont_show', 'true');
        }
    }
    
    // Toggle don't show
    function toggleDontShow() {
        const checkbox = document.getElementById('dontShowCheck');
        checkbox.checked = !checkbox.checked;
    }
    
    // Click outside to close
    document.addEventListener('click', function(e) {
        const popup = document.querySelector('.telegram-popup');
        const overlay = document.getElementById('telegramPopup');
        
        if (e.target === overlay) {
            closeTelegramPopup();
        }
    });
    
    // Escape key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTelegramPopup();
        }
    });
    
    // Show popup on page load (with slight delay)
    window.addEventListener('load', function() {
        setTimeout(showTelegramPopup, 1000);
    });
</script>
    
    <script>
        const endpoints = ${JSON.stringify(endpoints)};
        const keyStorage = ${JSON.stringify(Object.fromEntries(Object.entries(keyStorage).filter(([k, v]) => !v.hidden)))};
        let customAPIs = ${JSON.stringify(customAPIs)};
        
        // Theme functions
        function setTheme(theme) {
            if (theme === 'light') {
                document.body.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark');
            }
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        
        function copyUrl(endpoint, param, example) {
            const url = window.location.origin + '/api/key-bronx/' + endpoint + '?key=YOUR_KEY&' + param + '=' + example;
            navigator.clipboard.writeText(url);
            showToast('✅ URL Copied! ' + endpoint.toUpperCase());
        }
        
        function copyCustomUrl(endpoint, param, example) {
            const url = window.location.origin + '/api/custom/' + endpoint + '?key=YOUR_KEY&' + param + '=' + example;
            navigator.clipboard.writeText(url);
            showToast('✅ Custom API URL Copied!');
        }
        
        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        }
        
        async function testAPI() {
            const select = document.getElementById('endpointSelect');
            const selectedOption = select.options[select.selectedIndex];
            const isCustom = selectedOption.dataset.custom === 'true';
            const apiKey = document.getElementById('apiKeyInput').value;
            const paramValue = document.getElementById('paramInput').value;
            const resultDiv = document.getElementById('apiResult');
            
            if (!apiKey) {
                showToast('❌ Please enter API Key');
                return;
            }
            
            if (!paramValue) {
                showToast('❌ Please enter parameter value');
                return;
            }
            
            let url;
            if (isCustom) {
                const endpoint = selectedOption.dataset.endpoint;
                const param = selectedOption.dataset.param;
                url = '/api/custom/' + endpoint + '?key=' + apiKey + '&' + param + '=' + paramValue;
            } else {
                const endpoint = select.value;
                const ep = endpoints[endpoint];
                url = '/api/key-bronx/' + endpoint + '?key=' + apiKey + '&' + ep.param + '=' + paramValue;
            }
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '⏳ Loading...';
            
            try {
                const response = await fetch(url);
                const data = await response.json();
                resultDiv.innerHTML = '<pre style="color: #00ff41;">' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
                resultDiv.innerHTML = '<pre style="color: #ff0000;">Error: ' + error.message + '</pre>';
            }
        }
        
        // Custom API Management
        function saveCustomAPI() {
            const slot = parseInt(document.getElementById('apiSlotSelect').value);
            if (isNaN(slot)) {
                showToast('❌ Please select a slot');
                return;
            }
            
            customAPIs[slot] = {
                ...customAPIs[slot],
                name: document.getElementById('apiNameInput').value || customAPIs[slot].name,
                endpoint: document.getElementById('apiEndpointInput').value || customAPIs[slot].endpoint,
                param: document.getElementById('apiParamInput').value || customAPIs[slot].param,
                example: document.getElementById('apiExampleInput').value || customAPIs[slot].example,
                desc: document.getElementById('apiDescInput').value || customAPIs[slot].desc,
                realAPI: document.getElementById('apiRealUrlInput').value || customAPIs[slot].realAPI
            };
            
            // Save to server
            fetch('/admin/custom-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot, api: customAPIs[slot] })
            }).then(() => {
                showToast('✅ API Saved! Refresh to see changes.');
                setTimeout(() => location.reload(), 1000);
            });
        }
        
        function loadAPIToSlot() {
            const slot = parseInt(document.getElementById('apiSlotSelect').value);
            if (isNaN(slot)) {
                showToast('❌ Please select a slot');
                return;
            }
            
            const api = customAPIs[slot];
            document.getElementById('apiNameInput').value = api.name || '';
            document.getElementById('apiEndpointInput').value = api.endpoint || '';
            document.getElementById('apiParamInput').value = api.param || '';
            document.getElementById('apiExampleInput').value = api.example || '';
            document.getElementById('apiDescInput').value = api.desc || '';
            document.getElementById('apiRealUrlInput').value = api.realAPI || '';
            document.getElementById('apiVisibleCheck').checked = api.visible || false;
        }
        
        function toggleAPIVisibility() {
            const slot = parseInt(document.getElementById('apiSlotSelect').value);
            if (isNaN(slot)) {
                showToast('❌ Please select a slot');
                return;
            }
            
            customAPIs[slot].visible = !customAPIs[slot].visible;
            
            fetch('/admin/custom-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot, api: customAPIs[slot] })
            }).then(() => {
                showToast('✅ Visibility toggled! Refreshing...');
                setTimeout(() => location.reload(), 800);
            });
        }
        
        function editAPI(index) {
            document.getElementById('apiSlotSelect').value = index;
            loadAPIToSlot();
            document.querySelector('.admin-panel').scrollIntoView({ behavior: 'smooth' });
        }
        
        function deleteAPI(index) {
            customAPIs[index] = {
                ...customAPIs[index],
                name: 'Custom API ' + (index + 1),
                endpoint: '',
                param: '',
                example: '',
                desc: '',
                realAPI: '',
                visible: false
            };
            
            fetch('/admin/custom-api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot: index, api: customAPIs[index] })
            }).then(() => {
                showToast('🗑️ API Deleted! Refreshing...');
                setTimeout(() => location.reload(), 800);
            });
        }
        
        function populateKeyTable() {
            const tbody = document.getElementById('keyTableBody');
            const keys = Object.entries(keyStorage);
            
            tbody.innerHTML = keys.map(([key, data]) => {
                const now = new Date();
                const expiry = data.expiry ? new Date(data.expiry) : null;
                const isExpired = expiry && now > expiry;
                const isExhausted = !data.unlimited && data.used >= data.limit;
                let status = '✅ Active';
                let statusClass = 'status-active';
                
                if (isExpired) {
                    status = '⏰ Expired';
                    statusClass = 'status-expired';
                } else if (isExhausted) {
                    status = '🛑 Exhausted';
                    statusClass = 'status-exhausted';
                }
                
                const limitDisplay = data.unlimited ? '∞' : data.limit;
                const displayKey = key.length > 20 ? key.substring(0, 17) + '...' : key;
                
                return '<tr>' +
                    '<td><code style="color: #ff00ff;">' + displayKey + '</code></td>' +
                    '<td>' + (data.name || 'User') + '</td>' +
                    '<td style="font-size: 11px;">' + (data.scopes.includes('*') ? 'ALL' : data.scopes.slice(0, 3).join(', ') + (data.scopes.length > 3 ? '...' : '')) + '</td>' +
                    '<td>' + limitDisplay + '</td>' +
                    '<td>' + data.used + '</td>' +
                    '<td>' + (data.expiryStr || 'Never') + '</td>' +
                    '<td class="' + statusClass + '">' + status + '</td>' +
                    '</tr>';
            }).join('');
        }
        
        populateKeyTable();
        
        document.getElementById('endpointSelect').addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const isCustom = selectedOption.dataset.custom === 'true';
            
            if (isCustom) {
                document.getElementById('paramInput').placeholder = selectedOption.dataset.param + ' (e.g., ' + customAPIs[selectedOption.value.split('_')[1] - 1].example + ')';
            } else {
                const endpoint = this.value;
                const ep = endpoints[endpoint];
                document.getElementById('paramInput').placeholder = ep.param + ' (e.g., ' + ep.example + ')';
            }
        });
        document.getElementById('endpointSelect').dispatchEvent(new Event('change'));
    </script>
</body>
</html>`;
    res.send(html);
}

// ========== EXPRESS ROUTES ==========
app.use(express.json());

app.get('/', (req, res) => serveHTML(res));

app.get('/test', (req, res) => {
    res.json({ 
        status: '✅ BRONX OSINT API Running', 
        credit: '@BRONX_ULTRA', 
        time: getIndiaDateTime(),
        timezone: 'Asia/Kolkata (IST)',
        total_keys: Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length,
        custom_apis: customAPIs.filter(api => api.visible).length
    });
});

app.get('/keys', (req, res) => {
    const keyList = {};
    for (const [key, data] of Object.entries(keyStorage)) {
        if (!data.hidden) {
            keyList[key] = { 
                owner: data.name, 
                scopes: data.scopes, 
                type: data.type,
                limit: data.unlimited ? 'Unlimited' : data.limit,
                used: data.used,
                remaining: data.unlimited ? 'Unlimited' : Math.max(0, data.limit - data.used),
                expiry: data.expiryStr || 'Never',
                created: data.created
            };
        }
    }
    res.json({ success: true, total_keys: Object.keys(keyList).length, keys: keyList });
});

app.get('/key-info', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    
    const keyData = keyStorage[apiKey];
    if (!keyData || keyData.hidden) {
        return res.status(404).json({ success: false, error: "Key not found" });
    }
    
    const now = getIndiaTime();
    const isExpired = keyData.expiry && now > keyData.expiry;
    const isExhausted = !keyData.unlimited && keyData.used >= keyData.limit;
    
    res.json({
        success: true,
        key: apiKey,
        owner: keyData.name,
        type: keyData.type,
        scopes: keyData.scopes,
        limit: keyData.unlimited ? 'Unlimited' : keyData.limit,
        used: keyData.used,
        remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used),
        expiry: keyData.expiryStr || 'Never',
        expired: isExpired,
        exhausted: isExhausted,
        status: isExpired ? 'expired' : (isExhausted ? 'exhausted' : 'active'),
        created: keyData.created,
        timezone: 'Asia/Kolkata',
        current_time: getIndiaDateTime()
    });
});

app.get('/quota', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key parameter" });
    
    const keyData = keyStorage[apiKey];
    if (!keyData || keyData.hidden) {
        return res.status(404).json({ success: false, error: "Key not found" });
    }
    
    const remaining = keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - keyData.used);
    
    res.json({ 
        success: true,
        key: apiKey,
        owner: keyData.name,
        limit: keyData.unlimited ? 'Unlimited' : keyData.limit, 
        used: keyData.used, 
        remaining: remaining,
        expiry: keyData.expiryStr || 'Never',
        resetType: 'never',
        timezone: 'Asia/Kolkata'
    });
});

// FIXED: Custom API endpoint
app.get('/api/custom/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    
    console.log('📡 Custom API Request:', endpoint);
    console.log('📡 Query Params:', req.query);
    
    // Find custom API
    const customAPI = customAPIs.find(api => api.endpoint === endpoint && api.visible);
    if (!customAPI) {
        return res.status(404).json({ success: false, error: `Custom endpoint not found: ${endpoint}` });
    }
    
    if (!apiKey) {
        return res.status(401).json({ success: false, error: "❌ API Key Required" });
    }
    
    // Check key validity
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) {
        return res.status(403).json({ 
            success: false, 
            error: keyCheck.error,
            ...(keyCheck.expired && { expired: true }),
            ...(keyCheck.limitExhausted && { limit_exhausted: true })
        });
    }
    
    const keyData = keyCheck.keyData;
    const paramValue = req.query[customAPI.param];
    
    if (!paramValue) {
        return res.status(400).json({ 
            success: false, 
            error: `Missing parameter: ${customAPI.param}`, 
            example: `?key=YOUR_KEY&${customAPI.param}=${customAPI.example}` 
        });
    }
    
    try {
        // FIX: Properly replace {param} in URL
        let realUrl = customAPI.realAPI;
        realUrl = realUrl.replace('{param}', paramValue);
        realUrl = realUrl.replace('{parma}', paramValue); // Fix typo if any
        
        console.log(`📡 Calling Real API: ${realUrl}`);
        
        const response = await axios.get(realUrl, { 
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            }
        });
        
        incrementKeyUsage(apiKey);
        
        // Clean response
        let cleanedData = response.data;
        if (cleanedData && typeof cleanedData === 'object') {
            cleanedData = cleanResponse(cleanedData);
        }
        
        cleanedData.api_info = {
            powered_by: "@BRONX_ULTRA",
            endpoint: endpoint,
            type: 'custom',
            key_owner: keyData.name,
            timestamp: getIndiaDateTime()
        };
        
        res.json(cleanedData);
        
    } catch (error) {
        console.error(`❌ Custom API Error [${endpoint}]:`, error.message);
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        
        // Return the actual error from the real API if available
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                error: 'Real API returned error',
                real_api_status: error.response.status,
                real_api_error: error.response.data
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            url_attempted: customAPI.realAPI.replace('{param}', paramValue)
        });
    }
});

// Admin route for custom API management
app.post('/admin/custom-api', (req, res) => {
    const { slot, api } = req.body;
    
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) {
        return res.status(400).json({ success: false, error: "Invalid slot" });
    }
    
    customAPIs[slot] = { ...customAPIs[slot], ...api };
    
    res.json({ success: true, message: "Custom API updated", api: customAPIs[slot] });
});

// Get all custom APIs (for admin)
app.get('/admin/custom-apis', (req, res) => {
    res.json({ success: true, customAPIs });
});

app.get('/api/key-bronx/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const query = req.query;
    const apiKey = query.key || req.headers['x-api-key'];
    
    if (!endpoints[endpoint]) {
        return res.status(404).json({ success: false, error: `Endpoint not found: ${endpoint}`, available_endpoints: Object.keys(endpoints) });
    }
    
    if (!apiKey) {
        return res.status(401).json({ success: false, error: "❌ API Key Required. Use ?key=YOUR_KEY" });
    }
    
    const keyCheck = checkKeyValid(apiKey);
    if (!keyCheck.valid) {
        return res.status(403).json({ 
            success: false, 
            error: keyCheck.error,
            ...(keyCheck.expired && { expired: true, expiry_date: keyCheck.expiredDate }),
            ...(keyCheck.limitExhausted && { limit_exhausted: true })
        });
    }
    
    const keyData = keyCheck.keyData;
    
    const scopeCheck = checkKeyScope(keyData, endpoint);
    if (!scopeCheck.valid) {
        return res.status(403).json({ success: false, error: scopeCheck.error });
    }
    
    const ep = endpoints[endpoint];
    const paramValue = query[ep.param];
    
    if (!paramValue) {
        return res.status(400).json({ 
            success: false, 
            error: `Missing parameter: ${ep.param}`, 
            example: `?key=YOUR_KEY&${ep.param}=${ep.example}` 
        });
    }
    
    try {
        const realUrl = `${REAL_API_BASE}/${endpoint}?key=${REAL_API_KEY}&${ep.param}=${encodeURIComponent(paramValue)}`;
        console.log(`📡 [${getIndiaDateTime()}] ${endpoint} -> ${paramValue} | Key: ${apiKey.substring(0, 8)}...`);
        
        const response = await axios.get(realUrl, { timeout: 30000 });
        
        const updatedKey = incrementKeyUsage(apiKey);
        
        const cleanedData = cleanResponse(response.data);
        cleanedData.api_info = {
            powered_by: "@BRONX_ULTRA",
            endpoint: endpoint,
            key_owner: keyData.name,
            key_type: keyData.type,
            limit: keyData.unlimited ? 'Unlimited' : keyData.limit,
            used: updatedKey.used,
            remaining: keyData.unlimited ? 'Unlimited' : Math.max(0, keyData.limit - updatedKey.used),
            expiry: keyData.expiryStr || 'Never',
            timezone: 'Asia/Kolkata',
            timestamp: getIndiaDateTime()
        };
        
        res.json(cleanedData);
    } catch (error) {
        console.error(`❌ Error [${endpoint}]:`, error.message);
        if (error.response) {
            return res.status(error.response.status).json(cleanResponse(error.response.data));
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: "Endpoint not found",
        available_endpoints: ["/", "/test", "/keys", "/key-info", "/quota", "/api/key-bronx/:endpoint", "/api/custom/:endpoint"],
        contact: "@BRONX_ULTRA"
    });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 BRONX OSINT API running on port ${PORT}`);
});

module.exports = app;
