const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== FILE STORAGE (SIRF EK BAAR) ==========
const KEYS_FILE = path.join(__dirname, 'bronx_keys.json');

function saveKeys() {
    try {
        const clean = {};
        Object.entries(keyStorage).forEach(([k, v]) => {
            clean[k] = { ...v };
            if (clean[k].expiry instanceof Date) {
                clean[k].expiry = clean[k].expiry.toISOString();
            }
        });
        fs.writeFileSync(KEYS_FILE, JSON.stringify(clean, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('❌ Save error:', err.message);
        return false;
    }
}

function loadKeys() {
    try {
        if (fs.existsSync(KEYS_FILE)) {
            const data = fs.readFileSync(KEYS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            Object.values(parsed).forEach(k => {
                if (k.expiry && typeof k.expiry === 'string' && k.expiry !== 'Never') {
                    k.expiry = new Date(k.expiry);
                }
            });
            console.log('✅ Loaded', Object.keys(parsed).length, 'keys from file');
            return parsed;
        } else {
            fs.writeFileSync(KEYS_FILE, '{}', 'utf8');
            console.log('📁 Created new keys file');
            return {};
        }
    } catch (err) {
        console.error('❌ Load error:', err.message);
        return {};
    }
}

// ========== CONFIG ==========
const REAL_API_BASE = 'https://ft-osint-api.duckdns.org/api';
const REAL_API_KEY = 'backup-bot';
const ADMIN_PASSWORD = 'bronxKING';

// ========== CUSTOM APIS ==========
let customAPIs = [
    { id: 1, name: 'Number Info backup ✅', endpoint: 'bronx-api', param: 'num', example: '9876543210', desc: 'india Number Lookup Vip Bronx api', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-api-info-ultra.vercel.app/api/number?num={param}' },
    { id: 2, name: 'Vehicle Details Api 🚕', endpoint: 'rc-details', param: 'ca_number', example: 'MH02FZ0555', desc: 'Vehicle RC Details Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-rc-api.vercel.app/?ca_number={param}' },
    { id: 3, name: 'Adhar Detail api', endpoint: 'aadhar-details', param: 'aadhar', example: '393933081942', desc: 'Aadhar Number Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-adhr.vercel.app/api/aadhaar?num={param}' },
    { id: 4, name: '📧 Email Lookup API', endpoint: 'email-lookup', param: 'mail', example: 'user@gmail.com', desc: 'Email Information Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-mail-api.vercel.app/mail={param}' },
    { id: 5, name: '📲 Telegram Number API', endpoint: 'telegram-num', param: 'id', example: '7530266953', desc: 'Telegram Number Lookup', category: '🔧 Custom APIs', visible: true, realAPI: 'https://bronx-tg-ultra.vercel.app/tg?id={param}' },
    { id: 6, name: 'Custom API 6', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 7, name: 'Custom API 7', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 8, name: 'Custom API 8', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 9, name: 'Custom API 9', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' },
    { id: 10, name: 'Custom API 10', endpoint: '', param: '', example: '', desc: '', category: '🔧 Custom APIs', visible: false, realAPI: '' }
];

// ========== TIME HELPERS ==========
function getIndiaTime() {
    return new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
}
function getIndiaDateTime() {
    return getIndiaTime().toISOString().replace('T', ' ').substring(0, 19);
}
function parseExpiryDate(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59);
}

// ========== KEY STORAGE (LOAD FROM FILE) ==========
let keyStorage = loadKeys();

// Add default keys ONLY if file was empty
if (Object.keys(keyStorage).length === 0) {
    console.log('📝 Adding default keys...');
    
    keyStorage['BRONX_ULTRA_MASTER_2026'] = {
        name: '👑 BRONX ULTRA OWNER',
        scopes: ['*'], type: 'owner', limit: Infinity, used: 0,
        expiry: null, expiryStr: null, created: getIndiaDateTime(),
        resetType: 'never', unlimited: true, hidden: true
    };
    
    const premiumKeys = [
        { key: 'demo1', name: '📱 Number Hunter Pro', scopes: ['number', 'numv2', 'adv'], limit: 10, expiry: '31-12-2026' },
        { key: 'demo2', name: '🆔 Aadhar Master', scopes: ['aadhar'], limit: 5, expiry: '30-06-2026' },
        { key: 'demo3', name: '🌐 Social Intel', scopes: ['insta', 'git', 'tg'], limit: 20, expiry: '31-12-2026' },
        { key: 'DEMO_KEY_2026', name: '🎁 Demo User', scopes: ['number', 'aadhar', 'pincode'], limit: 10, expiry: '31-12-2026' },
        { key: 'TEST_KEY_2026', name: '🧪 Test User', scopes: ['number'], limit: 5, expiry: '30-06-2026' }
    ];
    
    premiumKeys.forEach(k => {
        keyStorage[k.key] = {
            name: k.name, scopes: k.scopes, type: 'premium',
            limit: k.limit, used: 0, expiry: parseExpiryDate(k.expiry),
            expiryStr: k.expiry, created: getIndiaDateTime(),
            resetType: 'never', unlimited: false, hidden: false
        };
    });
    
    saveKeys();
    console.log('✅ Default keys added and saved!');
}

// ========== KEY MANAGEMENT FUNCTIONS ==========
function checkKeyValid(apiKey) {
    const keyData = keyStorage[apiKey];
    if (!keyData) return { valid: false, error: '❌ Invalid API Key' };
    if (keyData.expiry && getIndiaTime() > new Date(keyData.expiry)) {
        return { valid: false, error: '⏰ Key EXPIRED!', expired: true, expiredDate: keyData.expiryStr };
    }
    if (!keyData.unlimited && keyData.used >= keyData.limit) {
        return { valid: false, error: `🛑 Limit Exhausted! ${keyData.used}/${keyData.limit}`, limitExhausted: true };
    }
    return { valid: true, keyData };
}

function incrementKeyUsage(apiKey) {
    if (keyStorage[apiKey] && !keyStorage[apiKey].unlimited) {
        keyStorage[apiKey].used++;
        saveKeys(); // Auto-save on usage
    }
    return keyStorage[apiKey];
}

function checkKeyScope(keyData, endpoint) {
    if (keyData.scopes.includes('*')) return { valid: true };
    if (keyData.scopes.includes(endpoint)) return { valid: true };
    return { valid: false, error: `❌ No access to '${endpoint}'. Allowed: ${keyData.scopes.join(', ')}` };
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
        if (Array.isArray(obj)) { obj.forEach(removeFields); return; }
        delete obj.by; delete obj.channel; delete obj.BY; delete obj.CHANNEL; delete obj.developer;
        Object.keys(obj).forEach(key => { if (obj[key] && typeof obj[key] === 'object') removeFields(obj[key]); });
    }
    removeFields(cleaned);
    cleaned.by = "@BRONX_ULTRA";
    cleaned.powered_by = "BRONX OSINT API";
    return cleaned;
}

// ############################################
// #        ADMIN PANEL ROUTES               #
// ############################################

app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 BRONX ADMIN</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Courier New',monospace;background:linear-gradient(135deg,#0a0a0a 0%,#1a0033 50%,#0a0a0a 100%);min-height:100vh;display:flex;justify-content:center;align-items:center}
        .box{background:#1a0033;border:3px solid #ff00ff;border-radius:30px;padding:50px 40px;width:400px;box-shadow:0 0 80px #ff00ff66;animation:glow 3s infinite}
        @keyframes glow{0%,100%{box-shadow:0 0 30px #ff00ff66,0 0 60px #00ff4133}50%{box-shadow:0 0 50px #00ff4166,0 0 80px #ff00ff33}}
        h1{color:#00ff41;text-align:center;font-size:36px;text-shadow:0 0 30px #00ff41}
        .sub{color:#ff00ff;text-align:center;margin-bottom:30px;font-size:14px}
        label{color:#00ff41;display:block;margin-bottom:10px;font-size:14px}
        input{width:100%;padding:15px;background:#0a0a0a;border:2px solid #00ff41;border-radius:15px;color:#00ff41;font-size:16px;font-family:'Courier New',monospace;margin-bottom:25px}
        button{width:100%;padding:15px;background:linear-gradient(45deg,#ff00ff,#00ff41);border:none;border-radius:15px;color:#000;font-weight:bold;font-size:18px;cursor:pointer}
        button:hover{transform:scale(1.05);box-shadow:0 0 40px #00ff41}
        .error{color:#f00;text-align:center;margin-top:15px}
    </style>
</head>
<body>
    <div class="box">
        <h1>⚡ BRONX</h1>
        <div class="sub">ADMIN PANEL</div>
        <label>🔑 ADMIN PASSWORD</label>
        <input type="password" id="pass" placeholder="Enter password" autofocus>
        <button onclick="login()">🚀 LOGIN</button>
        <div class="error" id="err"></div>
    </div>
    <script>
        const P='${ADMIN_PASSWORD}';
        function login(){
            if(document.getElementById('pass').value===P){localStorage.setItem('ba','true');location='/admin/dashboard'}
            else{document.getElementById('err').textContent='❌ Invalid!'}
        }
        document.getElementById('pass').onkeypress=e=>{if(e.key==='Enter')login()};
        if(localStorage.getItem('ba')==='true')location='/admin/dashboard';
    </script>
</body>
</html>`);
});

app.get('/admin/dashboard', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DASHBOARD</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Courier New',monospace;background:linear-gradient(135deg,#0a0a0a,#1a0033,#0a0a0a);min-height:100vh;padding:20px;color:#fff}
        .container{max-width:1400px;margin:0 auto}
        .header{background:#1a0033;border:3px solid #ff00ff;border-radius:20px;padding:25px;margin-bottom:25px;display:flex;justify-content:space-between;align-items:center}
        .header h1{color:#00ff41;font-size:32px}
        .btn{padding:12px 25px;border-radius:12px;font-weight:bold;cursor:pointer;border:none;font-family:'Courier New',monospace;margin-left:10px}
        .btn-danger{background:#f003;border:2px solid #f00;color:#f66}
        .btn-success{background:#0f02;border:2px solid #0f0;color:#0f0}
        .btn-primary{background:linear-gradient(45deg,#f0f,#0f0);color:#000}
        .panel{background:#1a0033;border:2px solid #0f0;border-radius:20px;padding:25px;margin-bottom:25px}
        .panel-title{color:#0f0;font-size:22px;margin-bottom:20px}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:20px}
        label{color:#0f0;display:block;margin-bottom:8px;font-size:13px}
        input,select{width:100%;padding:12px;background:#0a0a0a;border:2px solid #0f0;border-radius:10px;color:#0f0;font-family:'Courier New',monospace}
        .scope-selector{display:flex;flex-wrap:wrap;gap:10px;margin:15px 0;max-height:200px;overflow-y:auto;padding:10px;background:#0a0a0a;border-radius:10px}
        .scope-item{padding:8px 15px;background:#1a0033;border:1px solid #0f0;border-radius:20px;color:#0f0;cursor:pointer;font-size:12px}
        .scope-item.selected{background:#0f0;color:#000}
        table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
        th{background:linear-gradient(45deg,#f0f,#0f0);color:#000;padding:12px;text-align:left}
        td{padding:10px;border-bottom:1px solid #fff2}
        .preset-btn{padding:8px 15px;background:#0a0a0a;border:1px solid #f0f;border-radius:20px;color:#f0f;cursor:pointer;font-size:12px;margin:3px}
        .toast{position:fixed;bottom:30px;right:30px;background:#1a0033;color:#0f0;padding:15px 30px;border-radius:50px;border:2px solid #0f0;z-index:9999}
        .action-btn{padding:5px 12px;margin:0 3px;border-radius:8px;font-size:11px;cursor:pointer;background:transparent}
        .action-btn.copy{border:1px solid #f0f;color:#f0f}
        .action-btn.reset{border:1px solid #ff0;color:#ff0}
        .action-btn.delete{border:1px solid #f00;color:#f66}
        .s-active{color:#0f0}.s-expired{color:#f00}.s-exhausted{color:#ff0}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ BRONX ADMIN PANEL</h1>
            <div>
                <button class="btn btn-success" onclick="refresh()">🔄 REFRESH</button>
                <button class="btn btn-danger" onclick="logout()">🚪 LOGOUT</button>
            </div>
        </div>
        
        <div class="panel">
            <div class="panel-title">🔑 KEY GENERATOR</div>
            <div class="grid">
                <div><label>🔐 API KEY</label><input id="nk" placeholder="Auto-generated"></div>
                <div><label>👤 OWNER</label><input id="nn" value="Premium User"></div>
                <div><label>📊 LIMIT</label><input type="number" id="nl" value="100"></div>
                <div><label>⏰ EXPIRY (DD-MM-YYYY)</label><input id="ne" value="31-12-2026"></div>
            </div>
            <div>
                <span class="preset-btn" onclick="sa()">✅ All</span>
                <span class="preset-btn" onclick="cl()">❌ Clear</span>
                <span class="preset-btn" onclick="sp()">📱 Phone</span>
                <span class="preset-btn" onclick="sf()">💰 Finance</span>
                <span class="preset-btn" onclick="sv()">🚗 Vehicle</span>
                <span class="preset-btn" onclick="ss()">🌐 Social</span>
            </div>
            <label style="color:#0f0;margin:10px 0;display:block">📌 SCOPES:</label>
            <div class="scope-selector" id="ss"></div>
            <div class="grid">
                <div><label>✨ UNLIMITED</label><select id="nu"><option value="false">No</option><option value="true">Yes</option></select></div>
                <div><label>👁️ VISIBILITY</label><select id="nh"><option value="false">Visible</option><option value="true">Hidden</option></select></div>
            </div>
            <button class="btn btn-primary" style="width:100%;padding:15px;margin-top:20px" onclick="gen()">🚀 GENERATE</button>
        </div>
        
        <div class="panel">
            <div class="panel-title">📋 ALL KEYS</div>
            <div style="max-height:500px;overflow-y:auto">
                <table>
                    <thead><tr><th>KEY</th><th>OWNER</th><th>LIMIT</th><th>USED</th><th>REMAIN</th><th>EXPIRY</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                    <tbody id="tb"></tbody>
                </table>
            </div>
        </div>
    </div>
    <div id="tc"></div>
    <script>
        if(localStorage.getItem('ba')!=='true')location='/admin';
        const SCOPES=['number','numv2','adv','name','aadhar','upi','ifsc','pan','pincode','ip','vehicle','rc','ff','bgmi','insta','git','tg','pk','pkv2'];
        const sd=document.getElementById('ss');
        SCOPES.forEach(s=>{const e=document.createElement('span');e.className='scope-item';e.textContent=s;e.onclick=function(){this.classList.toggle('selected')};sd.appendChild(e)});
        
        function toast(m,e){const t=document.createElement('div');t.className='toast';t.style.color=e?'#f66':'#0f0';t.textContent=m;document.getElementById('tc').appendChild(t);setTimeout(()=>t.remove(),3000)}
        
        function gs(){return Array.from(document.querySelectorAll('#ss .scope-item.selected')).map(e=>e.textContent)}
        function sa(){document.querySelectorAll('#ss .scope-item').forEach(e=>e.classList.add('selected'))}
        function cl(){document.querySelectorAll('#ss .scope-item').forEach(e=>e.classList.remove('selected'))}
        function sp(){cl();['number','numv2','adv','name','aadhar'].forEach(s=>{Array.from(document.querySelectorAll('#ss .scope-item')).find(e=>e.textContent===s)?.classList.add('selected')})}
        function sf(){cl();['upi','ifsc','pan'].forEach(s=>{Array.from(document.querySelectorAll('#ss .scope-item')).find(e=>e.textContent===s)?.classList.add('selected')})}
        function sv(){cl();['vehicle','rc'].forEach(s=>{Array.from(document.querySelectorAll('#ss .scope-item')).find(e=>e.textContent===s)?.classList.add('selected')})}
        function ss(){cl();['insta','git','tg'].forEach(s=>{Array.from(document.querySelectorAll('#ss .scope-item')).find(e=>e.textContent===s)?.classList.add('selected')})}
        
        async function gen(){
            let k=document.getElementById('nk').value;
            if(!k)k='BRONX_'+Math.random().toString(36).substring(2,10).toUpperCase()+'_'+Date.now().toString(36).toUpperCase();
            const sc=gs();
            if(sc.length===0){toast('❌ Select at least one scope!',true);return}
            try{
                const r=await fetch('/admin/generate-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k,name:document.getElementById('nn').value||'User',scopes:sc,limit:parseInt(document.getElementById('nl').value)||100,expiry:document.getElementById('ne').value||'31-12-2026',unlimited:document.getElementById('nu').value==='true',hidden:document.getElementById('nh').value==='true'})});
                const d=await r.json();
                if(d.success){toast('✅ Generated: '+k);document.getElementById('nk').value='';refresh()}else{toast(d.error||'Failed',true)}
            }catch(e){toast('❌ Error: '+e.message,true)}
        }
        
        async function refresh(){
            try{
                const r=await fetch('/admin/keys');
                const d=await r.json();
                if(d.success){
                    const keys=d.keys;
                    const arr=Object.entries(keys);
                    let active=0,treq=0;
                    arr.forEach(([_,k])=>{treq+=k.used||0;const ne=!k.expiry||k.expiry==='Never'||new Date(k.expiry.split('-').reverse().join('-'))>new Date();const hq=k.limit==='Unlimited'||k.used<k.limit;if(ne&&hq)active++});
                    document.getElementById('tb').innerHTML=arr.map(([kn,k])=>{
                        const ie=k.expiry&&k.expiry!=='Never'&&new Date(k.expiry.split('-').reverse().join('-'))<new Date();
                        const ix=k.limit!=='Unlimited'&&k.used>=k.limit;
                        let st='✅ Active',sc='s-active';
                        if(ie){st='⏰ Expired';sc='s-expired'}else if(ix){st='🛑 Exhausted';sc='s-exhausted'}
                        const dk=kn.length>18?kn.substring(0,15)+'...':kn;
                        const rm=k.limit==='Unlimited'?'∞':Math.max(0,k.limit-k.used);
                        return \`<tr><td><code style="color:#f0f">\${dk}</code>\${k.hidden?' 🔒':''}</td><td>\${k.owner||'-'}</td><td>\${k.limit==='Unlimited'?'∞':k.limit}</td><td>\${k.used||0}</td><td style="color:\${rm===0?'#f66':'#0f0'}">\${rm}</td><td>\${k.expiry||'Never'}</td><td class="\${sc}">\${st}</td><td><button class="action-btn copy" onclick="cpy('\${kn}')">📋</button><button class="action-btn reset" onclick="rst('\${kn}')">🔄</button><button class="action-btn delete" onclick="del('\${kn}')">🗑️</button></td></tr>\`;
                    }).join('');
                }
            }catch(e){console.error(e)}
        }
        
        function logout(){localStorage.removeItem('ba');location='/admin'}
        window.cpy=k=>{navigator.clipboard.writeText(k);toast('📋 Copied!')}
        async function rst(k){if(!confirm('Reset?'))return;await fetch('/admin/reset-usage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k})});toast('✅ Reset!');refresh()}
        async function del(k){if(!confirm('DELETE?'))return;await fetch('/admin/delete-key',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k})});toast('✅ Deleted!');refresh()}
        
        refresh();
    </script>
</body>
</html>`);
});

// ========== ADMIN API ENDPOINTS ==========
app.get('/admin/keys', (req, res) => {
    const allKeys = {};
    Object.entries(keyStorage).forEach(([key, data]) => {
        allKeys[key] = {
            owner: data.name, scopes: data.scopes,
            limit: data.unlimited ? 'Unlimited' : data.limit,
            used: data.used, expiry: data.expiryStr || 'Never',
            hidden: data.hidden || false
        };
    });
    res.json({ success: true, keys: allKeys });
});

app.post('/admin/generate-key', (req, res) => {
    const { key, name, scopes, limit, expiry, unlimited, hidden } = req.body;
    if (!key) return res.json({ success: false, error: 'Key required' });
    if (keyStorage[key]) return res.json({ success: false, error: 'Key exists' });
    
    let expiryDate = null, expiryStr = null;
    if (expiry && expiry !== 'never') {
        const parts = expiry.split('-');
        if (parts.length === 3) {
            expiryDate = new Date(parts[2], parts[1]-1, parts[0], 23, 59, 59);
            expiryStr = expiry;
        }
    }
    
    keyStorage[key] = {
        name: name || 'User', scopes: scopes || ['number'], type: 'premium',
        limit: unlimited ? Infinity : (parseInt(limit) || 100), used: 0,
        expiry: expiryDate, expiryStr: expiryStr, created: getIndiaDateTime(),
        resetType: 'never', unlimited: unlimited || false, hidden: hidden || false
    };
    
    saveKeys(); // ⚡ SAVE TO FILE
    console.log('✅ Key generated:', key, '| Total:', Object.keys(keyStorage).length);
    res.json({ success: true, message: 'Key generated!', key });
});

app.post('/admin/reset-usage', (req, res) => {
    const key = req.body.key;
    if (keyStorage[key]) {
        keyStorage[key].used = 0;
        saveKeys();
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Key not found' });
    }
});

app.delete('/admin/delete-key', (req, res) => {
    const key = req.body.key;
    if (keyStorage[key]) {
        delete keyStorage[key];
        saveKeys();
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Key not found' });
    }
});

// ========== MAIN API ROUTES ==========
app.get('/', (req, res) => {
    const totalKeys = Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length;
    const visibleCustomAPIs = customAPIs.filter(api => api.visible && api.endpoint);
    
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ BRONX OSINT</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Courier New',monospace;background:linear-gradient(135deg,#0a0a0a,#1a0033,#0a0a0a);min-height:100vh;color:#fff;padding:20px}
        .header{text-align:center;padding:40px;border:3px solid;border-image:linear-gradient(45deg,#f0f,#0f0,#ff0,#f00)1;border-radius:30px;margin-bottom:30px;background:#1a0033}
        h1{font-size:56px;background:linear-gradient(45deg,#f0f,#0f0,#ff0);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .badge{display:inline-block;padding:10px 25px;border-radius:50px;margin:10px;border:2px solid;font-weight:bold}
        .b1{color:#f0f;border-color:#f0f}.b2{color:#0f0;border-color:#0f0}.b3{color:#ff0;border-color:#ff0}
        .panel{background:#1a0033;border:2px solid #f0f;border-radius:20px;padding:30px;margin:40px 0}
        h2{color:#0f0;font-size:28px;margin-bottom:20px}
        .input-group{display:flex;gap:15px;flex-wrap:wrap}
        select,input{padding:15px;background:#0a0a0a;border:2px solid #0f0;border-radius:50px;color:#0f0;font-family:'Courier New',monospace;font-size:16px;flex:1}
        button{padding:15px 30px;background:linear-gradient(45deg,#f0f,#0f0);border:none;border-radius:50px;color:#000;font-weight:bold;font-size:16px;cursor:pointer}
        button:hover{transform:scale(1.05);box-shadow:0 0 50px #0f0}
        .result{margin-top:20px;padding:20px;background:#000;border:1px solid #0f0;border-radius:12px;max-height:300px;overflow-y:auto;font-family:monospace;font-size:12px;color:#0f0;display:none}
        .footer{text-align:center;padding:40px;margin-top:50px;border-top:2px solid #f0f}
        .footer p{margin:10px 0;color:#fff}.glow{background:linear-gradient(45deg,#f0f,#0f0,#ff0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:18px;font-weight:bold}
        .toast{position:fixed;bottom:30px;right:30px;background:#1a0033;color:#0f0;padding:15px 30px;border-radius:50px;border:2px solid #0f0;z-index:9999}
    </style>
</head>
<body>
    <div class="header">
        <h1>⚡ BRONX OSINT ⚡</h1>
        <span class="badge b1">🔐 NEON INTELLIGENCE</span>
        <span class="badge b2">🌐 ${totalKeys}+ KEYS</span>
        <span class="badge b3">🔧 CUSTOM APIs</span>
    </div>
    
    <div class="panel">
        <h2>🧪 API TESTING PANEL</h2>
        <div class="input-group">
            <select id="ep">
                ${Object.entries(endpoints).map(([n,e])=>`<option value="${n}">${n.toUpperCase()} - ${e.desc}</option>`).join('')}
                ${visibleCustomAPIs.map(a=>`<option value="c_${a.id}" data-c="1" data-ep="${a.endpoint}" data-p="${a.param}">🔧 ${a.name}</option>`).join('')}
            </select>
            <input id="ak" placeholder="API Key">
            <input id="pv" placeholder="Parameter Value">
            <button onclick="test()">🚀 TEST</button>
        </div>
        <div class="result" id="res"></div>
    </div>
    
    <div class="footer">
        <p class="glow">✨ BRONX OSINT API ✨</p>
        <p style="color:#f0f">Powered by @BRONX_ULTRA</p>
    </div>
    
    <script>
        const endpoints=${JSON.stringify(endpoints)};
        const customAPIs=${JSON.stringify(customAPIs)};
        
        function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2500)}
        
        async function test(){
            const sel=document.getElementById('ep');
            const opt=sel.options[sel.selectedIndex];
            const isC=opt.dataset.c==='1';
            const ak=document.getElementById('ak').value;
            const pv=document.getElementById('pv').value;
            const rd=document.getElementById('res');
            
            if(!ak){toast('❌ Enter API Key');return}
            if(!pv){toast('❌ Enter parameter');return}
            
            let url;
            if(isC){
                const ep=opt.dataset.ep,pm=opt.dataset.p;
                url='/api/custom/'+ep+'?key='+ak+'&'+pm+'='+pv;
            }else{
                const ep=sel.value;
                url='/api/key-bronx/'+ep+'?key='+ak+'&'+endpoints[ep].param+'='+pv;
            }
            
            rd.style.display='block';
            rd.innerHTML='⏳ Loading...';
            try{
                const r=await fetch(url);
                const d=await r.json();
                rd.innerHTML='<pre style="color:#0f0">'+JSON.stringify(d,null,2)+'</pre>';
            }catch(e){
                rd.innerHTML='<pre style="color:#f00">Error: '+e.message+'</pre>';
            }
        }
    </script>
</body>
</html>`);
});

app.get('/test', (req, res) => {
    res.json({ status: '✅ Running', time: getIndiaDateTime(), total_keys: Object.keys(keyStorage).filter(k => !keyStorage[k].hidden).length });
});

app.get('/key-info', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key" });
    const kd = keyStorage[apiKey];
    if (!kd || kd.hidden) return res.status(404).json({ error: "Key not found" });
    res.json({
        key: apiKey, owner: kd.name, type: kd.type, scopes: kd.scopes,
        limit: kd.unlimited ? 'Unlimited' : kd.limit, used: kd.used,
        remaining: kd.unlimited ? 'Unlimited' : Math.max(0, kd.limit - kd.used),
        expiry: kd.expiryStr || 'Never'
    });
});

app.get('/quota', (req, res) => {
    const apiKey = req.query.key;
    if (!apiKey) return res.status(400).json({ error: "Missing key" });
    const kd = keyStorage[apiKey];
    if (!kd || kd.hidden) return res.status(404).json({ error: "Key not found" });
    res.json({
        key: apiKey, used: kd.used,
        remaining: kd.unlimited ? 'Unlimited' : Math.max(0, kd.limit - kd.used)
    });
});

app.get('/api/custom/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    const customAPI = customAPIs.find(a => a.endpoint === endpoint && a.visible);
    if (!customAPI) return res.status(404).json({ error: 'Not found' });
    if (!apiKey) return res.status(401).json({ error: 'Key required' });
    
    const check = checkKeyValid(apiKey);
    if (!check.valid) return res.status(403).json({ error: check.error });
    
    const paramValue = req.query[customAPI.param];
    if (!paramValue) return res.status(400).json({ error: `Missing: ${customAPI.param}` });
    
    try {
        const realUrl = customAPI.realAPI.replace('{param}', paramValue);
        const response = await axios.get(realUrl, { timeout: 30000 });
        incrementKeyUsage(apiKey);
        let data = cleanResponse(response.data);
        data.api_info = { powered_by: "@BRONX_ULTRA", timestamp: getIndiaDateTime() };
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/admin/custom-api', (req, res) => {
    const { slot, api } = req.body;
    if (slot === undefined || slot < 0 || slot >= customAPIs.length) return res.status(400).json({ error: 'Invalid slot' });
    customAPIs[slot] = { ...customAPIs[slot], ...api };
    res.json({ success: true });
});

app.get('/admin/custom-apis', (req, res) => {
    res.json({ success: true, customAPIs });
});

app.get('/api/key-bronx/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const apiKey = req.query.key || req.headers['x-api-key'];
    if (!endpoints[endpoint]) return res.status(404).json({ error: 'Invalid endpoint' });
    if (!apiKey) return res.status(401).json({ error: 'Key required' });
    
    const check = checkKeyValid(apiKey);
    if (!check.valid) return res.status(403).json({ error: check.error });
    
    const scopeCheck = checkKeyScope(check.keyData, endpoint);
    if (!scopeCheck.valid) return res.status(403).json({ error: scopeCheck.error });
    
    const ep = endpoints[endpoint];
    const paramValue = req.query[ep.param];
    if (!paramValue) return res.status(400).json({ error: `Missing: ${ep.param}` });
    
    try {
        const realUrl = `${REAL_API_BASE}/${endpoint}?key=${REAL_API_KEY}&${ep.param}=${encodeURIComponent(paramValue)}`;
        const response = await axios.get(realUrl, { timeout: 30000 });
        const updated = incrementKeyUsage(apiKey);
        let data = cleanResponse(response.data);
        data.api_info = {
            powered_by: "@BRONX_ULTRA", endpoint, key_owner: check.keyData.name,
            limit: check.keyData.unlimited ? 'Unlimited' : check.keyData.limit,
            used: updated.used,
            remaining: check.keyData.unlimited ? 'Unlimited' : Math.max(0, check.keyData.limit - updated.used),
            timestamp: getIndiaDateTime()
        };
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: "Not found", contact: "@BRONX_ULTRA" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 BRONX API running on port ${PORT}`);
    console.log(`📁 Keys file: ${KEYS_FILE}`);
    console.log(`🔑 Total keys loaded: ${Object.keys(keyStorage).length}`);
});

module.exports = app;
