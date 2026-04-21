from flask import Flask, jsonify, request
import requests
import json
import re

app = Flask(__name__)

# Prevent Flask from sorting JSON keys alphabetically
app.config['JSON_SORT_KEYS'] = False
try:
    app.json.sort_keys = False
except AttributeError:
    pass

# --- 🏠 HOME PAGE ---
@app.route('/')
def home():
    welcome_msg = f"""
    🚀 BRONX ULTRA OSINT API
    Status: ONLINE ✅

    📌 Endpoints:
    TG Lookup     : /tg?id=7530266953
    Aadhaar Lookup: /adhar?id=533970021520
    Number Lookup : /num?num=9876543210

    Developed by @BRONX_ULTRA | Privacy Protected ✅
    """
    return welcome_msg, 200, {'Content-Type': 'text/plain; charset=utf-8'}

# --- 🔍 TELEGRAM NUMBER INFO ---
@app.route('/tg')
def tg_lookup():
    user_id = request.args.get('id')
    if not user_id:
        return jsonify({"SUCCESS": False, "ERROR": "Missing ?id=", "Owner": "@BRONX_ULTRA"})

    try:
        resp = requests.get(f'http://45.91.248.51:3000/api/tgnum?id={user_id}', timeout=10)
        data = resp.json()
        if data.get('SUCCESS'):
            return jsonify({
                "SUCCESS": True,
                "RESULT": data.get('RESULT'),
                "Owner": "@BRONX_ULTRA",
                "API BY": "@BRONX_ULTRA"
            })
        else:
            return jsonify({"SUCCESS": False, "Owner": "@BRONX_ULTRA"})
    except Exception as e:
        return jsonify({"SUCCESS": False, "ERROR": "API Timeout", "Owner": "@BRONX_ULTRA"})

# --- 🔍 AADHAAR INFO (CLEAN ARRAY ONLY) ---
@app.route('/adhar')
@app.route('/aadhaar')
def aadhaar_lookup():
    uid = request.args.get('id')
    if not uid:
        return jsonify({"error": "Missing ?id=", "owner": "@BRONX_ULTRA"})

    try:
        resp = requests.get(f'https://trial-api-ybh8.vercel.app/aadhaar/{uid}', timeout=15)
        text = resp.text
        # Extract the array part after "Results: "
        match = re.search(r'Results:\s*(\[.*\])', text, re.DOTALL)
        if match:
            results = json.loads(match.group(1))
            # Return only the array, as per user request
            return jsonify(results)
        else:
            return jsonify([])
    except Exception as e:
        return jsonify({"error": "API down", "owner": "@BRONX_ULTRA"})

# --- 🔍 MOBILE NUMBER INFO (HIDE BRANDING) ---
@app.route('/num')
def num_lookup():
    number = request.args.get('num')
    if not number:
        return jsonify({"error": "Missing ?num=", "owner": "@BRONX_ULTRA"})

    try:
        resp = requests.get(f'https://dark-osint-number-api.vercel.app/?num={number}', timeout=15)
        data = resp.json()
        if data.get('status') == 'success' and 'data' in data:
            # Return only success, data, owner (hiding developer/branding)
            return jsonify({
                "status": "success",
                "data": data['data'],
                "owner": "@BRONX_ULTRA"
            })
        else:
            return jsonify({"status": "error", "owner": "@BRONX_ULTRA"})
    except Exception as e:
        return jsonify({"status": "error", "owner": "@BRONX_ULTRA"})

# --- Vercel requires the app to be callable as `app` ---
# This file is used as `api/index.py`, Vercel automatically serves `app`.
