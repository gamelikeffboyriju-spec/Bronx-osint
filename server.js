/* ============================================================
   BRONX ULTRA v7.0 · FULL OSINT PANEL
   Custom API · Guest Mode · Chat · Analytics · Download
   @BRONX_ULTRA · Render.com Ready
   ============================================================ */
const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/* ============================================================
   CONFIG
   ============================================================ */
const CFG = {
  BASE:     process.env.BRONX_API_BASE || 'https://bronx-api-website-com.onrender.com',
  KEY:      process.env.BRONX_API_KEY  || '',
  ADMIN_U:  (process.env.ADMIN_USER    || 'bronx9').toLowerCase(),
  ADMIN_P:  process.env.ADMIN_PASS     || 'bronx9@2025',
  UPI_ID:   process.env.UPI_ID         || 'bronxultra850956@upi',
  UPI_NAME: process.env.UPI_NAME       || 'BRONX ULTRA',
  TG_LINK:  process.env.TG_LINK        || 'https://t.me/BRONX_ULTRA',
  QR_IMG:   process.env.QR_IMG         || 'https://i.ibb.co/dHfR9KD/qr.png',
  PORT:     process.env.PORT           || 3000,
  COOKIE:   'bx_sess',
  KV_URL:   process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL   || '',
  KV_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
};

/* ============================================================
   STORAGE
   ============================================================ */
const MEM = new Map();
async function kvGet(k) {
  if (CFG.KV_URL && CFG.KV_TOKEN) {
    try {
      const r = await fetch(CFG.KV_URL + '/get/' + encodeURIComponent(k), { headers: { Authorization: 'Bearer ' + CFG.KV_TOKEN }});
      const j = await r.json();
      return j && j.result ? JSON.parse(j.result) : null;
    } catch (e) { return null; }
  }
  const v = MEM.get(k); return v ? JSON.parse(v) : null;
}
async function kvSet(k, v, ttl) {
  const s = JSON.stringify(v);
  if (CFG.KV_URL && CFG.KV_TOKEN) {
    let u = CFG.KV_URL + '/set/' + encodeURIComponent(k);
    if (ttl) u += '?EX=' + ttl;
    try { await fetch(u, { method: 'POST', headers: { Authorization: 'Bearer ' + CFG.KV_TOKEN }, body: s }); } catch (e) {}
  } else MEM.set(k, s);
}
async function kvDel(k) {
  if (CFG.KV_URL && CFG.KV_TOKEN) {
    try { await fetch(CFG.KV_URL + '/del/' + encodeURIComponent(k), { method: 'POST', headers: { Authorization: 'Bearer ' + CFG.KV_TOKEN }}); } catch (e) {}
  } else MEM.delete(k);
}
async function kvKeys(p) {
  if (CFG.KV_URL && CFG.KV_TOKEN) {
    try {
      const r = await fetch(CFG.KV_URL + '/keys/' + encodeURIComponent(p) + '*', { headers: { Authorization: 'Bearer ' + CFG.KV_TOKEN }});
      const j = await r.json();
      return (j && j.result) || [];
    } catch (e) { return []; }
  }
  return Array.from(MEM.keys()).filter(k => k.startsWith(p));
}
async function kvIncr(k) {
  const v = await kvGet(k);
  const n = (Number(v) || 0) + 1;
  await kvSet(k, n);
  return n;
}

/* ============================================================
   HELPERS
   ============================================================ */
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function hashPass(p) {
  const s = crypto.randomBytes(16).toString('hex');
  return s + ':' + crypto.scryptSync(p, s, 64).toString('hex');
}
function verifyPass(p, stored) {
  try {
    const parts = String(stored).split(':');
    if (parts.length !== 2) return false;
    const c = crypto.scryptSync(p, parts[0], 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(parts[1], 'hex'), Buffer.from(c, 'hex'));
  } catch (e) { return false; }
}
function setCookie(res, name, val, maxAge) { res.cookie(name, val, { httpOnly: true, sameSite: 'lax', maxAge: maxAge * 1000 }); }
function clearCookie(res, name) { res.clearCookie(name); }
function randToken() { return 'BRONX-' + crypto.randomBytes(8).toString('hex').toUpperCase(); }
function randOrderId() { return 'BXO' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }
function clientIP(req) {
  const f = req.headers['x-forwarded-for'];
  if (f) return String(f).split(',')[0].trim();
  return req.ip || req.connection.remoteAddress || 'unknown';
}
function deviceName(ua) {
  ua = String(ua || '');
  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Mac/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  let br = 'Browser';
  if (/Edg/i.test(ua)) br = 'Edge';
  else if (/Chrome/i.test(ua)) br = 'Chrome';
  else if (/Firefox/i.test(ua)) br = 'Firefox';
  else if (/Safari/i.test(ua)) br = 'Safari';
  return br + ' · ' + os;
}
function emailToUid(email) { return 'u_' + crypto.createHash('sha256').update(String(email).toLowerCase()).digest('hex').slice(0, 24); }
function isGmail(email) { return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(String(email || '')); }
function todayKey() { return new Date().toISOString().slice(0, 10); }
function monthKey() { return new Date().toISOString().slice(0, 7); }
function yearKey() { return new Date().toISOString().slice(0, 4); }

/* ============================================================
   SESSIONS
   ============================================================ */
async function getSession(req) {
  const t = req.cookies[CFG.COOKIE];
  if (!t) return null;
  const s = await kvGet('sess:' + t);
  if (!s) return null;
  if (s.exp && Date.now() > s.exp) { await kvDel('sess:' + t); return null; }
  if (s.role === 'user') {
    const u = await kvGet('user:' + s.uid);
    if (!u) { await kvDel('sess:' + t); return null; }
    if (u.banned) { await kvDel('sess:' + t); return null; }
  }
  return Object.assign({ token: t }, s);
}
async function createSession(user, role, extra, ttl) {
  const t = crypto.randomBytes(32).toString('hex');
  await kvSet('sess:' + t, Object.assign({ user, role, exp: Date.now() + ttl * 1000 }, extra || {}), ttl);
  return t;
}

/* ============================================================
   CONFIG · Features + Plans + Guest Settings
   ============================================================ */
const DEFAULT_FEATURES = [
  { id:'numinfo', name:'Number Info', emoji:'📱', color:'#22d3ee', hint:'10 DIGIT NUMBER', placeholder:'9876543210',
    mode:'bronx', endpoint:'/api/key-bronx/number', param:'num', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'General', priority:1,
    type:'number', upper:false, len:null, active:true, freeAllowed:true, freeLimit:3 },
  { id:'numleak', name:'Advance Num Info', emoji:'🕵️', color:'#a855f7', hint:'10 DIGIT NUMBER', placeholder:'9876543210',
    mode:'bronx', endpoint:'/api/key-bronx/numleak', param:'num', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'General', priority:2,
    type:'number', upper:false, len:null, active:true, freeAllowed:true, freeLimit:2 },
  { id:'aadhar', name:'Aadhar Info', emoji:'🪪', color:'#22c55e', hint:'12 DIGIT AADHAR', placeholder:'393933081942',
    mode:'bronx', endpoint:'/api/key-bronx/aadhar', param:'num', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'ID', priority:3,
    type:'number', upper:false, len:12, active:true, freeAllowed:false, freeLimit:0 },
  { id:'veh2num', name:'Vehicle → Mobile', emoji:'🚗', color:'#f97316', hint:'VEHICLE NUMBER', placeholder:'KL41V3504',
    mode:'bronx', endpoint:'/api/key-bronx/veh2num', param:'vehicle', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'Vehicle', priority:4,
    type:'text', upper:true, len:null, active:true, freeAllowed:false, freeLimit:0 },
  { id:'upi', name:'UPI Info', emoji:'💳', color:'#22c55e', hint:'UPI ID', placeholder:'example@ybl',
    mode:'bronx', endpoint:'/api/key-bronx/upi', param:'upi', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'Bank', priority:5,
    type:'text', upper:false, len:null, active:true, freeAllowed:true, freeLimit:2 },
  { id:'ifsc', name:'IFSC Info', emoji:'🏦', color:'#eab308', hint:'11 CHAR IFSC', placeholder:'SBIN0001234',
    mode:'bronx', endpoint:'/api/key-bronx/ifsc', param:'ifsc', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'Bank', priority:6,
    type:'text', upper:true, len:11, active:true, freeAllowed:true, freeLimit:3 },
  { id:'pincode', name:'Pincode Info', emoji:'📍', color:'#38bdf8', hint:'6 DIGIT PINCODE', placeholder:'110001',
    mode:'bronx', endpoint:'/api/key-bronx/pincode', param:'pin', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'Location', priority:7,
    type:'number', upper:false, len:6, active:true, freeAllowed:true, freeLimit:5 },
  { id:'ip', name:'IP Info', emoji:'🌐', color:'#2aabee', hint:'IP ADDRESS', placeholder:'8.8.8.8',
    mode:'bronx', endpoint:'/api/key-bronx/ip', param:'ip', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'Network', priority:8,
    type:'text', upper:false, len:null, active:true, freeAllowed:true, freeLimit:5 },
  { id:'ff', name:'Free Fire Info', emoji:'🎮', color:'#f97316', hint:'FREE FIRE UID', placeholder:'123456789',
    mode:'bronx', endpoint:'/api/key-bronx/ff', param:'uid', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'Gaming', priority:9,
    type:'text', upper:false, len:null, active:true, freeAllowed:false, freeLimit:0 },
  { id:'mail', name:'Mail Info', emoji:'📧', color:'#ec4899', hint:'EMAIL ADDRESS', placeholder:'example@gmail.com',
    mode:'bronx', endpoint:'/api/custom/mail', param:'num', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'Social', priority:10,
    type:'text', upper:false, len:null, active:true, freeAllowed:false, freeLimit:0 },
  { id:'tginfo', name:'Telegram Lookup', emoji:'✈️', color:'#2aabee', hint:'USERNAME or ID', placeholder:'@JAUUOWNER',
    mode:'bronx', endpoint:'/api/custom/user', param:'num', fullUrl:'',
    method:'GET', headers:'', responseType:'json', group:'Social', priority:11,
    type:'text', upper:false, len:null, active:true, freeAllowed:false, freeLimit:0 }
];

const DEFAULT_PLANS = [
  { id:'p1d',  label:"1 Day's",  days:1,  price:20,   tag:'Testing plan 🥳',         popular:false },
  { id:'p5d',  label:"5 Day's",  days:5,  price:70,   tag:'Noob plan',               popular:false },
  { id:'p10d', label:"10 Day's", days:10, price:100,  tag:'Silver plan',             popular:false },
  { id:'p30d', label:"30 Day's", days:30, price:500,  tag:'Recommended Pro Plan ❤️', popular:true  },
  { id:'p60d', label:"60 Day's", days:60, price:1000, tag:'Vip Plan',                popular:false },
  { id:'p90d', label:"90 Day's", days:90, price:1500, tag:'Ultra VIP Plan',          popular:false }
];

const DEFAULT_SETTINGS = {
  guestEnabled: true,
  guestDailyLimit: 5,
  guestMessage: 'Free limit reached! Please login or buy a plan to continue.'
};

/* ============================================================
   FEATURE SANITIZER
   ============================================================ */
function sanitizeFeature(x, i) {
  x = x || {};
  let endpoint = String(x.endpoint || '/api/key-bronx/number').trim();
  if (endpoint.charAt(0) !== '/') endpoint = '/' + endpoint;
  let mode = (x.mode === 'custom') ? 'custom' : 'bronx';
  const fullUrl = String(x.fullUrl || '').trim();
  let autoParam = String(x.param || 'num').slice(0, 30);

  return {
    id:          String(x.id || ('feat_' + Date.now() + '_' + i)).slice(0, 60),
    name:        String(x.name || ('Feature ' + (i + 1))).slice(0, 60),
    emoji:       String(x.emoji || '🔍').slice(0, 8),
    color:       String(x.color || '#22d3ee').slice(0, 20),
    hint:        String(x.hint || 'Enter value').slice(0, 80),
    placeholder: String(x.placeholder || 'value').slice(0, 80),
    mode,
    endpoint:    endpoint.slice(0, 200),
    param:       autoParam,
    fullUrl:     fullUrl.slice(0, 800),
    method:      String(x.method || 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET',
    headers:     String(x.headers || '').slice(0, 800),
    responseType:['json','text','xml','html'].indexOf(String(x.responseType||'json').toLowerCase()) >= 0
                  ? String(x.responseType||'json').toLowerCase() : 'json',
    group:       String(x.group || 'General').slice(0, 40),
    tags:        String(x.tags || '').slice(0, 100),
    priority:    Number(x.priority) || (i + 1),
    type:        String(x.type || 'text').slice(0, 20),
    upper:       !!x.upper,
    len:         x.len ? Number(x.len) : null,
    active:      x.active !== false,
    freeAllowed: !!x.freeAllowed,
    freeLimit:   Number(x.freeLimit) || 0
  };
}

async function getFeatures() {
  let f = await kvGet('config:features');
  if (!f || !Array.isArray(f) || f.length === 0) {
    await kvSet('config:features', DEFAULT_FEATURES);
    return DEFAULT_FEATURES.map(sanitizeFeature);
  }
  return f.map(sanitizeFeature);
}
async function getPlans() {
  const p = await kvGet('config:plans');
  if (p && Array.isArray(p) && p.length) return p;
  await kvSet('config:plans', DEFAULT_PLANS);
  return DEFAULT_PLANS.slice();
}
async function getSettings() {
  const s = await kvGet('config:settings');
  if (s) return Object.assign({}, DEFAULT_SETTINGS, s);
  await kvSet('config:settings', DEFAULT_SETTINGS);
  return Object.assign({}, DEFAULT_SETTINGS);
}
async function adminCreds() {
  const c = await kvGet('admin:creds');
  if (c) return c;
  return { u: CFG.ADMIN_U, p: hashPass(CFG.ADMIN_P) };
}

/* ============================================================
   URL BUILDER — Custom URL, full URL direct use
   ============================================================ */
function buildCustomUrl(feat, q) {
  let url = String(feat.fullUrl || '').trim();
  if (!url) return null;

  const enc = encodeURIComponent(String(q));

  /* Support many placeholders — but if user gives FULL URL with key already, use it directly */
  const placeholders = ['{q}','{p}','{num}','{value}','{input}','{query}','{Q}','{P}','{NUM}','{VALUE}','{QUERY}','%s'];
  let replaced = false;
  for (const ph of placeholders) {
    if (url.indexOf(ph) !== -1) {
      url = url.split(ph).join(enc);
      replaced = true;
    }
  }

  /* If no placeholder at all → try to fill last empty param OR append */
  if (!replaced) {
    /* If URL ends with "=" (like num=) → fill it */
    if (/[?&](num|q|query|value|input|phone|mobile|vehicle|upi|ifsc|pin|ip|uid)=$/i.test(url)) {
      url += enc;
    } else if (/[?&](num|q|query|value|input|phone|mobile|vehicle|upi|ifsc|pin|ip|uid)=(&|$)/i.test(url)) {
      url = url.replace(/([?&](?:num|q|query|value|input|phone|mobile|vehicle|upi|ifsc|pin|ip|uid)=)(&|$)/i, '$1' + enc + '$2');
    } else {
      url += (url.indexOf('?') === -1 ? '?' : '&') + 'q=' + enc;
    }
  }

  return url;
}

function buildBronxUrl(feat, q) {
  let endpoint = String(feat.endpoint || '').trim();
  if (endpoint.charAt(0) !== '/') endpoint = '/' + endpoint;
  const param = feat.param || 'num';
  return CFG.BASE + endpoint + '?key=' + encodeURIComponent(CFG.KEY) + '&' + param + '=' + encodeURIComponent(q);
}

function parseHeaders(str) {
  const out = {};
  String(str || '').split('\n').forEach(line => {
    const i = line.indexOf(':');
    if (i > 0) {
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim();
      if (k) out[k] = v;
    }
  });
  return out;
}

/* ============================================================
   CSS
   ============================================================ */
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#05070c;color:#fff;min-height:100vh;overflow-x:hidden;position:relative}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 20% 20%,rgba(239,43,58,.2),transparent 55%),radial-gradient(ellipse at 80% 80%,rgba(34,211,238,.14),transparent 60%)}
body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:linear-gradient(rgba(239,43,58,.05) 1px,transparent 1px) 0 0/100% 120px,linear-gradient(90deg,rgba(239,43,58,.03) 1px,transparent 1px) 0 0/120px 100%;-webkit-mask-image:radial-gradient(ellipse at center,#000 20%,transparent 75%);mask-image:radial-gradient(ellipse at center,#000 20%,transparent 75%)}
.wrap{position:relative;z-index:1}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;font-size:12px;letter-spacing:.2em;font-weight:800;border-radius:8px;cursor:pointer;font-family:inherit;text-decoration:none;border:1px solid #22d3ee;color:#22d3ee;background:rgba(34,211,238,.08);transition:.2s}
.btn:hover{background:rgba(34,211,238,.2);box-shadow:0 0 25px rgba(34,211,238,.4)}
.btn.red{border-color:#ef2b3a;color:#ef2b3a;background:rgba(239,43,58,.08)}
.btn.red:hover{background:rgba(239,43,58,.2)}
.btn.gr{border-color:#22c55e;color:#22c55e;background:rgba(34,197,94,.08)}
.btn.gr:hover{background:rgba(34,197,94,.2)}
.btn.gd{border-color:#eab308;color:#eab308;background:rgba(234,179,8,.08)}
.btn.gd:hover{background:rgba(234,179,8,.2)}
.btn.sm{padding:7px 12px;font-size:10px;letter-spacing:.15em}
.btn:disabled{opacity:.4;cursor:not-allowed}
.chip{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;font-size:11px;letter-spacing:.15em;font-weight:700;color:#22d3ee;border:1px solid rgba(34,211,238,.55);background:rgba(34,211,238,.06);border-radius:6px;cursor:pointer;text-decoration:none;transition:.2s;font-family:inherit}
.chip:hover{background:rgba(34,211,238,.15)}
.chip.red{color:#ef2b3a;border-color:rgba(239,43,58,.55);background:rgba(239,43,58,.08)}
.chip.gd{color:#eab308;border-color:rgba(234,179,8,.55);background:rgba(234,179,8,.08)}
.chip.gr{color:#22c55e;border-color:rgba(34,197,94,.55);background:rgba(34,197,94,.08)}
.dot{width:8px;height:8px;border-radius:999px;background:#ef2b3a;box-shadow:0 0 10px #ef2b3a;display:inline-block}
.dot.green{background:#22c55e;box-shadow:0 0 10px #22c55e}
.dot.gd{background:#eab308;box-shadow:0 0 10px #eab308}
input,select,textarea{width:100%;padding:10px 12px;font-size:13px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.15);border-radius:8px;color:#fff;outline:none;font-family:inherit}
input:focus,select:focus,textarea:focus{border-color:#22d3ee;box-shadow:0 0 0 2px rgba(34,211,238,.15)}
input:disabled{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.4);color:#86efac;cursor:not-allowed}
label{display:block;text-align:left;font-size:10px;letter-spacing:.25em;color:#94a3b8;margin-bottom:6px;font-weight:700;margin-top:12px}
.err{margin-top:14px;padding:10px;border-radius:8px;font-size:12px;color:#ff6b8a;background:rgba(255,46,99,.08);border:1px solid rgba(255,46,99,.35);display:none}
.err.show{display:block}
.ok{margin-top:14px;padding:10px;border-radius:8px;font-size:12px;color:#86efac;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.35);display:none}
.ok.show{display:block}
.center{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;z-index:1}
.box{width:100%;max-width:440px;padding:36px 28px;border-radius:18px;background:linear-gradient(180deg,rgba(0,0,0,.75),rgba(0,0,0,.9));border:1px solid rgba(239,43,58,.5);box-shadow:0 0 60px rgba(239,43,58,.35);text-align:center}
.logo{width:72px;height:72px;margin:0 auto 18px;display:grid;place-items:center;font-size:34px;background:linear-gradient(135deg,rgba(239,43,58,.7),#000);border:1px solid rgba(239,43,58,.9);clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);box-shadow:0 0 30px rgba(239,43,58,.6)}
h1{font-size:26px;letter-spacing:.2em;font-weight:900;margin-bottom:6px}
h1 span{color:#ef2b3a}
.sub{color:#22d3ee;font-size:11px;letter-spacing:.4em;margin-bottom:24px}
.broadcast{position:fixed;top:0;left:0;right:0;z-index:200;padding:12px 20px;background:linear-gradient(90deg,rgba(239,43,58,.95),rgba(234,179,8,.95));color:#fff;font-weight:700;font-size:13px;text-align:center;box-shadow:0 4px 20px rgba(239,43,58,.5)}
.or{display:flex;align-items:center;gap:12px;color:#64748b;font-size:10px;letter-spacing:.3em;margin:18px 0}
.or::before,.or::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.1)}
.admin-toggle{margin-top:22px;font-size:10px;letter-spacing:.2em;color:#64748b;background:none;border:0;cursor:pointer;font-family:inherit;text-decoration:underline}
.admin-form{margin-top:14px;display:none;text-align:left}
.admin-form.show{display:block}
.info{font-size:11px;color:#94a3b8;line-height:1.6;margin-top:12px;padding:10px;border-radius:8px;background:rgba(34,211,238,.04);border:1px solid rgba(34,211,238,.25)}
`;

const BROADCAST_JS = [
  'function loadBroadcast(){',
  '  fetch("/api/broadcast").then(function(r){ return r.json(); }).then(function(j){',
  '    if (j && j.active && j.message){',
  '      var d = document.createElement("div");',
  '      d.className = "broadcast";',
  '      d.textContent = "📢 " + String(j.message);',
  '      document.body.appendChild(d);',
  '    }',
  '  }).catch(function(e){});',
  '}'
].join('\n');

/* ============================================================
   HTML · LOGIN
   ============================================================ */
const LOGIN_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BRONX ULTRA · Sign In</title>
<style>${CSS}</style></head>
<body>
<div class="center">
  <div class="box">
    <div class="logo">🕵️</div>
    <h1><span>BRONX</span> ULTRA</h1>
    <div class="sub">@BRONX_ULTRA · v7.0</div>
    <label>GMAIL (@gmail.com) *</label>
    <input id="gu" type="email" placeholder="example@gmail.com" autocomplete="email"/>
    <label>PASSWORD (any) *</label>
    <input id="gp" type="password" placeholder="Enter password" autocomplete="current-password"/>
    <button class="btn gr" style="width:100%;margin-top:16px;padding:14px" onclick="doLogin()">🔐 SIGN IN</button>
    <div class="info" style="margin-top:14px">
      Sirf <b style="color:#22d3ee">@gmail.com</b> allowed. Same Gmail + Password = same data.
    </div>
    <div class="err" id="err"></div>
    <div class="or">OR</div>
    <a class="btn gd" href="/payment" style="width:100%">💳 BUY ACCESS</a>
    <a class="btn" href="${esc(CFG.TG_LINK)}" target="_blank" style="width:100%;margin-top:10px">💬 SUPPORT</a>
    <button class="admin-toggle" onclick="document.getElementById('adminForm').classList.toggle('show')">🔒 ADMIN LOGIN</button>
    <div class="admin-form" id="adminForm">
      <label>ADMIN USERNAME</label><input id="au" placeholder="admin"/>
      <label>ADMIN PASSWORD</label><input id="ap" type="password"/>
      <button class="btn red" style="width:100%;margin-top:12px" onclick="adminLogin()">LOGIN AS ADMIN</button>
      <div class="err" id="aerr"></div>
    </div>
  </div>
</div>
<script>
${BROADCAST_JS}
loadBroadcast();
function showErr(msg, id){
  var e = document.getElementById(id || 'err');
  e.textContent = msg; e.classList.add('show');
  setTimeout(function(){ e.classList.remove('show'); }, 5000);
}
function getFP(){
  return new Promise(function(resolve){
    try{
      var d = [navigator.userAgent, navigator.language, screen.width+'x'+screen.height, screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency||0, navigator.platform||''].join('|');
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(d)).then(function(b){
        var arr = Array.from(new Uint8Array(b));
        resolve(arr.map(function(x){ return x.toString(16).padStart(2,'0'); }).join(''));
      }).catch(function(){ resolve(localFP()); });
    }catch(e){ resolve(localFP()); }
  });
}
function localFP(){ var x=localStorage.getItem('bx_fp'); if(!x){ x='fp-'+Math.random().toString(36).slice(2)+Date.now(); localStorage.setItem('bx_fp',x); } return x; }
function doLogin(){
  var u = document.getElementById('gu').value.trim().toLowerCase();
  var p = document.getElementById('gp').value;
  if (!u || !p){ showErr('Gmail aur password daalein'); return; }
  var re = /^[a-z0-9._%+-]+@gmail\\.com$/;
  if (!re.test(u)){ showErr('Sirf @gmail.com allowed'); return; }
  getFP().then(function(fp){
    return fetch('/api/auth/gmail', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:u, password:p, fp:fp, ua:navigator.userAgent, device: navigator.platform||'' }) });
  }).then(function(r){ return r.json(); }).then(function(j){
    if (j.ok){ location.href = '/'; return; }
    showErr(j.error || 'Login failed');
  }).catch(function(e){ showErr('Network error: ' + e.message); });
}
function adminLogin(){
  var u = document.getElementById('au').value.trim(), p = document.getElementById('ap').value;
  if (!u || !p){ showErr('Missing credentials', 'aerr'); return; }
  fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ u:u, p:p }) })
    .then(function(r){ return r.json(); }).then(function(j){
      if (j.ok){ location.href='/admin'; return; }
      showErr(j.error||'Login failed', 'aerr');
    }).catch(function(e){ showErr(e.message, 'aerr'); });
}
document.addEventListener('keydown', function(e){ if (e.key==='Enter') doLogin(); });
</script>
</body></html>`;

/* ============================================================
   HTML · LANDING (Guest Mode Enabled)
   ============================================================ */
const LANDING_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BRONX ULTRA · OSINT</title>
<style>
${CSS}
header{padding:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;position:relative;z-index:1}
.brand{display:flex;align-items:center;gap:10px}
.logo2{width:44px;height:44px;display:grid;place-items:center;font-size:20px;background:linear-gradient(135deg,rgba(239,43,58,.6),#000);border:1px solid rgba(239,43,58,.7);clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);box-shadow:0 0 20px rgba(239,43,58,.5)}
.brand-name{font-weight:900;letter-spacing:.15em;font-size:22px;line-height:1}
.brand-name .r{color:#ef2b3a}
.brand-sub{color:#22d3ee;letter-spacing:.4em;font-size:10px;margin-top:4px}
.hero{text-align:center;padding:16px;position:relative;z-index:1}
.title{font-family:Impact,"Arial Black",sans-serif;font-weight:900;font-size:clamp(40px,10vw,120px);line-height:1;text-shadow:0 0 40px rgba(239,43,58,.45)}
.title .red{color:#ef2b3a}
.tag{display:inline-flex;align-items:center;gap:12px;margin-top:16px;color:#22d3ee;letter-spacing:.3em;font-size:12px}
.tag .ln{height:1px;width:50px;background:#ef2b3a;box-shadow:0 0 8px #ef2b3a}
.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:24px auto 0;max-width:1200px;padding:0 16px;position:relative;z-index:1}
@media(min-width:700px){.cards{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(min-width:1024px){.cards{grid-template-columns:repeat(5,minmax(0,1fr))}}
.card{--a:#22d3ee;display:flex;flex-direction:column;align-items:center;padding:20px 12px;border-radius:14px;background:linear-gradient(180deg,rgba(0,0,0,.6),rgba(0,0,0,.85));border:1px solid color-mix(in oklab,var(--a) 55%,transparent);box-shadow:0 0 0 1px color-mix(in oklab,var(--a) 25%,transparent),0 0 30px color-mix(in oklab,var(--a) 30%,transparent);transition:transform .25s;cursor:pointer;position:relative}
.card:hover{transform:translateY(-3px)}
.card .ic{width:68px;height:68px;border-radius:999px;display:grid;place-items:center;border:2px solid var(--a);background:color-mix(in oklab,var(--a) 12%,#000);box-shadow:0 0 25px color-mix(in oklab,var(--a) 50%,transparent);font-size:30px;color:var(--a)}
.card h3{margin-top:14px;font-size:15px;font-weight:800;text-align:center}
.card .sub{margin-top:4px;font-size:10px;letter-spacing:.2em;color:var(--a);text-align:center}
.card .btn{margin-top:16px;width:100%;padding:10px;font-size:11px}
.free-badge{position:absolute;top:8px;right:8px;padding:3px 8px;font-size:9px;font-weight:900;letter-spacing:.1em;background:linear-gradient(135deg,#22c55e,#10b981);color:#fff;border-radius:6px;box-shadow:0 0 10px rgba(34,197,94,.5)}
.popup{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;background:rgba(2,4,8,.85);backdrop-filter:blur(10px);padding:20px}
.popup.show{display:flex}
.popup-box{max-width:400px;width:100%;padding:28px;border-radius:16px;background:linear-gradient(180deg,rgba(14,27,42,.95),rgba(8,18,31,.95));border:1px solid rgba(34,211,238,.5);text-align:center}
.popup-box .ic{font-size:44px}
.popup-box h3{margin-top:12px;font-size:16px;letter-spacing:.15em;font-weight:900;color:#22d3ee}
.popup-box p{margin-top:12px;font-size:13px;color:#94a3b8;line-height:1.6}
.popup-box .btns{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}
.popup-box .btn{flex:1;min-width:120px}
footer{margin-top:40px;border-top:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.6);padding:20px 16px;text-align:center;font-size:11px;letter-spacing:.2em;color:#94a3b8;position:relative;z-index:1}
</style></head>
<body>
<header>
  <div class="brand">
    <div class="logo2">🕵️</div>
    <div><div class="brand-name"><span class="r">BRONX</span> ULTRA</div><div class="brand-sub">@BRONX_ULTRA</div></div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <a class="chip gd" href="/payment">💳 BUY ACCESS</a>
    <a class="chip" href="${esc(CFG.TG_LINK)}" target="_blank">💬 SUPPORT</a>
    <a class="chip red" href="/login">🔐 SIGN IN</a>
  </div>
</header>
<section class="hero">
  <h1 class="title"><span class="red">BRONX</span> ULTRA</h1>
  <div class="tag"><span class="ln"></span>SEARCH · ANALYZE · INVESTIGATE<span class="ln"></span></div>
</section>
<div id="guestBanner" style="max-width:1100px;margin:0 auto;padding:0 16px;position:relative;z-index:1"></div>
<section class="cards" id="cards"></section>
<footer>© BRONX ULTRA · @BRONX_ULTRA · v7.0</footer>

<div class="popup" id="popup">
  <div class="popup-box">
    <div class="ic" id="popupIc">🔐</div>
    <h3 id="popupTitle">LOGIN REQUIRED</h3>
    <p id="popupMsg">Ye feature use karne ke liye pehle login karna hoga.</p>
    <div class="btns" id="popupBtns">
      <a class="btn" href="/login">🔐 SIGN IN</a>
      <a class="btn gd" href="/payment">💳 BUY</a>
    </div>
    <button class="btn red" style="width:100%;margin-top:10px" onclick="closePopup()">✕ CLOSE</button>
  </div>
</div>

<script>
${BROADCAST_JS}
loadBroadcast();
var FEATURES = [];
var SETTINGS = { guestEnabled:true, guestDailyLimit:5 };
var GUEST = { count: 0, limit: 5, remaining: 0 };

function escapeHTML(s){
  return String(s == null ? '' : s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
}
function getFP(){
  return new Promise(function(resolve){
    try{
      var d = [navigator.userAgent, navigator.language, screen.width+'x'+screen.height, screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency||0, navigator.platform||''].join('|');
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(d)).then(function(b){
        var arr = Array.from(new Uint8Array(b));
        resolve(arr.map(function(x){ return x.toString(16).padStart(2,'0'); }).join(''));
      }).catch(function(){ resolve(localFP()); });
    }catch(e){ resolve(localFP()); }
  });
}
function localFP(){ var x=localStorage.getItem('bx_fp'); if(!x){ x='fp-'+Math.random().toString(36).slice(2)+Date.now(); localStorage.setItem('bx_fp',x); } return x; }

fetch('/api/features').then(function(r){ return r.json(); }).then(function(j){
  FEATURES = (j && j.features) || [];
  if (j && j.settings) SETTINGS = j.settings;
  renderCards();
  updateGuestBanner();
}).catch(function(){ FEATURES = []; renderCards(); });

function updateGuestBanner(){
  var el = document.getElementById('guestBanner');
  if (!SETTINGS.guestEnabled) return;
  getFP().then(function(fp){
    fetch('/api/guest/status?fp=' + fp).then(function(r){ return r.json(); }).then(function(j){
      if (j.ok){
        GUEST = j;
        var remaining = j.remaining || 0;
        var total = j.limit || 0;
        var used = j.count || 0;
        var color = remaining > 0 ? '#86efac' : '#fcd34d';
        var bg = remaining > 0 ? 'rgba(34,197,94,.08)' : 'rgba(234,179,8,.08)';
        var bd = remaining > 0 ? 'rgba(34,197,94,.4)' : 'rgba(234,179,8,.4)';
        el.innerHTML = '<div style="margin-top:16px;padding:12px 18px;border-radius:10px;background:' + bg + ';border:1px solid ' + bd + ';color:' + color + ';font-size:12px;letter-spacing:.08em;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">'
          + '<span>🎁 <b>FREE GUEST MODE</b> · ' + used + '/' + total + ' searches used today</span>'
          + '<span>' + remaining + ' remaining · Resets at midnight</span>'
          + '</div>';
      }
    }).catch(function(){});
  });
}

function renderCards(){
  var h = '';
  for (var i = 0; i < FEATURES.length; i++){
    var f = FEATURES[i];
    if (f.active === false) continue;
    var freeBadge = f.freeAllowed ? '<div class="free-badge">FREE ' + (f.freeLimit || 0) + '</div>' : '';
    h += '<div class="card" style="--a:' + escapeHTML(f.color || '#22d3ee') + '" onclick="tryFeature(\\'' + escapeHTML(f.id) + '\\')">';
    h += freeBadge;
    h += '<div class="ic">' + escapeHTML(f.emoji || '🔍') + '</div>';
    h += '<h3>' + escapeHTML(f.name) + '</h3>';
    h += '<div class="sub">' + escapeHTML(f.hint || '') + '</div>';
    h += '<button class="btn">🔓 OPEN</button>';
    h += '</div>';
  }
  var el = document.getElementById('cards');
  if (!h) el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8">No features configured</div>';
  else el.innerHTML = h;
}
function tryFeature(id){
  var f = null;
  for (var i = 0; i < FEATURES.length; i++){ if (FEATURES[i].id === id){ f = FEATURES[i]; break; } }
  if (!f) return;
  if (f.freeAllowed && SETTINGS.guestEnabled){
    location.href = '/guest?feature=' + encodeURIComponent(f.id);
    return;
  }
  document.getElementById('popupMsg').textContent = '"' + f.name + '" use karne ke liye login karein ya plan buy karein.';
  document.getElementById('popup').classList.add('show');
}
function closePopup(){ document.getElementById('popup').classList.remove('show'); }
</script>
</body></html>`;

/* ============================================================
   HTML · GUEST SEARCH PAGE
   ============================================================ */
const GUEST_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BRONX ULTRA · Guest</title>
<style>
${CSS}
.wrap{max-width:1000px;margin:0 auto;padding:20px;position:relative;z-index:1}
.ghead{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 18px;border-radius:14px;background:rgba(0,0,0,.5);border:1px solid rgba(34,211,238,.35);margin-bottom:20px}
.search-card{padding:28px;border-radius:16px;background:linear-gradient(180deg,rgba(14,27,42,.85),rgba(8,18,31,.65));border:1px solid rgba(34,211,238,.4);text-align:center}
.big-ic{width:88px;height:88px;border-radius:999px;display:grid;place-items:center;margin:0 auto;font-size:38px;border:2px solid #22d3ee;background:rgba(34,211,238,.1);color:#22d3ee;box-shadow:0 0 30px rgba(34,211,238,.5)}
.search-card h1{margin-top:16px;font-size:24px;font-weight:900;letter-spacing:.05em}
.search-card .hint{margin-top:6px;color:#7fefff;font-size:11px;letter-spacing:.25em}
.sbox{margin-top:22px;display:flex;gap:10px;padding:6px;border-radius:12px;background:rgba(0,0,0,.6);border:1px solid rgba(34,211,238,.5)}
.sbox input{flex:1;border:0;background:transparent;padding:12px;font-size:15px}
.sbox input:focus{box-shadow:none}
.sbox .go{padding:12px 20px;font-size:12px;font-weight:800;letter-spacing:.2em;border-radius:8px;background:linear-gradient(135deg,#22d3ee,#3B82F6);color:#000;border:0;cursor:pointer;font-family:inherit}
.sbox .go:disabled{opacity:.5}
.result{margin-top:20px;text-align:left}
.res-card{padding:20px;border-radius:14px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.08);margin-top:14px}
.res-card .head{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.08)}
.res-card .title{font-weight:900;letter-spacing:.08em;color:#22d3ee;font-size:13px}
.res-card .actions{display:flex;gap:6px;flex-wrap:wrap}
.rrow{display:grid;grid-template-columns:220px 1fr;gap:14px;padding:10px 0;border-top:1px solid rgba(255,255,255,.05)}
.rrow:first-child{border-top:0}
.rlbl{font-size:11px;letter-spacing:.15em;color:#22d3ee;font-weight:700;text-transform:uppercase;word-break:break-word}
.rval{font-size:13px;color:#F8FAFC;font-weight:600;line-height:1.5;word-break:break-word;font-family:ui-monospace,monospace}
.loading{text-align:center;padding:30px;color:#7fefff;font-size:12px;letter-spacing:.2em}
@media(max-width:700px){.rrow{grid-template-columns:1fr;gap:4px}}
.popup{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;background:rgba(2,4,8,.85);backdrop-filter:blur(10px);padding:20px}
.popup.show{display:flex}
.popup-box{max-width:400px;width:100%;padding:28px;border-radius:16px;background:linear-gradient(180deg,rgba(14,27,42,.95),rgba(8,18,31,.95));border:1px solid rgba(234,179,8,.5);text-align:center}
.popup-box .ic{font-size:44px}
.popup-box h3{margin-top:12px;font-size:16px;letter-spacing:.15em;font-weight:900;color:#eab308}
.popup-box p{margin-top:12px;font-size:13px;color:#94a3b8;line-height:1.6}
.popup-box .btns{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}
.popup-box .btn{flex:1;min-width:120px}
</style></head>
<body>
<div class="wrap">
  <div class="ghead">
    <div style="display:flex;align-items:center;gap:10px">
      <div class="logo2" style="width:36px;height:36px;font-size:16px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(239,43,58,.6),#000);border:1px solid rgba(239,43,58,.7);clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)">🕵️</div>
      <div>
        <div style="font-weight:900;letter-spacing:.15em">GUEST MODE</div>
        <div style="font-size:10px;letter-spacing:.3em;color:#22d3ee" id="limitTxt">LOADING</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <a class="chip gd" href="/payment">💳 BUY</a>
      <a class="chip red" href="/login">🔐 SIGN IN</a>
    </div>
  </div>

  <div class="search-card" id="searchCard">
    <div class="big-ic" id="bigIc">📱</div>
    <h1 id="featName">Loading...</h1>
    <div class="hint" id="featHint"></div>
    <div class="sbox">
      <input id="ovInput" placeholder="Enter value" autocomplete="off"/>
      <button class="go" id="goBtn">SEARCH</button>
    </div>
    <div class="err" id="errText"></div>
  </div>

  <div id="resultBox"></div>
</div>

<div class="popup" id="popup">
  <div class="popup-box">
    <div class="ic">⚠</div>
    <h3>FREE LIMIT REACHED</h3>
    <p id="popupMsg">Aapka free limit khatam ho gaya. Login karein ya plan buy karein.</p>
    <div class="btns">
      <a class="btn" href="/login">🔐 SIGN IN</a>
      <a class="btn gd" href="/payment">💳 BUY PLAN</a>
    </div>
    <button class="btn red" style="width:100%;margin-top:10px" onclick="document.getElementById('popup').classList.remove('show')">✕ CLOSE</button>
  </div>
</div>

<script>
${BROADCAST_JS}
loadBroadcast();
var FEAT = null;
var FP = '';
var GUEST = null;

function escapeHTML(s){
  return String(s == null ? '' : s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;');
}
function getFP(){
  return new Promise(function(resolve){
    try{
      var d = [navigator.userAgent, navigator.language, screen.width+'x'+screen.height, screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency||0, navigator.platform||''].join('|');
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(d)).then(function(b){
        var arr = Array.from(new Uint8Array(b));
        resolve(arr.map(function(x){ return x.toString(16).padStart(2,'0'); }).join(''));
      }).catch(function(){ resolve(localFP()); });
    }catch(e){ resolve(localFP()); }
  });
}
function localFP(){ var x=localStorage.getItem('bx_fp'); if(!x){ x='fp-'+Math.random().toString(36).slice(2)+Date.now(); localStorage.setItem('bx_fp',x); } return x; }

function getParam(k){ var m = location.search.match(new RegExp('[?&]'+k+'=([^&]+)')); return m ? decodeURIComponent(m[1]) : ''; }

(async function init(){
  FP = await getFP();
  var featId = getParam('feature');
  if (!featId){ location.href = '/'; return; }

  var j1 = await fetch('/api/features').then(function(r){ return r.json(); }).catch(function(){ return {}; });
  var features = (j1 && j1.features) || [];
  FEAT = null;
  for (var i = 0; i < features.length; i++){ if (features[i].id === featId){ FEAT = features[i]; break; } }
  if (!FEAT){ alert('Feature not found'); location.href = '/'; return; }

  document.getElementById('bigIc').textContent = FEAT.emoji || '🔍';
  document.getElementById('featName').textContent = (FEAT.emoji||'') + ' ' + FEAT.name;
  document.getElementById('featHint').textContent = FEAT.hint || '';
  var inp = document.getElementById('ovInput');
  inp.placeholder = FEAT.placeholder || 'Enter value';
  if (FEAT.upper) inp.classList.add('vi');
  if (FEAT.type === 'number') inp.setAttribute('inputmode', 'numeric');

  refreshStatus();
})();

async function refreshStatus(){
  try {
    var r = await fetch('/api/guest/status?fp=' + FP);
    var j = await r.json();
    if (j.ok){
      GUEST = j;
      var rem = j.remaining || 0;
      var lim = j.limit || 0;
      document.getElementById('limitTxt').textContent = rem + '/' + lim + ' FREE LEFT · RESETS DAILY';
      if (rem <= 0){
        var pp = document.getElementById('popup');
        document.getElementById('popupMsg').textContent = j.message || 'Free limit khatam. Login karein ya plan buy karein.';
        pp.classList.add('show');
      }
    }
  } catch (e) {}
}

async function doSearch(){
  if (!FEAT) return;
  var raw = document.getElementById('ovInput').value.trim();
  var err = document.getElementById('errText');
  err.classList.remove('show');
  if (!raw){ err.textContent = 'Value daalein'; err.classList.add('show'); return; }

  if (FEAT.type === 'number'){
    raw = raw.replace(/[^0-9]/g, '');
    if (FEAT.len && raw.length !== FEAT.len){ err.textContent = 'Exactly ' + FEAT.len + ' digits chahiye'; err.classList.add('show'); return; }
  } else if (FEAT.upper){
    raw = raw.toUpperCase();
  }

  var go = document.getElementById('goBtn');
  go.disabled = true;
  document.getElementById('resultBox').innerHTML = '<div class="loading">⏳ CONNECTING TO SECURE NODES...</div>';

  try {
    var url = '/api/guest/lookup?feature=' + encodeURIComponent(FEAT.id) + '&q=' + encodeURIComponent(raw) + '&fp=' + FP;
    var r = await fetch(url);
    var data = await r.json();
    if (r.status === 429){
      // Limit reached
      var pp = document.getElementById('popup');
      document.getElementById('popupMsg').textContent = data.error || 'Free limit reached';
      pp.classList.add('show');
      document.getElementById('resultBox').innerHTML = '';
      return;
    }
    renderResult(data, raw);
    refreshStatus();
  } catch (e){
    document.getElementById('resultBox').innerHTML = '<div class="res-card" style="color:#ff6b8a">Error: ' + escapeHTML(e.message) + '</div>';
  } finally {
    go.disabled = false;
  }
}

function flatten(obj, prefix, out){
  if (obj === null || obj === undefined) return;
  if (typeof obj !== 'object'){ out.push([prefix, obj]); return; }
  if (Array.isArray(obj)){
    for (var i = 0; i < obj.length; i++) flatten(obj[i], prefix + '[' + (i+1) + ']', out);
    return;
  }
  var keys = Object.keys(obj);
  for (var k = 0; k < keys.length; k++){
    var key = keys[k], val = obj[key];
    var pk = prefix ? prefix + '.' + key : key;
    if (val !== null && typeof val === 'object') flatten(val, pk, out);
    else if (val !== undefined && val !== null && val !== '') out.push([pk, val]);
  }
}
function humanKey(k){
  return String(k).split('.').join(' · ').split('_').join(' ').split('[').join(' ').split(']').join('')
    .replace(/([A-Z])/g, ' $1').replace(/\\s+/g, ' ').replace(/\\b\\w/g, function(m){ return m.toUpperCase(); }).trim();
}

function renderResult(data, query){
  var box = document.getElementById('resultBox');
  // If response type is text/raw
  if (data && data._responseType && data.raw){
    box.innerHTML = '<div class="res-card"><div class="head"><div class="title">📄 RESULT</div>'
      + '<div class="actions">'
      + '<button class="btn sm" onclick="downloadTxt()">⬇ TXT</button>'
      + '<button class="btn sm gr" onclick="copyRaw()">📋 COPY</button>'
      + '</div></div>'
      + '<pre id="rawBox" style="white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;color:#7fefff;max-height:500px;overflow:auto;padding:10px;background:rgba(0,0,0,.5);border-radius:8px">' + escapeHTML(data.raw) + '</pre></div>';
    return;
  }
  if (data && (data.status === false || data.success === false || data.error) && !data.data && !data.result){
    box.innerHTML = '<div class="res-card" style="color:#ff6b8a">' + escapeHTML(data.error || data.message || 'No data found') + '</div>';
    return;
  }
  var rows = [];
  flatten(data, '', rows);
  if (!rows.length){ box.innerHTML = '<div class="res-card" style="color:#94a3b8">Empty response</div>'; return; }

  var h = '<div class="res-card">';
  h += '<div class="head"><div class="title">✅ ' + rows.length + ' FIELDS · TARGET: ' + escapeHTML(query) + '</div>';
  h += '<div class="actions">';
  h += '<button class="btn sm" onclick="copyRaw()">📋 COPY</button>';
  h += '<button class="btn sm" onclick="downloadTxt()">⬇ TXT</button>';
  h += '<button class="btn sm gr" onclick="downloadJSON()">⬇ JSON</button>';
  h += '<button class="btn sm gd" onclick="downloadCSV()">⬇ CSV</button>';
  h += '<button class="btn sm" onclick="window.print()">🖨 PRINT</button>';
  h += '</div></div>';
  for (var i = 0; i < rows.length; i++){
    h += '<div class="rrow"><div class="rlbl">' + escapeHTML(humanKey(rows[i][0])) + '</div><div class="rval">' + escapeHTML(String(rows[i][1])) + '</div></div>';
  }
  h += '</div>';
  box.innerHTML = h;
  window._lastData = data;
  window._lastQuery = query;
}

function getRawText(){
  var pre = document.getElementById('rawBox');
  if (pre) return pre.textContent;
  var rows = document.querySelectorAll('.rrow');
  var t = '';
  for (var i = 0; i < rows.length; i++){
    t += rows[i].querySelector('.rlbl').textContent + ': ' + rows[i].querySelector('.rval').textContent + '\\n';
  }
  return t;
}
function copyRaw(){ navigator.clipboard.writeText(getRawText()).then(function(){ alert('Copied!'); }); }
function download(filename, content, type){
  var blob = new Blob([content], { type: type || 'text/plain' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function downloadTxt(){ download('bronx-' + Date.now() + '.txt', getRawText()); }
function downloadJSON(){ download('bronx-' + Date.now() + '.json', JSON.stringify(window._lastData || {}, null, 2), 'application/json'); }
function downloadCSV(){
  var rows = document.querySelectorAll('.rrow');
  var t = 'Field,Value\\n';
  for (var i = 0; i < rows.length; i++){
    var k = rows[i].querySelector('.rlbl').textContent.replace(/"/g, '""');
    var v = rows[i].querySelector('.rval').textContent.replace(/"/g, '""');
    t += '"' + k + '","' + v + '"\\n';
  }
  download('bronx-' + Date.now() + '.csv', t, 'text/csv');
}
document.getElementById('ovInput').addEventListener('keydown', function(e){ if (e.key === 'Enter') doSearch(); });
document.getElementById('goBtn').addEventListener('click', doSearch);
</script>
</body></html>`;

/* ============================================================
   HTML · DASHBOARD (with chat + IST clock + drawer)
   ============================================================ */
const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BRONX ULTRA · Dashboard</title>
<style>
${CSS}
header{padding:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;position:relative;z-index:1}
.brand{display:flex;align-items:center;gap:10px}
.logo2{width:44px;height:44px;display:grid;place-items:center;font-size:20px;background:linear-gradient(135deg,rgba(239,43,58,.6),#000);border:1px solid rgba(239,43,58,.7);clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);box-shadow:0 0 20px rgba(239,43,58,.5)}
.brand-name{font-weight:900;letter-spacing:.15em;font-size:22px;line-height:1}
.brand-name .r{color:#ef2b3a}
.brand-sub{color:#22d3ee;letter-spacing:.4em;font-size:10px;margin-top:4px}
.hero{text-align:center;padding:16px;position:relative;z-index:1}
.title{font-family:Impact,"Arial Black",sans-serif;font-weight:900;font-size:clamp(36px,9vw,100px);line-height:1;text-shadow:0 0 40px rgba(239,43,58,.45)}
.title .red{color:#ef2b3a}
.tag{display:inline-flex;align-items:center;gap:12px;margin-top:16px;color:#22d3ee;letter-spacing:.3em;font-size:12px}
.tag .ln{height:1px;width:50px;background:#ef2b3a;box-shadow:0 0 8px #ef2b3a}
.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:24px auto 0;max-width:1200px;padding:0 16px;position:relative;z-index:1}
@media(min-width:700px){.cards{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(min-width:1024px){.cards{grid-template-columns:repeat(5,minmax(0,1fr))}}
.card{--a:#22d3ee;display:flex;flex-direction:column;align-items:center;padding:20px 12px;border-radius:14px;background:linear-gradient(180deg,rgba(0,0,0,.6),rgba(0,0,0,.85));border:1px solid color-mix(in oklab,var(--a) 55%,transparent);box-shadow:0 0 0 1px color-mix(in oklab,var(--a) 25%,transparent),0 0 30px color-mix(in oklab,var(--a) 30%,transparent);transition:.25s}
.card:hover{transform:translateY(-3px)}
.card .ic{width:68px;height:68px;border-radius:999px;display:grid;place-items:center;border:2px solid var(--a);background:color-mix(in oklab,var(--a) 12%,#000);box-shadow:0 0 25px color-mix(in oklab,var(--a) 50%,transparent);font-size:30px;color:var(--a)}
.card h3{margin-top:14px;font-size:15px;font-weight:800;text-align:center}
.card .sub{margin-top:4px;font-size:10px;letter-spacing:.2em;color:var(--a);text-align:center}
.card .btn{margin-top:16px;width:100%;padding:10px;font-size:11px}
footer{margin-top:40px;border-top:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.6);padding:20px 16px;text-align:center;font-size:11px;letter-spacing:.2em;color:#94a3b8;position:relative;z-index:1}
.overlay{position:fixed;inset:0;z-index:50;display:none;flex-direction:column;overflow-y:auto;background:linear-gradient(180deg,#05070A,#08121F 55%,#0E1B2A)}
.overlay.open{display:flex}
.ov-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.5);position:sticky;top:0;z-index:10}
.ov-body{max-width:900px;margin:0 auto;padding:32px 16px 60px;width:100%;text-align:center}
.big-ic{width:100px;height:100px;border-radius:999px;display:grid;place-items:center;margin:0 auto;font-size:44px;border:2px solid var(--a,#22d3ee);background:color-mix(in oklab,var(--a,#22d3ee) 12%,#000);box-shadow:0 0 40px var(--a,#22d3ee);color:var(--a,#22d3ee)}
.ov-body h1{margin-top:20px;font-size:clamp(22px,5vw,34px);font-weight:900;display:flex;justify-content:center;align-items:center;gap:12px}
.ov-body .hint{margin-top:6px;font-size:11px;letter-spacing:.3em;color:var(--a,#22d3ee)}
.search-box{margin-top:26px;display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--a,#22d3ee);border-radius:10px;background:rgba(0,0,0,.6);box-shadow:inset 0 0 30px color-mix(in oklab,var(--a,#22d3ee) 25%,transparent)}
.search-box input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#fff;font-size:16px}
.search-box input.vi{text-transform:uppercase}
.go{padding:10px 16px;font-size:12px;font-weight:800;letter-spacing:.2em;background:transparent;border:1px solid var(--a,#22d3ee);color:var(--a,#22d3ee);border-radius:6px;cursor:pointer;flex-shrink:0}
.go:disabled{opacity:.3;cursor:not-allowed}
.err-msg{margin-top:10px;color:#ef2b3a;font-size:12px;text-align:left}
.loading{display:flex;flex-direction:column;align-items:center;gap:10px;padding:36px 0;letter-spacing:.3em;font-size:12px}
.spin{width:32px;height:32px;border-radius:999px;border:3px solid rgba(255,255,255,.15);border-top-color:var(--a,#22d3ee);animation:sp 1s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.idle{padding:28px;text-align:center;color:rgba(255,255,255,.6);font-size:14px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(0,0,0,.4);margin-top:24px}
.res-wrap{max-width:1200px;margin:0 auto;padding:24px 16px 60px;text-align:left}
.glass{border-radius:18px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(14,27,42,.72),rgba(8,18,31,.5));box-shadow:0 30px 80px rgba(0,0,0,.55)}
.res-head{padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,.08)}
.res-title{display:flex;align-items:center;gap:12px;font-weight:800}
.res-title .mk{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,#ef2b3a,#22d3ee)}
.res-title .nm span{color:#22d3ee}
.target-chip{padding:6px 12px;border-radius:8px;background:rgba(0,229,255,.08);border:1px solid rgba(0,229,255,.45);color:#7fefff;font-family:ui-monospace,monospace;font-size:12px;font-weight:700}
.res-body{padding:8px 12px 16px}
.rrow{display:grid;grid-template-columns:200px 1fr;gap:16px;padding:12px 14px;border-radius:10px;align-items:start}
.rrow+.rrow{border-top:1px solid rgba(255,255,255,.05)}
.rlbl{font-size:11px;letter-spacing:.18em;font-weight:700;color:#22d3ee;text-transform:uppercase;padding-top:2px}
.rval{font-size:14px;color:#F8FAFC;font-weight:600;line-height:1.55;word-break:break-word}
.rval.mono{font-family:ui-monospace,monospace;color:#7fefff}
.res-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:12px 20px;border-top:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.4);font-family:ui-monospace,monospace;font-size:11px}
.res-error{padding:48px 24px;text-align:center;color:#FF2E63;font-size:15px;font-weight:600;border:1px solid rgba(255,46,99,.3);border-radius:16px;background:rgba(255,46,99,.05);margin-top:22px}
.rbtn{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;font-size:11px;font-weight:700;letter-spacing:.14em;color:#e6faff;cursor:pointer;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.14);font-family:inherit;text-decoration:none}
.rbtn:hover{border-color:rgba(0,229,255,.5)}
.rbtn.primary{background:linear-gradient(135deg,rgba(0,229,255,.22),rgba(59,130,246,.22));border-color:rgba(0,229,255,.5)}

.drawer-mask{position:fixed;inset:0;background:rgba(2,4,8,.6);backdrop-filter:blur(6px);z-index:80;display:none}
.drawer-mask.show{display:block}
.drawer{position:fixed;top:0;right:0;bottom:0;width:420px;max-width:100%;background:linear-gradient(180deg,#08121F,#05070A);border-left:1px solid rgba(34,211,238,.35);z-index:81;transform:translateX(100%);transition:transform .35s;overflow-y:auto;padding:24px}
.drawer.open{transform:translateX(0)}
.drawer h2{font-size:13px;letter-spacing:.22em;color:#22d3ee;margin-bottom:14px;font-weight:800}
.acct-row{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;gap:10px;font-size:12px}
.acct-row .lbl{color:#94a3b8;letter-spacing:.15em;font-weight:700}
.acct-row .val{color:#fff;text-align:right;word-break:break-all;max-width:60%}
.email-box{padding:14px;border-radius:12px;background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.3);display:flex;align-items:center;gap:12px;margin-bottom:14px}
.email-box .av{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#ef2b3a,#22d3ee);display:grid;place-items:center;font-weight:900;font-size:18px}
.clock-widget{padding:14px;border-radius:12px;background:linear-gradient(135deg,rgba(34,211,238,.1),rgba(168,85,247,.08));border:1px solid rgba(34,211,238,.35);text-align:center;margin-bottom:14px}
.clock-widget .time{font-size:26px;font-weight:900;color:#7fefff;font-family:ui-monospace,monospace;letter-spacing:.05em}
.clock-widget .date{font-size:11px;color:#94a3b8;letter-spacing:.2em;margin-top:4px}
.clock-widget .tz{font-size:9px;color:#eab308;letter-spacing:.2em;margin-top:2px}
.usage-item{padding:10px 12px;border-radius:8px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-top:8px}
.usage-item .cnt{color:#7fefff;font-weight:800}

/* Chat widget */
.chat-btn{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#22d3ee,#a855f7);display:grid;place-items:center;font-size:26px;cursor:pointer;z-index:90;box-shadow:0 8px 30px rgba(34,211,238,.55);border:2px solid #fff2;transition:.25s}
.chat-btn:hover{transform:scale(1.08)}
.chat-btn .badge{position:absolute;top:-4px;right:-4px;background:#ef2b3a;color:#fff;font-size:10px;font-weight:900;border-radius:999px;padding:2px 6px;border:2px solid #05070c}
.chat-panel{position:fixed;bottom:100px;right:24px;width:360px;max-width:calc(100vw - 48px);height:480px;max-height:calc(100vh - 140px);background:linear-gradient(180deg,#0E1B2A,#05070A);border:1px solid rgba(34,211,238,.5);border-radius:16px;z-index:91;display:none;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.8)}
.chat-panel.open{display:flex}
.chat-head{padding:14px 16px;background:linear-gradient(135deg,rgba(34,211,238,.15),rgba(168,85,247,.12));border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center}
.chat-head .t{font-weight:900;letter-spacing:.15em;font-size:13px;color:#22d3ee}
.chat-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.chat-msg{padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.5;max-width:80%;word-wrap:break-word}
.chat-msg.me{background:linear-gradient(135deg,#22d3ee,#3B82F6);color:#000;align-self:flex-end;border-bottom-right-radius:2px}
.chat-msg.admin{background:rgba(34,197,94,.15);color:#86efac;border:1px solid rgba(34,197,94,.4);align-self:flex-start;border-bottom-left-radius:2px}
.chat-msg .meta{font-size:9px;opacity:.7;margin-top:4px;letter-spacing:.1em}
.chat-foot{padding:10px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:8px}
.chat-foot input{flex:1;padding:10px;font-size:12px}
.chat-foot button{padding:10px 14px;font-size:11px;letter-spacing:.15em;font-weight:800;border-radius:8px;background:linear-gradient(135deg,#22d3ee,#3B82F6);color:#000;border:0;cursor:pointer;font-family:inherit}
@media(max-width:700px){.rrow{grid-template-columns:1fr;gap:4px;padding:10px 12px}}
</style></head>
<body>
<header>
  <div class="brand">
    <div class="logo2">🕵️</div>
    <div><div class="brand-name"><span class="r">BRONX</span> ULTRA</div><div class="brand-sub">@BRONX_ULTRA · v7.0</div></div>
  </div>
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <button class="chip" onclick="openDrawer()"><span class="dot green"></span><span id="userTxt">LOADING</span></button>
    <a class="chip gd" href="/payment">💳 BUY / RENEW</a>
    <button class="chip red" onclick="doLogout()">⏻ LOGOUT</button>
  </div>
</header>

<section class="hero">
  <h1 class="title"><span class="red">BRONX</span> ULTRA</h1>
  <div class="tag"><span class="ln"></span>SEARCH · ANALYZE · INVESTIGATE<span class="ln"></span></div>
</section>

<div id="accessBanner" style="max-width:1100px;margin:16px auto 0;padding:0 16px;position:relative;z-index:1"></div>

<section class="cards" id="cards"></section>
<footer>© BRONX ULTRA · @BRONX_ULTRA · v7.0</footer>

<div class="overlay" id="overlay">
  <div class="ov-head">
    <button class="chip" onclick="closeOverlay()">← BACK</button>
    <div><span style="color:#ef2b3a;font-weight:900;letter-spacing:.2em">BRONX</span> <span style="font-weight:900;letter-spacing:.2em">ULTRA</span></div>
    <span class="chip"><span class="dot" id="hintDot"></span><span id="hintText">READY</span></span>
  </div>
  <div class="ov-body" id="ovBody"></div>
</div>

<div class="drawer-mask" id="drawerMask" onclick="closeDrawer()"></div>
<div class="drawer" id="drawer">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
    <h2>👤 MY ACCOUNT</h2>
    <button class="chip red" onclick="closeDrawer()">✕</button>
  </div>
  <div id="drawerBody"></div>
</div>

<div class="chat-btn" id="chatBtn" onclick="toggleChat()">💬<span class="badge" id="chatBadge" style="display:none">0</span></div>
<div class="chat-panel" id="chatPanel">
  <div class="chat-head">
    <div class="t">💬 SUPPORT CHAT</div>
    <button class="chip red" onclick="toggleChat()">✕</button>
  </div>
  <div class="chat-body" id="chatBody"><div style="text-align:center;color:#94a3b8;font-size:12px;padding:20px">Loading...</div></div>
  <div class="chat-foot">
    <input id="chatInput" placeholder="Type message..." onkeydown="if(event.key==='Enter')sendMsg()"/>
    <button onclick="sendMsg()">SEND</button>
  </div>
</div>

<script>
${BROADCAST_JS}
loadBroadcast();
var FEATURES = [];
var ME = null;
var cur = null;
var CHAT_LAST = 0;
var CHAT_OPEN = false;

function escapeHTML(s){ return String(s == null ? '' : s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;'); }
function isURL(v){ return typeof v === 'string' && v.indexOf('http') === 0; }

function loadMe(){
  fetch('/api/me').then(function(r){
    if (!r.ok){ location.href='/login'; return null; }
    return r.json();
  }).then(function(j){
    if (!j) return;
    ME = j;
    var label = ME.name || ME.email || 'user';
    document.getElementById('userTxt').textContent = label.toUpperCase().slice(0, 22);
    renderAccessBanner();
  }).catch(function(){ location.href='/login'; });
}
function renderAccessBanner(){
  var el = document.getElementById('accessBanner');
  if (!ME) return;
  if (ME.accessActive){
    var exp = ME.expiry ? new Date(ME.expiry).toLocaleString() : 'Active';
    el.innerHTML = '<div style="padding:12px 18px;border-radius:10px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.4);color:#86efac;font-size:12px;letter-spacing:.08em;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>✅ <b>ACCESS ACTIVE</b> · ' + escapeHTML(exp) + '</span><span>Token: <span style="font-family:ui-monospace,monospace">' + escapeHTML(ME.token || '') + '</span></span></div>';
  } else {
    el.innerHTML = '<div style="padding:12px 18px;border-radius:10px;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.4);color:#fcd34d;font-size:12px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>⚠ <b>NO ACTIVE ACCESS</b></span><a href="/payment" style="color:#eab308;font-weight:800;text-decoration:underline">BUY NOW →</a></div>';
  }
}
function renderCards(){
  var h = '';
  for (var i = 0; i < FEATURES.length; i++){
    var f = FEATURES[i];
    if (f.active === false) continue;
    h += '<div class="card" style="--a:' + escapeHTML(f.color || '#22d3ee') + '" onclick="openFeature(\\'' + escapeHTML(f.id) + '\\')">';
    h += '<div class="ic">' + escapeHTML(f.emoji || '🔍') + '</div>';
    h += '<h3>' + escapeHTML(f.name) + '</h3>';
    h += '<div class="sub">' + escapeHTML(f.hint || '') + '</div>';
    h += '<button class="btn">🚀 SEARCH NOW</button>';
    h += '</div>';
  }
  var el = document.getElementById('cards');
  if (!h) el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8">No features configured</div>';
  else el.innerHTML = h;
}
function openFeature(id){
  var f = null;
  for (var i = 0; i < FEATURES.length; i++){ if (FEATURES[i].id === id){ f = FEATURES[i]; break; } }
  if (!f) return;
  if (!ME || !ME.accessActive){ location.href = '/payment?feature=' + encodeURIComponent(f.id); return; }
  cur = f;
  var body = document.getElementById('ovBody');
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('hintText').textContent = f.hint || '';
  document.getElementById('hintDot').style.background = f.color || '#22d3ee';
  body.innerHTML = '<div class="big-ic" style="--a:' + escapeHTML(f.color || '#22d3ee') + '">' + escapeHTML(f.emoji || '🔍') + '</div>'
    + '<h1>' + escapeHTML(f.emoji || '🔍') + ' ' + escapeHTML(f.name) + '</h1>'
    + '<div class="hint" style="--a:' + escapeHTML(f.color || '#22d3ee') + '">' + escapeHTML(f.hint || '') + '</div>'
    + '<div class="search-box" style="--a:' + escapeHTML(f.color || '#22d3ee') + '">'
    + '<input id="ovInput" placeholder="' + escapeHTML(f.placeholder || 'Enter value') + '" autocomplete="off"' + (f.upper ? ' class="vi"' : '') + '/>'
    + '<button class="go" id="goBtn" style="--a:' + escapeHTML(f.color || '#22d3ee') + '">SEARCH</button>'
    + '</div>'
    + '<div class="err-msg" id="errText" style="display:none"></div>'
    + '<div id="stateBox"><div class="idle">Query daalein aur SEARCH dabayein.</div></div>';
  document.getElementById('ovInput').addEventListener('keydown', function(e){ if (e.key==='Enter') runSearch(); });
  document.getElementById('goBtn').addEventListener('click', runSearch);
  setTimeout(function(){ var i = document.getElementById('ovInput'); if (i) i.focus(); }, 50);
}
function closeOverlay(){ document.getElementById('overlay').classList.remove('open'); document.body.style.overflow=''; cur=null; }

function runSearch(){
  if (!cur) return;
  var raw = document.getElementById('ovInput').value.trim();
  var err = document.getElementById('errText');
  var st = document.getElementById('stateBox');
  err.style.display = 'none';
  if (!raw){ err.textContent = 'Value daalein'; err.style.display='block'; return; }
  if (cur.type === 'number'){
    raw = raw.replace(/[^0-9]/g, '');
    if (cur.len && raw.length !== cur.len){ err.textContent = 'Exactly ' + cur.len + ' digits chahiye'; err.style.display='block'; return; }
  } else if (cur.upper){ raw = raw.toUpperCase(); }
  var goBtn = document.getElementById('goBtn'); goBtn.disabled = true;
  st.innerHTML = '<div class="loading"><div class="spin" style="--a:' + escapeHTML(cur.color||'#22d3ee') + '"></div><div>CONNECTING TO SECURE NODES...</div></div>';
  fetch('/api/lookup?feature=' + encodeURIComponent(cur.id) + '&q=' + encodeURIComponent(raw)).then(function(r){
    if (r.status === 401){ st.innerHTML='<div class="idle" style="color:#FF2E63">Session expired</div>'; setTimeout(function(){location.href='/login';},1500); return null; }
    if (r.status === 402){ location.href = '/payment?feature=' + encodeURIComponent(cur.id); return null; }
    return r.json();
  }).then(function(data){ if (data) renderResults(data, raw); })
    .catch(function(e){ st.innerHTML = '<div class="idle" style="color:#FF2E63">Error: ' + escapeHTML(e.message) + '</div>'; })
    .then(function(){ goBtn.disabled = false; });
}

function flatten(obj, prefix, out){
  if (obj === null || obj === undefined) return;
  if (typeof obj !== 'object'){ out.push([prefix, obj]); return; }
  if (Array.isArray(obj)){ for (var i=0;i<obj.length;i++) flatten(obj[i], prefix+'['+(i+1)+']', out); return; }
  var keys = Object.keys(obj);
  for (var k=0;k<keys.length;k++){
    var key=keys[k], val=obj[key];
    var pk = prefix ? prefix+'.'+key : key;
    if (val !== null && typeof val === 'object') flatten(val, pk, out);
    else if (val !== undefined && val !== null && val !== '') out.push([pk, val]);
  }
}
function humanKey(k){
  return String(k).split('.').join(' · ').split('_').join(' ').split('[').join(' ').split(']').join('')
    .replace(/([A-Z])/g, ' $1').replace(/\\s+/g, ' ').replace(/\\b\\w/g, function(m){ return m.toUpperCase(); }).trim();
}

function renderResults(data, query){
  var body = document.getElementById('ovBody');
  window._lastData = data;
  window._lastQuery = query;

  // Text/raw response type
  if (data && data._responseType && data.raw){
    body.innerHTML = '<div class="res-wrap"><div class="glass"><div class="res-head"><div class="res-title"><div class="mk">🕵️</div><div class="nm">BRONX <span>ULTRA</span></div></div><span class="target-chip">' + escapeHTML(query) + '</span><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="rbtn" onclick="copyResult()">📋 COPY</button><button class="rbtn" onclick="downloadResult(\\'txt\\')">⬇ TXT</button><button class="rbtn" onclick="downloadResult(\\'json\\')">⬇ JSON</button><button class="rbtn primary" onclick="closeOverlay()">← BACK</button></div></div><div class="res-body"><pre id="rawBox" style="white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;color:#7fefff;max-height:600px;overflow:auto;padding:14px;background:rgba(0,0,0,.5);border-radius:10px">' + escapeHTML(data.raw) + '</pre></div></div></div>';
    return;
  }

  if (data && (data.status === false || data.success === false || data.error) && !data.data && !data.result){
    var msg = data.error || data.msg || data.message || 'No data found';
    body.innerHTML = '<div class="res-wrap"><div class="glass res-error">' + escapeHTML(msg) + '</div><div style="text-align:center;margin-top:20px"><button class="rbtn primary" onclick="closeOverlay()">← BACK</button></div></div>';
    return;
  }
  var rows = [];
  flatten(data, '', rows);
  if (!rows.length){ body.innerHTML = '<div class="res-wrap"><div class="glass res-error">Empty response</div></div>'; return; }
  var html = '<div class="res-wrap"><div class="glass"><div class="res-head"><div class="res-title"><div class="mk">🕵️</div><div class="nm">BRONX <span>ULTRA</span></div></div><span class="target-chip">' + escapeHTML(query) + '</span><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="rbtn" onclick="copyResult()">📋 COPY</button><button class="rbtn" onclick="downloadResult(\\'txt\\')">⬇ TXT</button><button class="rbtn" onclick="downloadResult(\\'json\\')">⬇ JSON</button><button class="rbtn" onclick="downloadResult(\\'csv\\')">⬇ CSV</button><button class="rbtn" onclick="window.print()">🖨</button><button class="rbtn primary" onclick="closeOverlay()">← BACK</button></div></div><div class="res-body">';
  for (var i=0;i<rows.length;i++){
    var k=rows[i][0], v=rows[i][1];
    html += '<div class="rrow"><div class="rlbl">' + escapeHTML(humanKey(k)) + '</div><div class="rval mono">' + escapeHTML(String(v)) + '</div></div>';
  }
  html += '</div><div class="res-foot"><div>BRONX ULTRA · ' + rows.length + ' FIELDS · ' + new Date().toLocaleString() + '</div></div></div></div>';
  body.innerHTML = html;
}
function getResultText(){
  var pre = document.getElementById('rawBox');
  if (pre) return pre.textContent;
  var rows = document.querySelectorAll('.rrow');
  var t = '';
  for (var i=0;i<rows.length;i++){ t += rows[i].querySelector('.rlbl').textContent + ': ' + rows[i].querySelector('.rval').textContent + '\\n'; }
  return t;
}
function copyResult(){
  var t = getResultText();
  navigator.clipboard.writeText(t).then(function(){ alert('✓ Copied to clipboard'); });
}
function download(filename, content, type){
  var blob = new Blob([content], { type: type || 'text/plain' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function downloadResult(fmt){
  var now = Date.now();
  if (fmt === 'json'){
    download('bronx-' + now + '.json', JSON.stringify(window._lastData || {}, null, 2), 'application/json');
  } else if (fmt === 'csv'){
    var rows = document.querySelectorAll('.rrow');
    var t = 'Field,Value\\n';
    for (var i=0;i<rows.length;i++){
      var k = rows[i].querySelector('.rlbl').textContent.replace(/"/g, '""');
      var v = rows[i].querySelector('.rval').textContent.replace(/"/g, '""');
      t += '"' + k + '","' + v + '"\\n';
    }
    download('bronx-' + now + '.csv', t, 'text/csv');
  } else {
    download('bronx-' + now + '.txt', getResultText());
  }
}

/* DRAWER */
function openDrawer(){
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerMask').classList.add('show');
  var body = document.getElementById('drawerBody');
  body.innerHTML = '<div class="idle">Loading...</div>';
  fetch('/api/account/info').then(function(r){ return r.json(); }).then(function(j){
    if (!j.ok){ body.innerHTML = '<div class="idle">Failed</div>'; return; }
    var u = j.user || {};
    var usage = j.usage || {};
    var devList = '';
    if (u.devices && u.devices.length){
      for (var i=0; i<u.devices.length; i++){
        var d = u.devices[i];
        devList += '<div class="acct-row"><span class="lbl">' + escapeHTML(d.device || 'Device') + '</span><span class="val">' + escapeHTML((d.ip||'') + ' · ' + new Date(d.lastSeen||d.added).toLocaleDateString()) + '</span></div>';
      }
    } else devList = '<div class="acct-row"><span class="lbl">Devices</span><span class="val">—</span></div>';
    var usageHtml = '';
    var uk = Object.keys(usage);
    if (uk.length){ for (var ui=0; ui<uk.length; ui++) usageHtml += '<div class="usage-item"><span>' + escapeHTML(uk[ui]) + '</span><span class="cnt">' + usage[uk[ui]] + '</span></div>'; }
    else usageHtml = '<div class="usage-item"><span>No usage yet</span><span class="cnt">0</span></div>';

    body.innerHTML =
      '<div class="email-box"><div class="av">' + escapeHTML((u.name||u.email||'U').charAt(0).toUpperCase()) + '</div><div><div style="font-size:13px;font-weight:700;word-break:break-all">' + escapeHTML(u.email||'—') + '</div><div style="font-size:11px;color:#94a3b8;margin-top:2px">' + escapeHTML(u.name||'') + '</div></div></div>'
      + '<div class="clock-widget"><div class="time" id="istTime">--:--:--</div><div class="date" id="istDate">--</div><div class="tz">🇮🇳 INDIA STANDARD TIME (IST)</div></div>'
      + '<div class="acct-row"><span class="lbl">Status</span><span class="val">' + (u.accessActive ? '<span style="color:#86efac">✅ ACTIVE</span>' : '<span style="color:#fcd34d">⚠ NO ACCESS</span>') + '</span></div>'
      + '<div class="acct-row"><span class="lbl">Expiry</span><span class="val">' + (u.expiry ? new Date(u.expiry).toLocaleString() : '—') + '</span></div>'
      + '<div class="acct-row"><span class="lbl">Token</span><span class="val" style="font-family:ui-monospace,monospace">' + escapeHTML(u.token||'—') + '</span></div>'
      + '<div class="acct-row"><span class="lbl">Joined</span><span class="val">' + new Date(u.createdAt||Date.now()).toLocaleDateString() + '</span></div>'
      + '<h2 style="margin-top:20px">📱 DEVICES</h2>' + devList
      + '<h2 style="margin-top:20px">📊 USAGE</h2>' + usageHtml
      + '<div style="margin-top:20px;display:flex;flex-direction:column;gap:10px"><a class="btn gd" href="/payment">💳 BUY / RENEW</a><button class="btn red" onclick="doLogout()">⏻ LOGOUT</button></div>';
    startISTClock();
  }).catch(function(e){ body.innerHTML = '<div class="idle">Error: ' + escapeHTML(e.message) + '</div>'; });
}
function closeDrawer(){ document.getElementById('drawer').classList.remove('open'); document.getElementById('drawerMask').classList.remove('show'); if (window._clockIv) clearInterval(window._clockIv); }

function startISTClock(){
  if (window._clockIv) clearInterval(window._clockIv);
  var tick = function(){
    var el1 = document.getElementById('istTime'); var el2 = document.getElementById('istDate');
    if (!el1 || !el2) return;
    var now = new Date();
    // Force IST (UTC + 5:30)
    var istOffset = 5 * 60 + 30;
    var utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    var ist = new Date(utc + (istOffset * 60000));
    var hh = String(ist.getHours()).padStart(2,'0');
    var mm = String(ist.getMinutes()).padStart(2,'0');
    var ss = String(ist.getSeconds()).padStart(2,'0');
    el1.textContent = hh + ':' + mm + ':' + ss;
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    el2.textContent = days[ist.getDay()] + ', ' + String(ist.getDate()).padStart(2,'0') + ' ' + months[ist.getMonth()] + ' ' + ist.getFullYear();
  };
  tick();
  window._clockIv = setInterval(tick, 1000);
}
function doLogout(){ fetch('/api/logout', { method:'POST' }).then(function(){ location.href='/login'; }).catch(function(){ location.href='/login'; }); }

/* CHAT */
function toggleChat(){
  var p = document.getElementById('chatPanel');
  p.classList.toggle('open');
  CHAT_OPEN = p.classList.contains('open');
  if (CHAT_OPEN){ loadChat(); document.getElementById('chatBadge').style.display='none'; }
}
function loadChat(){
  fetch('/api/chat/messages').then(function(r){ return r.json(); }).then(function(j){
    if (!j.ok) return;
    var body = document.getElementById('chatBody');
    var msgs = j.messages || [];
    if (!msgs.length){ body.innerHTML = '<div style="text-align:center;color:#94a3b8;font-size:12px;padding:20px">Koi message nahi. Admin se baat karein 👋</div>'; return; }
    var h = '';
    for (var i=0; i<msgs.length; i++){
      var m = msgs[i];
      var cls = m.from === 'admin' ? 'admin' : 'me';
      h += '<div class="chat-msg ' + cls + '">' + escapeHTML(m.text) + '<div class="meta">' + new Date(m.ts).toLocaleTimeString() + '</div></div>';
    }
    body.innerHTML = h;
    body.scrollTop = body.scrollHeight;
    if (j.messages.length) CHAT_LAST = j.messages[j.messages.length-1].ts;
  }).catch(function(){});
}
function sendMsg(){
  var inp = document.getElementById('chatInput');
  var t = inp.value.trim();
  if (!t) return;
  inp.value = '';
  fetch('/api/chat/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: t }) })
    .then(function(r){ return r.json(); }).then(function(){ loadChat(); });
}
setInterval(function(){
  if (!ME) return;
  fetch('/api/chat/count').then(function(r){ return r.json(); }).then(function(j){
    if (j.ok && j.unread > 0 && !CHAT_OPEN){
      var b = document.getElementById('chatBadge');
      b.textContent = j.unread; b.style.display = 'block';
    }
  }).catch(function(){});
}, 12000);

fetch('/api/features').then(function(r){ return r.json(); }).then(function(j){
  FEATURES = (j && j.features) || [];
  renderCards();
}).catch(function(){ FEATURES = []; renderCards(); });
loadMe();
</script>
</body></html>`;

/* ============================================================
   PAYMENT HTML (with email auto-fill from logged-in session)
   ============================================================ */
const PAYMENT_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BRONX ULTRA · Payment</title>
<style>
${CSS}
header{padding:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;position:relative;z-index:1}
.brand{display:flex;align-items:center;gap:10px}
.logo2{width:44px;height:44px;display:grid;place-items:center;font-size:20px;background:linear-gradient(135deg,rgba(234,179,8,.6),#000);border:1px solid rgba(234,179,8,.8);clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);box-shadow:0 0 20px rgba(234,179,8,.5)}
.brand-name{font-weight:900;letter-spacing:.15em;font-size:22px;line-height:1}
.brand-name .r{color:#ef2b3a}
.brand-sub{color:#eab308;letter-spacing:.4em;font-size:10px;margin-top:4px}
.hero{text-align:center;padding:20px 16px;position:relative;z-index:1}
.hero h1{font-size:clamp(28px,6vw,44px);font-weight:900;letter-spacing:.05em}
.hero h1 span{color:#eab308}
.hero p{margin-top:8px;color:#94a3b8;font-size:12px;letter-spacing:.15em}
.container{max-width:1100px;margin:0 auto;padding:0 16px;position:relative;z-index:1}
.plans{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:20px}
@media(min-width:640px){.plans{grid-template-columns:repeat(3,minmax(0,1fr))}}
.plan{padding:20px 16px;border-radius:14px;background:linear-gradient(180deg,rgba(0,0,0,.6),rgba(0,0,0,.85));border:1px solid rgba(234,179,8,.35);text-align:center;transition:.25s;cursor:pointer;position:relative}
.plan:hover{transform:translateY(-3px);border-color:rgba(234,179,8,.7)}
.plan.popular{border-color:rgba(239,43,58,.7)}
.plan.popular::after{content:"❤️ POPULAR";position:absolute;top:-10px;right:10px;padding:4px 10px;font-size:9px;letter-spacing:.15em;font-weight:800;background:#ef2b3a;color:#fff;border-radius:6px}
.plan .days{font-size:11px;letter-spacing:.3em;color:#eab308;font-weight:800}
.plan .price{margin-top:12px;font-size:28px;font-weight:900;color:#fff;font-family:Impact,sans-serif}
.plan .tag{margin-top:6px;font-size:10px;color:#94a3b8}
.plan .buy{margin-top:14px;width:100%;padding:10px;font-size:11px}
.section{max-width:700px;margin:30px auto 0;padding:24px;border-radius:16px;background:linear-gradient(180deg,rgba(14,27,42,.72),rgba(8,18,31,.5));border:1px solid rgba(34,211,238,.35);position:relative;z-index:1}
.section h2{font-size:13px;letter-spacing:.22em;color:#22d3ee;font-weight:800;margin-bottom:14px}
.upi-row{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:10px;background:rgba(0,0,0,.5);border:1px solid rgba(34,211,238,.35);margin-bottom:10px}
.upi-row .lbl{font-size:10px;letter-spacing:.22em;color:#94a3b8;font-weight:700}
.upi-row .val{font-family:ui-monospace,monospace;font-size:14px;color:#7fefff;font-weight:700;word-break:break-all;flex:1}
.copy{padding:6px 10px;font-size:10px;letter-spacing:.15em;font-weight:700;border-radius:6px;background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.5);color:#7fefff;cursor:pointer;font-family:inherit}
.qr{display:block;margin:16px auto;max-width:220px;width:100%;border-radius:12px;border:1px solid rgba(34,211,238,.4)}
.apps{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-top:8px}
.app{padding:10px;text-align:center;font-size:11px;font-weight:700;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.12);color:#e6faff;text-decoration:none}
.app:hover{background:rgba(34,211,238,.1)}
.selected{margin-top:14px;padding:12px;border-radius:10px;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.4);font-size:12px;color:#fcd34d;text-align:center;font-weight:700}
.msg{padding:10px;border-radius:8px;font-size:12px;margin-top:12px;display:none}
.msg.ok{display:block;color:#86efac;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.35)}
.msg.err{display:block;color:#ffb0c4;background:rgba(255,46,99,.08);border:1px solid rgba(255,46,99,.35)}
.success{margin-top:22px;padding:20px;border-radius:12px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.4);text-align:center;display:none}
.success.show{display:block}
.success .token{margin-top:14px;padding:14px;border-radius:10px;background:rgba(0,0,0,.6);border:1px dashed rgba(34,211,238,.6);font-family:ui-monospace,monospace;font-size:16px;font-weight:800;color:#7fefff;word-break:break-all}
.warn{margin-top:12px;padding:10px;border-radius:8px;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.4);color:#fcd34d;font-size:12px;text-align:left;line-height:1.5}
footer{margin-top:40px;border-top:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.6);padding:20px 16px;text-align:center;font-size:11px;color:#94a3b8;position:relative;z-index:1}
</style></head>
<body>
<header>
  <div class="brand">
    <div class="logo2">💳</div>
    <div><div class="brand-name"><span class="r">BRONX</span> ULTRA</div><div class="brand-sub">PAYMENT</div></div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <a class="chip" href="/">🏠 HOME</a>
    <a class="chip red" href="/login">🔐 SIGN IN</a>
  </div>
</header>
<section class="hero">
  <h1><span>PREMIUM</span> ACCESS</h1>
  <p>Instant OSINT access · Unlimited searches · 24/7 support</p>
</section>
<div class="container">
  <div class="plans" id="plans"></div>
  <div class="section">
    <h2>💳 STEP 1 · PAY VIA UPI</h2>
    <div class="upi-row"><div style="flex:1"><div class="lbl">UPI ID</div><div class="val" id="upiVal">${esc(CFG.UPI_ID)}</div></div><button class="copy" onclick="copyUPI()">COPY</button></div>
    <div class="selected" id="selectedPlan">👉 Upar se plan select karein</div>
    <img class="qr" src="${esc(CFG.QR_IMG)}" alt="QR" onerror="this.style.display='none'"/>
    <div class="apps">
      <a class="app" id="payAny" href="#">Any UPI</a>
      <a class="app" id="payGpay" href="#">GPay</a>
      <a class="app" id="payPhonepe" href="#">PhonePe</a>
      <a class="app" id="payPaytm" href="#">Paytm</a>
      <a class="app" id="payBhim" href="#">BHIM</a>
    </div>
  </div>
  <div class="section">
    <h2>✅ STEP 2 · SUBMIT PROOF</h2>
    <label>UTR / TRANSACTION ID *</label>
    <input id="utr" placeholder="Enter UTR / Txn ID" autocomplete="off"/>
    <label>YOUR GMAIL (@gmail.com) <span id="lockTag" style="color:#22c55e;display:none">🔒 LOCKED</span></label>
    <input id="email" type="email" placeholder="Sign in to auto-fill" autocomplete="email"/>
    <label>TELEGRAM USERNAME / CHAT ID *</label>
    <input id="tg" placeholder="@username or numeric chat id" autocomplete="off"/>
    <button class="btn gr" style="width:100%;margin-top:16px;padding:14px" onclick="submitPayment()">🚀 SUBMIT &amp; GET TOKEN</button>
    <div class="msg" id="pMsg"></div>
    <div class="success" id="success">
      <div style="font-size:44px">🎉</div>
      <h3 style="margin-top:10px;font-size:18px;font-weight:900;color:#86efac">TOKEN GENERATED</h3>
      <div class="token" id="tokBox">—</div>
      <div class="warn">⏳ <b>Please wait — Admin Approval Pending</b><br/>Approve hone ke baad aap login karke saare features use kar payenge.</div>
      <a class="btn" href="/" style="margin-top:16px;width:100%">🏠 GO TO DASHBOARD</a>
    </div>
  </div>
</div>
<footer>© BRONX ULTRA · @BRONX_ULTRA · v7.0</footer>
<script>
${BROADCAST_JS}
loadBroadcast();
var PLANS = [];
var UPI = ${JSON.stringify(CFG.UPI_ID)};
var UPI_NAME = ${JSON.stringify(CFG.UPI_NAME)};
var selected = null;
var LOCKED_EMAIL = '';

function escapeHTML(s){ return String(s == null ? '' : s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;'); }

// Try auto-fill email from session
fetch('/api/me').then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
  if (j && j.ok && j.email && j.email !== 'admin'){
    LOCKED_EMAIL = j.email;
    var inp = document.getElementById('email');
    inp.value = j.email;
    inp.disabled = true;
    inp.readOnly = true;
    document.getElementById('lockTag').style.display = 'inline';
  }
}).catch(function(){});

fetch('/api/plans').then(function(r){ return r.json(); }).then(function(j){
  PLANS = (j && j.plans) || []; render();
}).catch(function(){ PLANS = []; render(); });

function render(){
  var h = '';
  for (var i = 0; i < PLANS.length; i++){
    var p = PLANS[i];
    h += '<div class="plan ' + (p.popular ? 'popular' : '') + '" onclick="selectPlan(\\'' + escapeHTML(p.id) + '\\')">';
    h += '<div class="days">' + escapeHTML(p.label) + '</div>';
    h += '<div class="price">₹' + p.price + '</div>';
    h += '<div class="tag">' + escapeHTML(p.tag || '') + '</div>';
    h += '<button class="btn gd buy">SELECT</button></div>';
  }
  document.getElementById('plans').innerHTML = h;
}
function selectPlan(id){
  for (var i=0; i<PLANS.length; i++){ if (PLANS[i].id === id){ selected = PLANS[i]; break; } }
  if (!selected) return;
  document.getElementById('selectedPlan').innerHTML = '✅ Selected: <b>' + escapeHTML(selected.label) + '</b> · ₹' + selected.price;
  var amt = selected.price;
  var upi = encodeURIComponent(UPI), nm = encodeURIComponent(UPI_NAME);
  var tn = encodeURIComponent('Bronx Ultra ' + selected.label);
  document.getElementById('payAny').href     = 'upi://pay?pa=' + upi + '&pn=' + nm + '&am=' + amt + '&cu=INR&tn=' + tn;
  document.getElementById('payGpay').href    = 'tez://upi/pay?pa=' + upi + '&pn=' + nm + '&am=' + amt + '&cu=INR&tn=' + tn;
  document.getElementById('payPhonepe').href = 'phonepe://pay?pa=' + upi + '&pn=' + nm + '&am=' + amt + '&cu=INR&tn=' + tn;
  document.getElementById('payPaytm').href   = 'paytmmp://pay?pa=' + upi + '&pn=' + nm + '&am=' + amt + '&cu=INR&tn=' + tn;
  document.getElementById('payBhim').href    = 'upi://pay?pa=' + upi + '&pn=' + nm + '&am=' + amt + '&cu=INR&tn=' + tn;
}
function copyUPI(){ navigator.clipboard.writeText(UPI).then(function(){ var el=document.getElementById('upiVal'); var o=el.textContent; el.textContent='✓ Copied!'; setTimeout(function(){ el.textContent=o; }, 1200); }); }
function msg(id, text, type){ var el=document.getElementById(id); el.textContent=text; el.className='msg '+(type||'ok'); setTimeout(function(){ el.className='msg'; }, 4000); }
function getFP(){
  return new Promise(function(resolve){
    try{
      var d = [navigator.userAgent, navigator.language, screen.width+'x'+screen.height, screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency||0, navigator.platform||''].join('|');
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(d)).then(function(b){
        var arr = Array.from(new Uint8Array(b));
        resolve(arr.map(function(x){ return x.toString(16).padStart(2,'0'); }).join(''));
      }).catch(function(){ resolve(localFP()); });
    }catch(e){ resolve(localFP()); }
  });
}
function localFP(){ var x = localStorage.getItem('bx_fp'); if (!x){ x = 'fp-'+Math.random().toString(36).slice(2)+Date.now(); localStorage.setItem('bx_fp', x); } return x; }
function submitPayment(){
  var utr = document.getElementById('utr').value.trim();
  var tg = document.getElementById('tg').value.trim();
  var email = document.getElementById('email').value.trim().toLowerCase();
  if (!selected){ msg('pMsg', '❌ Plan select karein', 'err'); return; }
  if (!utr || utr.length < 6){ msg('pMsg', '❌ UTR valid daalein', 'err'); return; }
  if (!email){ msg('pMsg', '❌ Gmail required', 'err'); return; }
  var re = /^[a-z0-9._%+-]+@gmail\\.com$/;
  if (!re.test(email)){ msg('pMsg', '❌ Sirf @gmail.com allowed', 'err'); return; }
  if (!tg){ msg('pMsg', '❌ Telegram required', 'err'); return; }
  getFP().then(function(fp){
    return fetch('/api/payment/submit', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ planId: selected.id, utr: utr, tg: tg, email: email, fp: fp, ua: navigator.userAgent, device: navigator.platform || 'unknown' }) });
  }).then(function(r){ return r.json(); }).then(function(j){
    if (j.ok){
      document.getElementById('tokBox').textContent = j.token;
      document.getElementById('success').classList.add('show');
      document.getElementById('success').scrollIntoView({ behavior: 'smooth' });
    } else msg('pMsg', '❌ ' + (j.error || 'failed'), 'err');
  }).catch(function(e){ msg('pMsg', '❌ ' + e.message, 'err'); });
}
</script>
</body></html>`;

/* ============================================================
   ADMIN LOGIN
   ============================================================ */
const ADMIN_LOGIN = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BRONX · Admin</title><style>${CSS}</style></head>
<body>
<div class="center"><div class="box" style="border-color:rgba(34,211,238,.5)">
  <div class="logo" style="background:linear-gradient(135deg,rgba(34,211,238,.7),#000);border-color:rgba(34,211,238,.9)">⚙</div>
  <h1><span style="color:#22d3ee">BRONX</span> ADMIN</h1>
  <div class="sub" style="color:#a855f7">@BRONX_ULTRA · v7.0</div>
  <label>USERNAME</label><input id="u"/>
  <label>PASSWORD</label><input id="p" type="password"/>
  <button class="btn" style="width:100%;margin-top:14px" onclick="doLogin()">LOGIN</button>
  <div class="err" id="err"></div>
</div></div>
<script>
function doLogin(){
  var u = document.getElementById('u').value.trim(), p = document.getElementById('p').value;
  var e = document.getElementById('err'); e.classList.remove('show');
  if (!u || !p){ e.textContent = 'Missing credentials'; e.classList.add('show'); return; }
  fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ u:u, p:p }) })
    .then(function(r){ return r.json(); }).then(function(j){
      if (j.ok){ location.href='/admin'; return; }
      e.textContent = j.error || 'Login failed'; e.classList.add('show');
    }).catch(function(ex){ e.textContent = ex.message; e.classList.add('show'); });
}
document.addEventListener('keydown', function(e){ if (e.key==='Enter') doLogin(); });
</script>
</body></html>`;

/* ============================================================
   ADMIN PANEL
   ============================================================ */
const ADMIN_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BRONX · Admin</title>
<style>
${CSS}
.wrap{position:relative;z-index:1;max-width:1500px;margin:0 auto;padding:16px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 18px;background:rgba(0,0,0,.5);border:1px solid rgba(34,211,238,.35);border-radius:14px;margin-bottom:16px}
.brand{display:flex;align-items:center;gap:10px}
.logo2{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,rgba(34,211,238,.6),#000);border:1px solid rgba(34,211,238,.8);font-size:20px}
h1{font-size:20px;letter-spacing:.15em;font-weight:900} h1 span{color:#22d3ee}
.sub2{font-size:10px;letter-spacing:.35em;color:#a855f7;margin-top:2px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px}
.stat{padding:14px;background:linear-gradient(180deg,rgba(14,27,42,.72),rgba(8,18,31,.5));border:1px solid rgba(34,211,238,.25);border-radius:12px}
.stat .lbl{font-size:9px;letter-spacing:.22em;color:#94a3b8;font-weight:700}
.stat .val{font-size:20px;font-weight:900;margin-top:4px;color:#22d3ee}
.tabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.tab{padding:10px 14px;font-size:11px;letter-spacing:.18em;font-weight:800;border-radius:8px;cursor:pointer;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1);color:#94a3b8;font-family:inherit}
.tab.on{background:rgba(34,211,238,.12);border-color:#22d3ee;color:#22d3ee}
.card{padding:20px;background:linear-gradient(180deg,rgba(14,27,42,.72),rgba(8,18,31,.5));border:1px solid rgba(255,255,255,.08);border-radius:16px;margin-bottom:16px}
.card h2{font-size:13px;letter-spacing:.2em;font-weight:800;color:#22d3ee;margin-bottom:14px}
.grid2{display:grid;grid-template-columns:1fr;gap:16px} @media(min-width:900px){.grid2{grid-template-columns:1fr 1fr}}
.utable{width:100%;border-collapse:collapse;font-size:12px}
.utable th,.utable td{padding:10px 8px;text-align:left;border-bottom:1px solid rgba(255,255,255,.06);vertical-align:top}
.utable th{font-size:10px;letter-spacing:.2em;color:#22d3ee;font-weight:800;text-transform:uppercase}
.pill{display:inline-block;padding:3px 8px;border-radius:999px;font-size:10px;letter-spacing:.1em;font-weight:700;text-transform:uppercase}
.pill.on{background:rgba(34,197,94,.12);color:#86efac;border:1px solid rgba(34,197,94,.5)}
.pill.off{background:rgba(255,46,99,.1);color:#ffb0c4;border:1px solid rgba(255,46,99,.5)}
.pill.exp{background:rgba(234,179,8,.1);color:#fcd34d;border:1px solid rgba(234,179,8,.5)}
.pill.pend{background:rgba(34,211,238,.1);color:#7fefff;border:1px solid rgba(34,211,238,.5)}
.tblwrap{overflow-x:auto}
.act{padding:5px 9px;font-size:10px;letter-spacing:.14em;font-weight:700;border-radius:6px;cursor:pointer;margin-right:4px;margin-top:2px;background:transparent;border:1px solid rgba(255,255,255,.2);color:#fff;font-family:inherit}
.act.red{color:#ffb0c4;border-color:rgba(255,46,99,.5)}
.act.gr{color:#86efac;border-color:rgba(34,197,94,.5)}
.act.gd{color:#fcd34d;border-color:rgba(234,179,8,.5)}
.mono{font-family:ui-monospace,monospace;font-size:11px;color:#7fefff}
.empty{text-align:center;padding:30px;color:#94a3b8;font-size:12px}
.feat-card{padding:14px;border-radius:12px;background:rgba(0,0,0,.35);border:1px solid rgba(34,211,238,.25);margin-bottom:12px}
.feat-card .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:8px}
.feat-card label{margin-top:4px;font-size:9px}
.feat-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px}
.plan-row{display:grid;grid-template-columns:1fr 70px 80px 1fr auto auto;gap:8px;align-items:center;padding:10px;border-bottom:1px solid rgba(255,255,255,.06);font-size:12px}
@media(max-width:900px){.plan-row{grid-template-columns:1fr;gap:6px}}

.chatmsg{padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.5;max-width:85%;word-wrap:break-word;margin-bottom:8px}
.chatmsg.user{background:linear-gradient(135deg,#22d3ee,#3B82F6);color:#000;align-self:flex-end;margin-left:auto;border-bottom-right-radius:2px}
.chatmsg.admin{background:rgba(34,197,94,.15);color:#86efac;border:1px solid rgba(34,197,94,.4);border-bottom-left-radius:2px}
.chat-conv{padding:14px;border-radius:12px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);margin-bottom:10px;cursor:pointer;transition:.2s}
.chat-conv:hover{background:rgba(34,211,238,.05);border-color:rgba(34,211,238,.4)}
.chat-conv.active{background:rgba(34,211,238,.1);border-color:rgba(34,211,238,.6)}
.chat-window{height:420px;overflow-y:auto;padding:14px;background:rgba(0,0,0,.4);border-radius:12px;border:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column}
</style></head>
<body>
<div class="wrap">
  <header>
    <div class="brand"><div class="logo2">⚙</div>
      <div><h1><span>BRONX</span> ADMIN</h1><div class="sub2">@BRONX_ULTRA · v7.0</div></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <span class="chip" id="kvChip">KV: --</span>
      <a class="chip" href="/" target="_blank">🌐 APP</a>
      <button class="chip red" onclick="logout()">⏻ LOGOUT</button>
    </div>
  </header>

  <div class="stats">
    <div class="stat"><div class="lbl">USERS</div><div class="val" id="stUsers">0</div></div>
    <div class="stat"><div class="lbl">PENDING</div><div class="val" id="stPend" style="color:#eab308">0</div></div>
    <div class="stat"><div class="lbl">TOKENS</div><div class="val" id="stTokens" style="color:#22c55e">0</div></div>
    <div class="stat"><div class="lbl">FEATURES</div><div class="val" id="stFeat" style="color:#a855f7">0</div></div>
    <div class="stat"><div class="lbl">CHAT</div><div class="val" id="stChat" style="color:#ec4899">0</div></div>
    <div class="stat"><div class="lbl">STORAGE</div><div class="val" id="stStore" style="font-size:11px;color:#a855f7">--</div></div>
  </div>

  <div class="tabs">
    <button class="tab on" data-tab="pay" onclick="showTab('pay')">💳 PAYMENTS</button>
    <button class="tab" data-tab="tokens" onclick="showTab('tokens')">🎫 TOKENS</button>
    <button class="tab" data-tab="users" onclick="showTab('users')">👥 USERS</button>
    <button class="tab" data-tab="features" onclick="showTab('features')">⚙ FEATURES</button>
    <button class="tab" data-tab="plans" onclick="showTab('plans')">💰 PLANS</button>
    <button class="tab" data-tab="chat" onclick="showTab('chat')">💬 SUPPORT CHAT</button>
    <button class="tab" data-tab="analytics" onclick="showTab('analytics')">📊 ANALYTICS</button>
    <button class="tab" data-tab="settings" onclick="showTab('settings')">⚙ SETTINGS</button>
    <button class="tab" data-tab="data" onclick="showTab('data')">📦 EXPORT/IMPORT</button>
  </div>

  <div id="panePay">
    <div class="card"><h2>💳 PENDING</h2><div id="payList"><div class="empty">Loading...</div></div></div>
    <div class="card"><h2>✅ PROCESSED</h2><div id="payHist"><div class="empty">Loading...</div></div></div>
  </div>

  <div id="paneTokens" style="display:none"><div class="card"><h2>🎫 TOKENS</h2>
    <div class="tblwrap"><table class="utable"><thead><tr><th>TOKEN</th><th>EMAIL</th><th>PLAN</th><th>EXPIRY</th><th>STATUS</th><th>USES</th><th>ACTIONS</th></tr></thead><tbody id="tokBody"><tr><td colspan="7" class="empty">Loading...</td></tr></tbody></table></div>
  </div></div>

  <div id="paneUsers" style="display:none"><div class="card"><h2>👥 USERS</h2>
    <div class="tblwrap"><table class="utable"><thead><tr><th>EMAIL</th><th>NAME</th><th>STATUS</th><th>TOKEN</th><th>EXPIRY</th><th>DEVICES</th><th>ACTIONS</th></tr></thead><tbody id="uBody"><tr><td colspan="7" class="empty">Loading...</td></tr></tbody></table></div>
  </div></div>

  <div id="paneFeatures" style="display:none"><div class="card">
    <h2>⚙ CUSTOM API FEATURES</h2>
    <div class="info" style="margin-bottom:12px">
      <b>BRONX mode:</b> Endpoint + Param → <code>/api/key-bronx/number</code> + <code>num</code><br/>
      <b>CUSTOM mode:</b> Full URL with <code>{q}</code> placeholder → <code>https://api.site.com/num?key=abc&num={q}</code>
    </div>
    <div id="featList"></div>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
      <button class="btn gr" onclick="addFeature()">+ ADD</button>
      <button class="btn" onclick="saveFeatures()">💾 SAVE</button>
      <button class="btn red" onclick="resetFeatures()">🔄 RESET</button>
    </div>
    <div class="msg" id="featMsg" style="display:none"></div>
  </div></div>

  <div id="panePlans" style="display:none"><div class="card">
    <h2>💰 PLANS</h2>
    <div id="planList"></div>
    <button class="btn gr" style="margin-top:14px" onclick="addPlan()">+ ADD</button>
    <button class="btn" style="margin-top:14px" onclick="savePlans()">💾 SAVE</button>
    <div class="msg" id="planMsg" style="display:none"></div>
  </div></div>

  <div id="paneChat" style="display:none">
    <div class="card">
      <h2>💬 SUPPORT CHAT</h2>
      <div class="grid2">
        <div>
          <div id="chatConvs"><div class="empty">Loading...</div></div>
        </div>
        <div>
          <div id="chatActive" style="display:none">
            <div style="padding:10px;font-weight:800;color:#22d3ee" id="chatActiveName">—</div>
            <div class="chat-window" id="chatWindow"></div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <input id="adminChatInput" placeholder="Reply..." onkeydown="if(event.key==='Enter')adminSend()"/>
              <button class="btn gr" onclick="adminSend()">SEND</button>
            </div>
          </div>
          <div id="chatNoSel" class="empty">Select a conversation</div>
        </div>
      </div>
    </div>
  </div>

  <div id="paneAnalytics" style="display:none">
    <div class="card"><h2>📊 FEATURE USAGE ANALYTICS</h2>
      <div id="analyticsBody"><div class="empty">Loading...</div></div>
    </div>
  </div>

  <div id="paneSettings" style="display:none">
    <div class="grid2">
      <div class="card">
        <h2>🎁 GUEST MODE</h2>
        <label>ENABLE GUEST MODE</label>
        <select id="gEnabled"><option value="yes">Yes</option><option value="no">No</option></select>
        <label>DAILY GUEST LIMIT</label>
        <input id="gLimit" type="number" value="5"/>
        <button class="btn gr" style="margin-top:14px" onclick="saveSettings()">SAVE</button>
        <div class="msg" id="setMsg" style="display:none"></div>
      </div>
      <div class="card">
        <h2>🔐 CHANGE ADMIN PASSWORD</h2>
        <label>NEW PASSWORD</label><input id="apP" type="password"/>
        <button class="btn" style="margin-top:14px" onclick="changeAdminPass()">UPDATE</button>
        <div class="msg" id="apMsg" style="display:none"></div>
      </div>
    </div>
    <div class="card">
      <h2>📢 BROADCAST MESSAGE</h2>
      <label>MESSAGE (blank = off)</label><textarea id="bcMsg" rows="3"></textarea>
      <button class="btn gr" style="margin-top:14px" onclick="saveBroadcast()">📤 BROADCAST</button>
      <button class="btn red" style="margin-top:14px" onclick="clearBroadcast()">🗑 CLEAR</button>
      <div class="msg" id="bcStat" style="display:none"></div>
    </div>
    <div class="card">
      <h2>⚠ DANGER ZONE</h2>
      <button class="btn red" onclick="killAllSessions()">KILL ALL SESSIONS</button>
    </div>
  </div>

  <div id="paneData" style="display:none">
    <div class="grid2">
      <div class="card"><h2>📤 EXPORT</h2>
        <button class="btn gr" style="width:100%" onclick="exportData()">⬇ FULL BACKUP (JSON)</button>
        <button class="btn" style="width:100%;margin-top:10px" onclick="exportConfigOnly()">⬇ CONFIG ONLY</button>
      </div>
      <div class="card"><h2>📥 IMPORT</h2>
        <input type="file" id="importFile" accept=".json"/>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button class="btn gr" onclick="importData('merge')">📥 MERGE</button>
          <button class="btn red" onclick="importData('replace')">⚠ REPLACE</button>
        </div>
        <div class="msg" id="impMsg" style="display:none"></div>
      </div>
    </div>
  </div>
</div>

<script>
function escapeHTML(s){ return String(s == null ? '' : s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;'); }
function money(n){ return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(t){ if (!t) return '—'; try { return new Date(t).toLocaleString(); } catch(e){ return t; } }
function uid(){ return 'feat_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); }

var FEATURES = [], PLANS = [], USERS = [], TOKENS = [], CHAT_ACTIVE = null, CHAT_CONVS = [];

function showTab(t){
  var names = ['pay','tokens','users','features','plans','chat','analytics','settings','data'];
  for (var i=0;i<names.length;i++){
    var x = names[i];
    var p = document.getElementById('pane' + x.charAt(0).toUpperCase() + x.slice(1));
    if (p) p.style.display = (x === t) ? 'block' : 'none';
  }
  var tabs = document.querySelectorAll('.tab');
  for (var j=0;j<tabs.length;j++) tabs[j].classList.toggle('on', tabs[j].dataset.tab === t);
  if (t === 'features') loadFeatures();
  if (t === 'plans') loadPlans();
  if (t === 'tokens') loadTokens();
  if (t === 'chat') loadChatConvs();
  if (t === 'analytics') loadAnalytics();
  if (t === 'settings') loadSettings();
}

function loadStats(){
  fetch('/api/admin/stats').then(function(r){ return r.json(); }).then(function(j){
    if (!j.ok) return;
    document.getElementById('stUsers').textContent = j.users;
    document.getElementById('stPend').textContent = j.pending || 0;
    document.getElementById('stTokens').textContent = j.activeTokens || 0;
    document.getElementById('stFeat').textContent = j.features || 0;
    document.getElementById('stChat').textContent = j.chatConvs || 0;
    document.getElementById('stStore').textContent = j.hasKV ? 'REDIS' : 'MEMORY';
    document.getElementById('kvChip').textContent = 'KV: ' + (j.hasKV ? 'ACTIVE' : 'NONE');
    document.getElementById('kvChip').style.color = j.hasKV ? '#22c55e' : '#ef2b3a';
  });
}

/* PAYMENTS */
function loadPayments(){
  fetch('/api/admin/payments').then(function(r){ return r.json(); }).then(function(j){
    if (!j.ok) return;
    var el = document.getElementById('payList');
    var list = j.pending || [];
    if (!list.length){ el.innerHTML = '<div class="empty">🎉 No pending</div>'; }
    else {
      var h = '';
      for (var i=0;i<list.length;i++){
        var p = list[i];
        h += '<div style="padding:14px;border-radius:12px;background:rgba(234,179,8,.05);border:1px solid rgba(234,179,8,.35);margin-bottom:10px">'
          + '<div style="display:flex;justify-content:space-between"><b>' + escapeHTML(p.planLabel) + ' · ' + money(p.price) + '</b><span class="pill pend">PENDING</span></div>'
          + '<div class="mono" style="margin-top:6px">UTR: ' + escapeHTML(p.utr) + '</div>'
          + '<div class="mono">TOKEN: ' + escapeHTML(p.token) + '</div>'
          + '<div style="font-size:11px;color:#94a3b8;margin-top:6px">📧 ' + escapeHTML(p.email) + ' · 👤 ' + escapeHTML(p.tg) + ' · 📱 ' + escapeHTML(p.device) + ' · 🌐 ' + escapeHTML(p.ip) + '</div>'
          + '<div style="margin-top:10px"><button class="act gr" onclick="approvePay(\\'' + escapeHTML(p.orderId) + '\\')">✅ APPROVE</button>'
          + '<button class="act red" onclick="rejectPay(\\'' + escapeHTML(p.orderId) + '\\')">❌ REJECT</button></div>'
          + '</div>';
      }
      el.innerHTML = h;
    }
    var h2 = '', ph = j.processed || [];
    if (!ph.length){ document.getElementById('payHist').innerHTML = '<div class="empty">No history</div>'; }
    else {
      for (var k=0;k<ph.length;k++){
        var q = ph[k];
        var pill = q.status === 'approved' ? '<span class="pill on">APPROVED</span>' : '<span class="pill off">REJECTED</span>';
        h2 += '<div style="padding:10px;border-radius:10px;background:rgba(0,0,0,.3);margin-bottom:6px;opacity:.85"><b>' + escapeHTML(q.planLabel) + '</b> ' + money(q.price) + ' ' + pill + '<div style="font-size:11px;color:#94a3b8;margin-top:4px">' + escapeHTML(q.email) + ' · ' + fmtDate(q.processedAt) + '</div></div>';
      }
      document.getElementById('payHist').innerHTML = h2;
    }
  });
}
function approvePay(id){ if (!confirm('Approve?')) return;
  fetch('/api/admin/payments/approve', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orderId: id }) })
    .then(function(r){ return r.json(); }).then(function(j){ if (j.ok){ alert('✓ Approved'); loadPayments(); loadStats(); } }); }
function rejectPay(id){ var reason = prompt('Reason?', 'Invalid UTR'); if (reason === null) return;
  fetch('/api/admin/payments/reject', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orderId: id, reason: reason }) })
    .then(function(r){ return r.json(); }).then(function(j){ if (j.ok){ alert('✓ Rejected'); loadPayments(); loadStats(); } }); }

/* TOKENS */
function loadTokens(){ fetch('/api/admin/tokens').then(function(r){ return r.json(); }).then(function(j){ if (j.ok){ TOKENS = j.tokens||[]; renderTokens(); } }); }
function renderTokens(){
  var tb = document.getElementById('tokBody');
  if (!TOKENS.length){ tb.innerHTML = '<tr><td colspan="7" class="empty">No tokens</td></tr>'; return; }
  var now = Date.now(), h = '';
  for (var i=0;i<TOKENS.length;i++){
    var t = TOKENS[i];
    var expired = t.expiry && now > new Date(t.expiry).getTime();
    var pill = expired ? '<span class="pill exp">EXPIRED</span>' : (t.active ? '<span class="pill on">ACTIVE</span>' : '<span class="pill pend">PENDING</span>');
    h += '<tr><td class="mono">' + escapeHTML(t.token) + '</td><td>' + escapeHTML(t.email||'—') + '</td><td>' + escapeHTML(t.planLabel||'—') + '</td><td class="mono">' + (t.expiry ? new Date(t.expiry).toLocaleDateString() : '—') + '</td><td>' + pill + '</td><td>' + (t.uses||0) + '</td>'
      + '<td><button class="act gd" onclick="extendToken(\\'' + escapeHTML(t.token) + '\\')">+DAYS</button><button class="act red" onclick="deleteToken(\\'' + escapeHTML(t.token) + '\\')">DEL</button></td></tr>';
  }
  tb.innerHTML = h;
}
function extendToken(tk){ var d = prompt('Days?', '30'); if (!d) return;
  fetch('/api/admin/tokens/extend', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: tk, days: parseInt(d) }) }).then(function(r){ return r.json(); }).then(function(){ loadTokens(); }); }
function deleteToken(tk){ if (!confirm('Delete?')) return;
  fetch('/api/admin/tokens/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token: tk }) }).then(function(){ loadTokens(); }); }

/* USERS */
function loadUsers(){ fetch('/api/admin/users').then(function(r){ return r.json(); }).then(function(j){ if (j.ok){ USERS = j.users||[]; renderUsers(); } }); }
function renderUsers(){
  var tb = document.getElementById('uBody');
  if (!USERS.length){ tb.innerHTML = '<tr><td colspan="7" class="empty">No users</td></tr>'; return; }
  var now = Date.now(), h = '';
  for (var i=0;i<USERS.length;i++){
    var u = USERS[i];
    var expired = u.expiry && now > new Date(u.expiry).getTime();
    var pill = u.banned ? '<span class="pill off">BANNED</span>' : (u.accessActive ? '<span class="pill on">ACTIVE</span>' : (expired ? '<span class="pill exp">EXPIRED</span>' : '<span class="pill pend">NO ACCESS</span>'));
    h += '<tr><td>' + escapeHTML(u.email) + '</td><td>' + escapeHTML(u.name||'—') + '</td><td>' + pill + '</td><td class="mono">' + escapeHTML(u.token||'—') + '</td><td class="mono">' + (u.expiry?new Date(u.expiry).toLocaleDateString():'—') + '</td><td>' + (u.devices||[]).length + '</td>'
      + '<td><button class="act gd" onclick="editUser(\\'' + escapeHTML(u.id) + '\\')">EDIT</button>'
      + '<button class="act gr" onclick="resetDevices(\\'' + escapeHTML(u.id) + '\\')">RESET</button>'
      + '<button class="act ' + (u.banned?'gr':'red') + '" onclick="toggleBan(\\'' + escapeHTML(u.id) + '\\',' + (u.banned?'false':'true') + ')">' + (u.banned?'UNBAN':'BAN') + '</button>'
      + '<button class="act red" onclick="delUser(\\'' + escapeHTML(u.id) + '\\')">DEL</button></td></tr>';
  }
  tb.innerHTML = h;
}
function editUser(id){
  var u = null; for (var i=0;i<USERS.length;i++) if (USERS[i].id === id) u = USERS[i];
  if (!u) return;
  var exp = prompt('Expiry YYYY-MM-DD:', u.expiry ? u.expiry.slice(0,10) : ''); if (exp === null) return;
  var tk = prompt('Token:', u.token || ''); if (tk === null) return;
  var act = confirm('Active? OK=Yes / Cancel=No');
  fetch('/api/admin/users/update', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id, expiry: exp||null, token: tk, accessActive: act }) }).then(function(){ loadUsers(); });
}
function resetDevices(id){ if (!confirm('Reset devices?')) return;
  fetch('/api/admin/users/devices/reset', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) }).then(function(){ loadUsers(); }); }
function toggleBan(id, ban){ fetch('/api/admin/users/ban', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id, ban: ban }) }).then(function(){ loadUsers(); }); }
function delUser(id){ if (!confirm('DELETE?')) return; fetch('/api/admin/users/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: id }) }).then(function(){ loadUsers(); }); }

/* FEATURES */
function loadFeatures(){ fetch('/api/admin/features').then(function(r){ return r.json(); }).then(function(j){ if (j.ok){ FEATURES = j.features||[]; renderFeatures(); } }); }
function renderFeatures(){
  var el = document.getElementById('featList');
  if (!FEATURES.length){ el.innerHTML = '<div class="empty">No features</div>'; return; }
  var h = '';
  for (var i=0;i<FEATURES.length;i++){
    var f = FEATURES[i];
    h += '<div class="feat-card" data-idx="' + i + '">'
      + '<div class="feat-head"><div style="font-weight:800">' + escapeHTML(f.emoji||'🔍') + ' ' + escapeHTML(f.name) + ' <span class="pill ' + (f.active===false?'off':'on') + '">' + (f.active===false?'OFF':'ON') + '</span> <span class="pill pend">' + (f.mode==='custom'?'CUSTOM':'BRONX') + '</span></div>'
      + '<div><button class="act gr" onclick="toggleFeature(' + i + ')">TOGGLE</button><button class="act red" onclick="removeFeature(' + i + ')">DEL</button></div></div>'
      + '<div class="row"><div><label>EMOJI</label><input data-k="emoji" value="' + escapeHTML(f.emoji||'') + '"/></div>'
      + '<div><label>NAME</label><input data-k="name" value="' + escapeHTML(f.name||'') + '"/></div>'
      + '<div><label>COLOR</label><input data-k="color" value="' + escapeHTML(f.color||'#22d3ee') + '"/></div>'
      + '<div><label>HINT</label><input data-k="hint" value="' + escapeHTML(f.hint||'') + '"/></div>'
      + '<div><label>PLACEHOLDER</label><input data-k="placeholder" value="' + escapeHTML(f.placeholder||'') + '"/></div></div>'
      + '<div class="row"><div><label>MODE</label><select data-k="mode"><option value="bronx"' + (f.mode!=='custom'?' selected':'') + '>BRONX</option><option value="custom"' + (f.mode==='custom'?' selected':'') + '>CUSTOM</option></select></div>'
      + '<div><label>TYPE</label><select data-k="type">' + ['text','number','email','tel','url'].map(function(t){return '<option value="'+t+'"'+(f.type===t?' selected':'')+'>'+t+'</option>';}).join('') + '</select></div>'
      + '<div><label>UPPERCASE</label><select data-k="upper"><option value="no"' + (!f.upper?' selected':'') + '>No</option><option value="yes"' + (f.upper?' selected':'') + '>Yes</option></select></div>'
      + '<div><label>LENGTH</label><input data-k="len" type="number" value="' + (f.len||0) + '"/></div>'
      + '<div><label>PRIORITY</label><input data-k="priority" type="number" value="' + (f.priority||i+1) + '"/></div></div>'
      + '<div class="row"><div><label>ENDPOINT (BRONX)</label><input data-k="endpoint" value="' + escapeHTML(f.endpoint||'') + '"/></div>'
      + '<div><label>PARAM</label><input data-k="param" value="' + escapeHTML(f.param||'num') + '"/></div></div>'
      + '<div class="row"><div><label>FULL URL (CUSTOM · {q} placeholder)</label><input data-k="fullUrl" value="' + escapeHTML(f.fullUrl||'') + '"/></div></div>'
      + '<div class="row"><div><label>FREE ALLOWED</label><select data-k="freeAllowed"><option value="no"' + (!f.freeAllowed?' selected':'') + '>No</option><option value="yes"' + (f.freeAllowed?' selected':'') + '>Yes</option></select></div>'
      + '<div><label>FREE LIMIT</label><input data-k="freeLimit" type="number" value="' + (f.freeLimit||0) + '"/></div></div>'
      + '</div>';
  }
  el.innerHTML = h;
  var cards = el.querySelectorAll('.feat-card');
  for (var ci=0; ci<cards.length; ci++){
    (function(card){
      var idx = parseInt(card.getAttribute('data-idx'), 10);
      var inputs = card.querySelectorAll('[data-k]');
      for (var ii=0; ii<inputs.length; ii++){
        (function(inp){
          var handler = function(){
            var k = inp.getAttribute('data-k'); if (!FEATURES[idx]) return;
            var v = inp.value;
            if (k === 'priority') v = Number(v)||1;
            else if (k === 'len') v = Number(v)||null;
            else if (k === 'freeLimit') v = Number(v)||0;
            else if (k === 'upper' || k === 'freeAllowed') v = (v === 'yes');
            FEATURES[idx][k] = v;
          };
          inp.addEventListener('input', handler); inp.addEventListener('change', handler);
        })(inputs[ii]);
      }
    })(cards[ci]);
  }
}
function addFeature(){ FEATURES.push({ id: uid(), name:'New Feature', emoji:'🔍', color:'#22d3ee', hint:'Enter value', placeholder:'value', mode:'bronx', endpoint:'/api/key-bronx/number', param:'num', fullUrl:'', method:'GET', headers:'', responseType:'json', group:'General', tags:'', priority:FEATURES.length+1, type:'text', upper:false, len:null, active:true, freeAllowed:false, freeLimit:0 }); renderFeatures(); }
function removeFeature(i){ if (!confirm('Delete?')) return; FEATURES.splice(i,1); renderFeatures(); }
function toggleFeature(i){ FEATURES[i].active = !FEATURES[i].active; renderFeatures(); }
function resetFeatures(){ if (!confirm('Reset?')) return; fetch('/api/admin/features/reset', { method:'POST' }).then(function(){ loadFeatures(); }); }
function saveFeatures(){
  for (var i=0;i<FEATURES.length;i++){
    if (!FEATURES[i].name || !FEATURES[i].name.trim()){ alert('Feature #' + (i+1) + ' naam khali'); return; }
    if (FEATURES[i].mode === 'custom' && (!FEATURES[i].fullUrl || !FEATURES[i].fullUrl.trim())){ alert('Feature #' + (i+1) + ' Full URL khali'); return; }
    if (FEATURES[i].mode !== 'custom' && (!FEATURES[i].endpoint || !FEATURES[i].endpoint.trim())){ alert('Feature #' + (i+1) + ' Endpoint khali'); return; }
  }
  fetch('/api/admin/features/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ features: FEATURES }) })
    .then(function(r){ return r.json(); }).then(function(j){
      var m = document.getElementById('featMsg');
      m.textContent = j.ok ? '✓ Saved ' + FEATURES.length + ' features' : '✗ ' + (j.error||'Failed');
      m.className = 'msg ' + (j.ok?'ok':'err'); m.style.display = 'block';
      setTimeout(function(){ m.style.display = 'none'; }, 3000);
    });
}

/* PLANS */
function loadPlans(){ fetch('/api/admin/plans').then(function(r){ return r.json(); }).then(function(j){ if (j.ok){ PLANS = j.plans||[]; renderPlans(); } }); }
function renderPlans(){
  var el = document.getElementById('planList');
  if (!PLANS.length){ el.innerHTML = '<div class="empty">No plans</div>'; return; }
  var h = '';
  for (var i=0;i<PLANS.length;i++){
    var p = PLANS[i];
    h += '<div class="plan-row"><input value="' + escapeHTML(p.label||'') + '" data-i="' + i + '" data-k="label"/>'
      + '<input type="number" value="' + (p.days||0) + '" data-i="' + i + '" data-k="days"/>'
      + '<input type="number" value="' + (p.price||0) + '" data-i="' + i + '" data-k="price"/>'
      + '<input value="' + escapeHTML(p.tag||'') + '" data-i="' + i + '" data-k="tag"/>'
      + '<label style="font-size:11px"><input type="checkbox" ' + (p.popular?'checked':'') + ' data-i="' + i + '" data-k="popular" style="width:auto"/> POPULAR</label>'
      + '<button class="act red" onclick="removePlan(' + i + ')">DEL</button></div>';
  }
  el.innerHTML = h;
  var inputs = el.querySelectorAll('input');
  for (var j=0;j<inputs.length;j++){
    inputs[j].addEventListener('change', function(ev){
      var i = parseInt(ev.target.dataset.i,10), k = ev.target.dataset.k;
      if (!PLANS[i]) return;
      if (ev.target.type === 'checkbox') PLANS[i][k] = ev.target.checked;
      else if (ev.target.type === 'number') PLANS[i][k] = Number(ev.target.value);
      else PLANS[i][k] = ev.target.value;
    });
  }
}
function addPlan(){ PLANS.push({ id:'p_' + Date.now(), label:'New Plan', days:1, price:100, tag:'', popular:false }); renderPlans(); }
function removePlan(i){ PLANS.splice(i,1); renderPlans(); }
function savePlans(){
  fetch('/api/admin/plans/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ plans: PLANS }) })
    .then(function(r){ return r.json(); }).then(function(j){
      var m = document.getElementById('planMsg');
      m.textContent = j.ok ? '✓ Saved' : '✗ Failed'; m.className = 'msg ' + (j.ok?'ok':'err'); m.style.display = 'block';
      setTimeout(function(){ m.style.display = 'none'; }, 2500);
    });
}

/* CHAT */
function loadChatConvs(){
  fetch('/api/admin/chat/conversations').then(function(r){ return r.json(); }).then(function(j){
    if (!j.ok) return;
    CHAT_CONVS = j.conversations || [];
    var el = document.getElementById('chatConvs');
    if (!CHAT_CONVS.length){ el.innerHTML = '<div class="empty">No conversations</div>'; return; }
    var h = '';
    for (var i=0;i<CHAT_CONVS.length;i++){
      var c = CHAT_CONVS[i];
      h += '<div class="chat-conv ' + (CHAT_ACTIVE === c.uid ? 'active' : '') + '" onclick="openChatConv(\\'' + escapeHTML(c.uid) + '\\')"><div style="font-weight:800;color:#22d3ee">' + escapeHTML(c.email) + '</div>'
        + '<div style="font-size:11px;color:#94a3b8;margin-top:4px">' + escapeHTML((c.lastText||'').slice(0,60)) + '</div>'
        + '<div style="font-size:10px;color:#64748b;margin-top:2px">' + new Date(c.lastTs||Date.now()).toLocaleString() + '</div></div>';
    }
    el.innerHTML = h;
  });
}
function openChatConv(uid){
  CHAT_ACTIVE = uid;
  document.getElementById('chatNoSel').style.display = 'none';
  document.getElementById('chatActive').style.display = 'block';
  var conv = null;
  for (var i=0;i<CHAT_CONVS.length;i++) if (CHAT_CONVS[i].uid === uid) conv = CHAT_CONVS[i];
  document.getElementById('chatActiveName').textContent = conv ? conv.email : uid;
  loadChatWindow();
  loadChatConvs();
}
function loadChatWindow(){
  if (!CHAT_ACTIVE) return;
  fetch('/api/admin/chat/messages?uid=' + encodeURIComponent(CHAT_ACTIVE)).then(function(r){ return r.json(); }).then(function(j){
    if (!j.ok) return;
    var w = document.getElementById('chatWindow');
    var msgs = j.messages || [];
    if (!msgs.length){ w.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:20px;font-size:12px">No messages</div>'; return; }
    var h = '';
    for (var i=0;i<msgs.length;i++){
      var m = msgs[i];
      var cls = m.from === 'admin' ? 'chatmsg admin' : 'chatmsg user';
      h += '<div class="' + cls + '">' + escapeHTML(m.text) + '<div style="font-size:9px;opacity:.7;margin-top:3px">' + new Date(m.ts).toLocaleTimeString() + '</div></div>';
    }
    w.innerHTML = h;
    w.scrollTop = w.scrollHeight;
  });
}
function adminSend(){
  if (!CHAT_ACTIVE) return;
  var inp = document.getElementById('adminChatInput');
  var t = inp.value.trim(); if (!t) return;
  inp.value = '';
  fetch('/api/admin/chat/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ uid: CHAT_ACTIVE, text: t }) })
    .then(function(){ loadChatWindow(); });
}
setInterval(function(){ if (CHAT_ACTIVE && document.getElementById('paneChat').style.display !== 'none') loadChatWindow(); }, 5000);

/* ANALYTICS */
function loadAnalytics(){
  fetch('/api/admin/analytics').then(function(r){ return r.json(); }).then(function(j){
    if (!j.ok) return;
    var el = document.getElementById('analyticsBody');
    var feats = j.features || [];
    if (!feats.length){ el.innerHTML = '<div class="empty">No data yet</div>'; return; }
    var h = '<table class="utable"><thead><tr><th>FEATURE</th><th>TODAY</th><th>THIS MONTH</th><th>THIS YEAR</th><th>TOTAL</th></tr></thead><tbody>';
    for (var i=0;i<feats.length;i++){
      var f = feats[i];
      h += '<tr><td><b>' + escapeHTML(f.name) + '</b></td><td class="mono" style="color:#86efac">' + (f.today||0) + '</td><td class="mono" style="color:#7fefff">' + (f.month||0) + '</td><td class="mono" style="color:#fcd34d">' + (f.year||0) + '</td><td class="mono" style="font-weight:900">' + (f.total||0) + '</td></tr>';
    }
    h += '</tbody></table>';
    el.innerHTML = h;
  });
}

/* SETTINGS */
function loadSettings(){
  fetch('/api/admin/settings').then(function(r){ return r.json(); }).then(function(j){
    if (!j.ok) return;
    document.getElementById('gEnabled').value = j.settings.guestEnabled ? 'yes' : 'no';
    document.getElementById('gLimit').value = j.settings.guestDailyLimit || 5;
    document.getElementById('bcMsg').value = j.settings.broadcastMessage || '';
  });
}
function saveSettings(){
  var s = {
    guestEnabled: document.getElementById('gEnabled').value === 'yes',
    guestDailyLimit: parseInt(document.getElementById('gLimit').value) || 5
  };
  fetch('/api/admin/settings/save', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(s) })
    .then(function(r){ return r.json(); }).then(function(j){
      var m = document.getElementById('setMsg');
      m.textContent = j.ok ? '✓ Saved' : '✗ Failed'; m.className = 'msg ' + (j.ok?'ok':'err'); m.style.display = 'block';
      setTimeout(function(){ m.style.display = 'none'; }, 2500);
    });
}
function saveBroadcast(){
  var msg = document.getElementById('bcMsg').value.trim();
  fetch('/api/admin/broadcast', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: msg, active: !!msg }) })
    .then(function(r){ return r.json(); }).then(function(j){
      var e = document.getElementById('bcStat'); e.textContent = j.ok ? '✓ Live' : '✗'; e.className = 'msg ' + (j.ok?'ok':'err'); e.style.display = 'block';
      setTimeout(function(){ e.style.display = 'none'; }, 2500);
    });
}
function clearBroadcast(){ fetch('/api/admin/broadcast', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message:'', active:false }) }).then(function(){ document.getElementById('bcMsg').value = ''; }); }
function changeAdminPass(){
  var np = document.getElementById('apP').value; if (!np) return;
  fetch('/api/admin/change-pass', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ newPass: np }) })
    .then(function(r){ return r.json(); }).then(function(j){
      var e = document.getElementById('apMsg'); e.textContent = j.ok ? '✓ Updated' : '✗'; e.className = 'msg ' + (j.ok?'ok':'err'); e.style.display = 'block';
      if (j.ok) document.getElementById('apP').value = '';
      setTimeout(function(){ e.style.display = 'none'; }, 2500);
    });
}
function killAllSessions(){ if (!confirm('Kill ALL?')) return; fetch('/api/admin/kill-sessions', { method:'POST' }).then(function(r){ return r.json(); }).then(function(j){ if (j.ok) alert('✓ Done'); }); }

/* EXPORT / IMPORT */
function exportData(){ fetch('/api/admin/export').then(function(r){ return r.json(); }).then(function(j){ if (!j.ok) return; var blob = new Blob([JSON.stringify(j.data,null,2)],{type:'application/json'}); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bronx-backup-' + new Date().toISOString().slice(0,10) + '.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }); }
function exportConfigOnly(){ fetch('/api/admin/export?configOnly=1').then(function(r){ return r.json(); }).then(function(j){ if (!j.ok) return; var blob = new Blob([JSON.stringify(j.data,null,2)],{type:'application/json'}); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bronx-config-' + new Date().toISOString().slice(0,10) + '.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }); }
function importData(mode){
  var file = document.getElementById('importFile').files[0]; if (!file){ alert('File select karein'); return; }
  if (mode === 'replace' && !confirm('⚠ REPLACE mode — purana data delete hoga!')) return;
  var reader = new FileReader();
  reader.onload = function(e){
    var parsed; try { parsed = JSON.parse(e.target.result); } catch (err){ alert('Invalid JSON'); return; }
    fetch('/api/admin/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mode: mode, data: parsed }) })
      .then(function(r){ return r.json(); }).then(function(j){
        var m = document.getElementById('impMsg'); m.textContent = j.ok ? '✓ Imported ' + (j.imported||0) : '✗ ' + (j.error||'Failed'); m.className = 'msg ' + (j.ok?'ok':'err'); m.style.display = 'block';
        if (j.ok){ loadStats(); loadUsers(); loadTokens(); loadPayments(); loadFeatures(); loadPlans(); }
        setTimeout(function(){ m.style.display = 'none'; }, 4000);
      });
  };
  reader.readAsText(file);
}
function logout(){ fetch('/api/logout', { method:'POST' }).then(function(){ location.href = '/login'; }); }

loadStats(); loadPayments(); loadUsers();
setInterval(function(){ loadStats(); loadPayments(); }, 20000);
</script>
</body></html>`;

/* ============================================================
   ROUTES
   ============================================================ */
app.get('/', async (req, res) => {
  const s = await getSession(req);
  if (s && s.role === 'user') return res.send(DASHBOARD_HTML);
  if (s && s.role === 'admin') return res.redirect('/admin');
  res.send(LANDING_HTML);
});
app.get('/login', async (req, res) => {
  const s = await getSession(req);
  if (s) return res.redirect('/');
  res.send(LOGIN_HTML);
});
app.get('/payment', (req, res) => res.send(PAYMENT_HTML));
app.get('/guest', (req, res) => res.send(GUEST_HTML));
app.get('/admin', async (req, res) => {
  const s = await getSession(req);
  if (!s || s.role !== 'admin') return res.send(ADMIN_LOGIN);
  res.send(ADMIN_HTML);
});

/* ============================================================
   PUBLIC CONFIG
   ============================================================ */
app.get('/api/features', async (req, res) => {
  const f = await getFeatures();
  const s = await getSettings();
  res.json({
    features: f.map(function(x){
      return { id:x.id, name:x.name, emoji:x.emoji, color:x.color, hint:x.hint, placeholder:x.placeholder, type:x.type,
        upper:x.upper, len:x.len, group:x.group, priority:x.priority, active:x.active !== false,
        freeAllowed: x.freeAllowed, freeLimit: x.freeLimit };
    }),
    settings: { guestEnabled: s.guestEnabled, guestDailyLimit: s.guestDailyLimit }
  });
});
app.get('/api/plans', async (req, res) => { res.json({ plans: await getPlans() }); });
app.get('/api/broadcast', async (req, res) => {
  const b = await kvGet('config:broadcast');
  res.json(b || { message:'', active:false });
});

/* ============================================================
   GMAIL AUTH
   ============================================================ */
app.post('/api/auth/gmail', async (req, res) => {
  const b = req.body || {};
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  const fp = String(b.fp || '');
  const ua = String(b.ua || '');
  const device = deviceName(ua);
  const ip = clientIP(req);
  if (!email || !password) return res.status(400).json({ ok:false, error:'Required' });
  if (!isGmail(email)) return res.status(403).json({ ok:false, error:'Sirf @gmail.com' });
  const uid = emailToUid(email);
  let user = await kvGet('user:' + uid);
  if (!user){
    user = { id: uid, email, name:'', password: hashPass(password), authMethod:'gmail', token:'', expiry:null, accessActive:false, pending:false, banned:false, devices:[], usage:{}, createdAt: Date.now(), lastLoginAt: Date.now() };
    await attachDevice(user, uid, fp, ip, device, ua);
    const t = await createSession(email, 'user', { uid: uid, fp: fp }, 86400 * 30);
    setCookie(res, CFG.COOKIE, t, 86400 * 30);
    return res.json({ ok:true, newAccount:true });
  }
  if (user.banned) return res.status(403).json({ ok:false, error:'Banned' });
  if (user.password && !verifyPass(password, user.password)) return res.status(401).json({ ok:false, error:'Password galat' });
  if (!user.password) user.password = hashPass(password);
  user.lastLoginAt = Date.now();
  await attachDevice(user, uid, fp, ip, device, ua);
  const t = await createSession(email, 'user', { uid: uid, fp: fp }, 86400 * 30);
  setCookie(res, CFG.COOKIE, t, 86400 * 30);
  res.json({ ok:true });
});

async function attachDevice(user, uid, fp, ip, device, ua) {
  user.devices = user.devices || [];
  let existing = null;
  for (let i=0; i<user.devices.length; i++) if (user.devices[i].fp === fp) existing = user.devices[i];
  if (existing){ existing.lastSeen = Date.now(); existing.ip = ip; }
  else {
    user.devices.push({ fp, ip, device, ua: String(ua).slice(0,200), added: Date.now(), lastSeen: Date.now() });
    if (user.devices.length > 5) user.devices = user.devices.slice(-5);
  }
  await kvSet('user:' + uid, user);
}

app.post('/api/admin/login', async (req, res) => {
  const b = req.body || {};
  const u = String(b.u||'').trim().toLowerCase();
  const p = String(b.p||'');
  const ac = await adminCreds();
  if (u === String(ac.u).toLowerCase() && verifyPass(p, ac.p)){
    const t = await createSession('admin', 'admin', {}, 86400 * 7);
    setCookie(res, CFG.COOKIE, t, 86400 * 7);
    return res.json({ ok:true, role:'admin' });
  }
  res.status(401).json({ ok:false, error:'Invalid' });
});

app.post('/api/logout', async (req, res) => {
  const s = await getSession(req);
  if (s) await kvDel('sess:' + s.token);
  clearCookie(res, CFG.COOKIE);
  res.json({ ok:true });
});

/* ============================================================
   USER APIs
   ============================================================ */
app.get('/api/me', async (req, res) => {
  const s = await getSession(req);
  if (!s) return res.status(401).json({ ok:false });
  if (s.role === 'admin') return res.json({ ok:true, role:'admin', email:'admin' });
  const u = await kvGet('user:' + s.uid);
  if (!u) return res.status(401).json({ ok:false });
  const expired = u.expiry && Date.now() > new Date(u.expiry).getTime();
  res.json({ ok:true, role:'user', email:u.email, name:u.name, token:u.token, expiry:u.expiry, accessActive: u.accessActive && !expired });
});

app.get('/api/account/info', async (req, res) => {
  const s = await getSession(req);
  if (!s || s.role !== 'user') return res.status(401).json({ ok:false });
  const u = await kvGet('user:' + s.uid);
  if (!u) return res.status(401).json({ ok:false });
  const expired = u.expiry && Date.now() > new Date(u.expiry).getTime();
  res.json({ ok:true,
    user: { email:u.email, name:u.name, token:u.token, expiry:u.expiry, accessActive: u.accessActive && !expired, devices:u.devices||[], createdAt:u.createdAt },
    usage: u.usage || {} });
});

/* ============================================================
   GUEST APIs
   ============================================================ */
app.get('/api/guest/status', async (req, res) => {
  const s = await getSettings();
  const fp = String(req.query.fp || '');
  if (!fp) return res.status(400).json({ ok:false });
  const key = 'guest:' + todayKey() + ':' + fp;
  const count = Number(await kvGet(key)) || 0;
  res.json({ ok:true, enabled: s.guestEnabled, count, limit: s.guestDailyLimit, remaining: Math.max(0, s.guestDailyLimit - count), message: s.guestMessage });
});

app.get('/api/guest/lookup', async (req, res) => {
  const s = await getSettings();
  if (!s.guestEnabled) return res.status(403).json({ error:'Guest mode disabled' });
  const featureId = String(req.query.feature || '');
  const q = String(req.query.q || '');
  const fp = String(req.query.fp || '');
  if (!featureId || !q || !fp) return res.status(400).json({ error:'Missing params' });

  const features = await getFeatures();
  let feat = null;
  for (let i=0;i<features.length;i++) if (features[i].id === featureId) feat = features[i];
  if (!feat) return res.status(404).json({ error:'Feature not found' });
  if (!feat.freeAllowed) return res.status(403).json({ error:'Not allowed for guests' });

  // Check guest usage
  const key = 'guest:' + todayKey() + ':' + fp;
  const count = Number(await kvGet(key)) || 0;
  const featureLimit = feat.freeLimit || s.guestDailyLimit;

  // Count feature-specific usage
  const featKey = 'guest_feat:' + todayKey() + ':' + fp + ':' + feat.id;
  const featCount = Number(await kvGet(featKey)) || 0;

  if (count >= s.guestDailyLimit) return res.status(429).json({ error:'Daily limit reached. Sign in to continue.' });
  if (featCount >= featureLimit) return res.status(429).json({ error:'Feature free limit reached. Sign in to continue.' });

  let url = feat.mode === 'custom' ? buildCustomUrl(feat, q) : buildBronxUrl(feat, q);
  if (!url) return res.status(500).json({ error:'URL build failed' });

  try {
    const headers = Object.assign({ 'User-Agent':'BronxUltra/7.0' }, parseHeaders(feat.headers || ''));
    const r = await fetch(url, { method: feat.method || 'GET', headers });
    const txt = await r.text();
    let parsed;
    if (feat.responseType === 'text' || feat.responseType === 'html' || feat.responseType === 'xml') {
      parsed = { _responseType: feat.responseType, raw: txt.slice(0, 10000) };
    } else {
      try { parsed = JSON.parse(txt); } catch (e) { parsed = { _responseType:'text', raw: txt.slice(0, 10000) }; }
    }

    // Increment usage
    await kvSet(key, count + 1);
    await kvSet(featKey, featCount + 1);
    // Analytics
    await kvIncr('stats:' + todayKey() + ':' + feat.id);
    await kvIncr('stats_m:' + monthKey() + ':' + feat.id);
    await kvIncr('stats_y:' + yearKey() + ':' + feat.id);
    await kvIncr('stats_total:' + feat.id);

    res.json(parsed);
  } catch (e) {
    res.status(502).json({ error: 'Upstream failed: ' + e.message });
  }
});

/* ============================================================
   USER LOOKUP (authenticated)
   ============================================================ */
app.get('/api/lookup', async (req, res) => {
  const s = await getSession(req);
  if (!s || s.role !== 'user') return res.status(401).json({ error:'Session expired' });
  const u = await kvGet('user:' + s.uid);
  if (!u) return res.status(401).json({ error:'User not found' });
  if (u.banned) return res.status(403).json({ error:'Banned' });
  const expired = u.expiry && Date.now() > new Date(u.expiry).getTime();
  if (!u.accessActive || expired) return res.status(402).json({ error:'No active access' });

  const featureId = String(req.query.feature || '');
  const q = String(req.query.q || '');
  if (!featureId || !q) return res.status(400).json({ error:'Missing params' });

  const features = await getFeatures();
  let feat = null;
  for (let i=0;i<features.length;i++) if (features[i].id === featureId) feat = features[i];
  if (!feat) return res.status(404).json({ error:'Feature not found' });
  if (feat.active === false) return res.status(403).json({ error:'Feature disabled' });

  let url = feat.mode === 'custom' ? buildCustomUrl(feat, q) : buildBronxUrl(feat, q);
  if (!url) return res.status(500).json({ error:'URL build failed' });

  try {
    const headers = Object.assign({ 'User-Agent':'BronxUltra/7.0' }, parseHeaders(feat.headers || ''));
    const r = await fetch(url, { method: feat.method || 'GET', headers });
    const txt = await r.text();
    let parsed;
    if (feat.responseType === 'text' || feat.responseType === 'html' || feat.responseType === 'xml') {
      parsed = { _responseType: feat.responseType, raw: txt.slice(0, 10000) };
    } else {
      try { parsed = JSON.parse(txt); } catch (e) { parsed = { _responseType:'text', raw: txt.slice(0, 10000) }; }
    }

    u.usage = u.usage || {};
    u.usage[feat.name] = (u.usage[feat.name] || 0) + 1;
    u.lastUsedAt = Date.now();
    await kvSet('user:' + s.uid, u);

    // Analytics
    await kvIncr('stats:' + todayKey() + ':' + feat.id);
    await kvIncr('stats_m:' + monthKey() + ':' + feat.id);
    await kvIncr('stats_y:' + yearKey() + ':' + feat.id);
    await kvIncr('stats_total:' + feat.id);

    res.json(parsed);
  } catch (e) {
    res.status(502).json({ error: 'Upstream failed: ' + e.message });
  }
});

/* ============================================================
   CHAT (User)
   ============================================================ */
app.get('/api/chat/messages', async (req, res) => {
  const s = await getSession(req);
  if (!s || s.role !== 'user') return res.status(401).json({ ok:false });
  const msgs = (await kvGet('chat:' + s.uid)) || [];
  res.json({ ok:true, messages: msgs });
});
app.post('/api/chat/send', async (req, res) => {
  const s = await getSession(req);
  if (!s || s.role !== 'user') return res.status(401).json({ ok:false });
  const text = String((req.body||{}).text || '').trim().slice(0, 500);
  if (!text) return res.status(400).json({ ok:false });
  const msgs = (await kvGet('chat:' + s.uid)) || [];
  msgs.push({ from:'user', text, ts: Date.now() });
  if (msgs.length > 200) msgs.splice(0, msgs.length - 200);
  await kvSet('chat:' + s.uid, msgs);
  // Update conversation index
  const convs = (await kvGet('chat:index')) || [];
  const u = await kvGet('user:' + s.uid);
  const existing = convs.find(c => c.uid === s.uid);
  if (existing){ existing.lastText = text; existing.lastTs = Date.now(); }
  else convs.push({ uid: s.uid, email: (u&&u.email)||s.uid, lastText: text, lastTs: Date.now() });
  await kvSet('chat:index', convs);
  res.json({ ok:true });
});
app.get('/api/chat/count', async (req, res) => {
  const s = await getSession(req);
  if (!s || s.role !== 'user') return res.status(401).json({ ok:false });
  const msgs = (await kvGet('chat:' + s.uid)) || [];
  const last = (await kvGet('chat_lastread:' + s.uid)) || 0;
  let unread = 0;
  for (let i=0;i<msgs.length;i++) if (msgs[i].from === 'admin' && msgs[i].ts > last) unread++;
  res.json({ ok:true, unread });
});

/* ============================================================
   PAYMENT
   ============================================================ */
app.post('/api/payment/submit', async (req, res) => {
  const b = req.body || {};
  const plans = await getPlans();
  let plan = null;
  for (let i=0;i<plans.length;i++) if (plans[i].id === b.planId) plan = plans[i];
  if (!plan) return res.status(400).json({ ok:false, error:'Invalid plan' });
  const utr = String(b.utr||'').trim();
  const tg = String(b.tg||'').trim();
  const email = String(b.email||'').trim().toLowerCase();
  if (!utr || utr.length < 6) return res.status(400).json({ ok:false, error:'Invalid UTR' });
  if (!isGmail(email)) return res.status(403).json({ ok:false, error:'Sirf @gmail.com' });
  if (!tg) return res.status(400).json({ ok:false, error:'Telegram required' });
  const existing = await kvGet('pay_utr:' + utr);
  if (existing) return res.status(400).json({ ok:false, error:'UTR already submitted' });
  const orderId = randOrderId();
  const token = randToken();
  const payObj = { orderId, token, planId: plan.id, planLabel: plan.label, days: plan.days, price: plan.price, utr, tg, email, fp: String(b.fp||''), ua: String(b.ua||''), device: String(b.device||''), ip: clientIP(req), status:'pending', createdAt: Date.now() };
  await kvSet('payment:' + orderId, payObj);
  await kvSet('pay_utr:' + utr, orderId);
  await kvSet('token:' + token, { token, orderId, email, planLabel: plan.label, days: plan.days, expiry: null, active: false, uses: 0, createdAt: Date.now() });
  res.json({ ok:true, token, orderId });
});

/* ============================================================
   ADMIN APIs
   ============================================================ */
const adminAuth = async (req, res, next) => {
  const s = await getSession(req);
  if (!s || s.role !== 'admin') return res.status(401).json({ ok:false });
  next();
};

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  const uk = await kvKeys('user:');
  const sk = await kvKeys('sess:');
  const pk = await kvKeys('payment:');
  const tk = await kvKeys('token:');
  const ck = await kvKeys('chat:index');
  const f = await getFeatures();
  let pending = 0, activeTokens = 0, chatConvs = 0;
  for (const k of pk){ const p = await kvGet(k); if (p && p.status === 'pending') pending++; }
  for (const k of tk){ const t = await kvGet(k); if (t && t.active && (!t.expiry || Date.now() < new Date(t.expiry).getTime())) activeTokens++; }
  const convs = (await kvGet('chat:index')) || [];
  chatConvs = convs.length;
  res.json({ ok:true, users:uk.length, sessions:sk.length, pending, activeTokens, features:f.length, chatConvs, hasKV: !!(CFG.KV_URL && CFG.KV_TOKEN) });
});

app.get('/api/admin/analytics', adminAuth, async (req, res) => {
  const features = await getFeatures();
  const today = todayKey(), month = monthKey(), year = yearKey();
  const out = [];
  for (const f of features){
    const t = Number(await kvGet('stats:' + today + ':' + f.id)) || 0;
    const m = Number(await kvGet('stats_m:' + month + ':' + f.id)) || 0;
    const y = Number(await kvGet('stats_y:' + year + ':' + f.id)) || 0;
    const total = Number(await kvGet('stats_total:' + f.id)) || 0;
    out.push({ id: f.id, name: f.name, today: t, month: m, year: y, total });
  }
  res.json({ ok:true, features: out });
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  const users = [];
  for (const k of await kvKeys('user:')){
    const u = await kvGet(k);
    if (u){
      const expired = u.expiry && Date.now() > new Date(u.expiry).getTime();
      users.push({ id:u.id, email:u.email, name:u.name, token:u.token||'', expiry:u.expiry||null, accessActive: u.accessActive && !expired, banned:!!u.banned, devices:u.devices||[], usage:u.usage||{}, createdAt:u.createdAt, lastLoginAt:u.lastLoginAt });
    }
  }
  users.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  res.json({ ok:true, users });
});
app.post('/api/admin/users/update', adminAuth, async (req, res) => {
  const b = req.body || {};
  const u = await kvGet('user:' + b.id); if (!u) return res.status(404).json({ ok:false });
  if ('expiry' in b) u.expiry = b.expiry || null;
  if ('token' in b) u.token = String(b.token || '');
  if ('accessActive' in b) u.accessActive = !!b.accessActive;
  await kvSet('user:' + b.id, u);
  res.json({ ok:true });
});
app.post('/api/admin/users/devices/reset', adminAuth, async (req, res) => {
  const u = await kvGet('user:' + (req.body||{}).id); if (!u) return res.status(404).json({ ok:false });
  u.devices = []; await kvSet('user:' + (req.body||{}).id, u); res.json({ ok:true });
});
app.post('/api/admin/users/ban', adminAuth, async (req, res) => {
  const b = req.body || {}; const u = await kvGet('user:' + b.id); if (!u) return res.status(404).json({ ok:false });
  u.banned = !!b.ban; await kvSet('user:' + b.id, u); res.json({ ok:true });
});
app.post('/api/admin/users/delete', adminAuth, async (req, res) => { await kvDel('user:' + (req.body||{}).id); res.json({ ok:true }); });

app.get('/api/admin/payments', adminAuth, async (req, res) => {
  const all = [];
  for (const k of await kvKeys('payment:')){ const p = await kvGet(k); if (p) all.push(p); }
  all.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  res.json({ ok:true, pending: all.filter(p => p.status === 'pending'), processed: all.filter(p => p.status !== 'pending').slice(0,50) });
});
app.post('/api/admin/payments/approve', adminAuth, async (req, res) => {
  const p = await kvGet('payment:' + (req.body||{}).orderId); if (!p) return res.status(404).json({ ok:false });
  if (p.status === 'approved') return res.json({ ok:true, already:true });
  const expiryIso = new Date(Date.now() + p.days * 86400000).toISOString();
  const tk = await kvGet('token:' + p.token);
  if (tk){ tk.active = true; tk.expiry = expiryIso; tk.approvedAt = Date.now(); await kvSet('token:' + p.token, tk); }
  const uid = emailToUid(p.email);
  let u = await kvGet('user:' + uid);
  if (!u){ u = { id: uid, email: p.email, name:'', password:null, authMethod:'payment', token:p.token, expiry:expiryIso, accessActive:true, pending:false, banned:false, devices: p.fp ? [{ fp:p.fp, ip:p.ip||'', device:p.device||'', ua:p.ua||'', added: Date.now(), lastSeen: Date.now() }] : [], usage:{}, createdAt: Date.now(), lastLoginAt: Date.now() }; }
  else { u.token = p.token; u.expiry = expiryIso; u.accessActive = true; u.pending = false; if (p.fp && !u.devices.some(d => d.fp === p.fp)) u.devices.push({ fp:p.fp, ip:p.ip||'', device:p.device||'', ua:p.ua||'', added: Date.now(), lastSeen: Date.now() }); }
  await kvSet('user:' + uid, u);
  p.status = 'approved'; p.processedAt = Date.now();
  await kvSet('payment:' + (req.body||{}).orderId, p);
  res.json({ ok:true });
});
app.post('/api/admin/payments/reject', adminAuth, async (req, res) => {
  const b = req.body || {};
  const p = await kvGet('payment:' + b.orderId); if (!p) return res.status(404).json({ ok:false });
  p.status = 'rejected'; p.reason = String(b.reason||''); p.processedAt = Date.now();
  await kvSet('payment:' + b.orderId, p);
  await kvDel('pay_utr:' + p.utr); await kvDel('token:' + p.token);
  res.json({ ok:true });
});

app.get('/api/admin/tokens', adminAuth, async (req, res) => {
  const tokens = []; for (const k of await kvKeys('token:')){ const t = await kvGet(k); if (t) tokens.push(t); }
  tokens.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  res.json({ ok:true, tokens });
});
app.post('/api/admin/tokens/extend', adminAuth, async (req, res) => {
  const b = req.body || {}; const tk = await kvGet('token:' + b.token); if (!tk) return res.status(404).json({ ok:false });
  const days = Number(b.days||0); if (!days) return res.status(400).json({ ok:false });
  const cur = tk.expiry ? new Date(tk.expiry).getTime() : Date.now();
  tk.expiry = new Date(cur + days * 86400000).toISOString(); tk.active = true;
  await kvSet('token:' + b.token, tk);
  if (tk.email){ const uid = emailToUid(tk.email); const u = await kvGet('user:' + uid); if (u){ u.expiry = tk.expiry; u.accessActive = true; await kvSet('user:' + uid, u); } }
  res.json({ ok:true });
});
app.post('/api/admin/tokens/delete', adminAuth, async (req, res) => { await kvDel('token:' + (req.body||{}).token); res.json({ ok:true }); });

app.get('/api/admin/features', adminAuth, async (req, res) => { res.json({ ok:true, features: await getFeatures() }); });
app.post('/api/admin/features/save', adminAuth, async (req, res) => {
  const b = req.body || {}; if (!Array.isArray(b.features)) return res.status(400).json({ ok:false, error:'Invalid' });
  const clean = [];
  for (let i=0;i<b.features.length;i++){
    const f = b.features[i];
    if (!f.name || !String(f.name).trim()) return res.status(400).json({ ok:false, error:'#' + (i+1) + ' name required' });
    if (f.mode === 'custom' && (!f.fullUrl || !String(f.fullUrl).trim())) return res.status(400).json({ ok:false, error:'#' + (i+1) + ' Full URL required' });
    if (f.mode !== 'custom' && (!f.endpoint || !String(f.endpoint).trim())) return res.status(400).json({ ok:false, error:'#' + (i+1) + ' Endpoint required' });
    clean.push(sanitizeFeature(f, i));
  }
  await kvSet('config:features', clean);
  res.json({ ok:true, count: clean.length });
});
app.post('/api/admin/features/reset', adminAuth, async (req, res) => { await kvSet('config:features', DEFAULT_FEATURES); res.json({ ok:true }); });

app.get('/api/admin/plans', adminAuth, async (req, res) => { res.json({ ok:true, plans: await getPlans() }); });
app.post('/api/admin/plans/save', adminAuth, async (req, res) => {
  const b = req.body || {}; if (!Array.isArray(b.plans)) return res.status(400).json({ ok:false });
  await kvSet('config:plans', b.plans); res.json({ ok:true });
});

app.get('/api/admin/settings', adminAuth, async (req, res) => {
  const s = await getSettings();
  const bc = await kvGet('config:broadcast');
  res.json({ ok:true, settings: Object.assign({}, s, { broadcastMessage: (bc && bc.message) || '' }) });
});
app.post('/api/admin/settings/save', adminAuth, async (req, res) => {
  const b = req.body || {};
  const cur = await getSettings();
  const next = Object.assign({}, cur, { guestEnabled: !!b.guestEnabled, guestDailyLimit: Number(b.guestDailyLimit) || 5 });
  await kvSet('config:settings', next); res.json({ ok:true });
});

app.get('/api/admin/broadcast', adminAuth, async (req, res) => {
  const b = await kvGet('config:broadcast');
  res.json({ ok:true, message: (b&&b.message)||'', active: !!(b&&b.active) });
});
app.post('/api/admin/broadcast', adminAuth, async (req, res) => {
  const b = req.body || {};
  await kvSet('config:broadcast', { message: String(b.message||''), active: !!b.active });
  res.json({ ok:true });
});

/* ADMIN CHAT */
app.get('/api/admin/chat/conversations', adminAuth, async (req, res) => {
  const convs = (await kvGet('chat:index')) || [];
  convs.sort((a,b) => (b.lastTs||0) - (a.lastTs||0));
  res.json({ ok:true, conversations: convs });
});
app.get('/api/admin/chat/messages', adminAuth, async (req, res) => {
  const uid = String(req.query.uid || '');
  if (!uid) return res.status(400).json({ ok:false });
  const msgs = (await kvGet('chat:' + uid)) || [];
  res.json({ ok:true, messages: msgs });
});
app.post('/api/admin/chat/send', adminAuth, async (req, res) => {
  const b = req.body || {};
  const uid = String(b.uid || ''); const text = String(b.text || '').trim().slice(0, 500);
  if (!uid || !text) return res.status(400).json({ ok:false });
  const msgs = (await kvGet('chat:' + uid)) || [];
  msgs.push({ from:'admin', text, ts: Date.now() });
  if (msgs.length > 200) msgs.splice(0, msgs.length - 200);
  await kvSet('chat:' + uid, msgs);
  const convs = (await kvGet('chat:index')) || [];
  const c = convs.find(x => x.uid === uid);
  if (c){ c.lastText = text; c.lastTs = Date.now(); }
  await kvSet('chat:index', convs);
  res.json({ ok:true });
});

/* EXPORT / IMPORT */
app.get('/api/admin/export', adminAuth, async (req, res) => {
  const configOnly = req.query.configOnly === '1';
  const data = { version:'7.0', exportedAt: new Date().toISOString() };
  data.features = await getFeatures();
  data.plans = await getPlans();
  data.settings = await getSettings();
  data.broadcast = await kvGet('config:broadcast');
  if (!configOnly){
    const users = []; for (const k of await kvKeys('user:')){ const u = await kvGet(k); if (u) users.push(u); }
    const tokens = []; for (const k of await kvKeys('token:')){ const t = await kvGet(k); if (t) tokens.push(t); }
    const payments = []; for (const k of await kvKeys('payment:')){ const p = await kvGet(k); if (p) payments.push(p); }
    data.users = users; data.tokens = tokens; data.payments = payments;
  }
  res.json({ ok:true, data });
});
app.post('/api/admin/import', adminAuth, async (req, res) => {
  const b = req.body || {};
  const mode = b.mode === 'replace' ? 'replace' : 'merge';
  const d = b.data || {};
  let imported = 0;
  if (mode === 'replace'){
    for (const k of await kvKeys('user:')) await kvDel(k);
    for (const k of await kvKeys('token:')) await kvDel(k);
    for (const k of await kvKeys('payment:')) await kvDel(k);
    for (const k of await kvKeys('pay_utr:')) await kvDel(k);
  }
  if (Array.isArray(d.features)){ await kvSet('config:features', d.features); imported++; }
  if (Array.isArray(d.plans)){ await kvSet('config:plans', d.plans); imported++; }
  if (d.settings){ await kvSet('config:settings', d.settings); imported++; }
  if (d.broadcast){ await kvSet('config:broadcast', d.broadcast); imported++; }
  if (Array.isArray(d.users)){ for (const u of d.users) if (u && u.id){ await kvSet('user:' + u.id, u); imported++; } }
  if (Array.isArray(d.tokens)){ for (const t of d.tokens) if (t && t.token){ await kvSet('token:' + t.token, t); imported++; } }
  if (Array.isArray(d.payments)){ for (const p of d.payments) if (p && p.orderId){ await kvSet('payment:' + p.orderId, p); if (p.utr) await kvSet('pay_utr:' + p.utr, p.orderId); imported++; } }
  res.json({ ok:true, imported, mode });
});

app.post('/api/admin/change-pass', adminAuth, async (req, res) => {
  const np = String((req.body||{}).newPass||''); if (!np) return res.status(400).json({ ok:false });
  await kvSet('admin:creds', { u: CFG.ADMIN_U, p: hashPass(np) }); res.json({ ok:true });
});
app.post('/api/admin/kill-sessions', adminAuth, async (req, res) => {
  for (const k of await kvKeys('sess:')) await kvDel(k);
  clearCookie(res, CFG.COOKIE); res.json({ ok:true });
});

/* ============================================================
   404 + START
   ============================================================ */
app.use((req, res) => res.status(404).send('404 · BRONX ULTRA'));

app.listen(CFG.PORT, () => {
  console.log('════════════════════════════════════════════════════');
  console.log('  BRONX ULTRA v7.0 · @BRONX_ULTRA');
  console.log('  Port: ' + CFG.PORT);
  console.log('  Storage: ' + ((CFG.KV_URL && CFG.KV_TOKEN) ? 'UPSTASH REDIS' : 'IN-MEMORY'));
  console.log('  ✓ Custom API · Guest Mode · Chat · Analytics');
  console.log('════════════════════════════════════════════════════');
});
