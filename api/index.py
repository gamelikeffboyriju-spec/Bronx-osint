from flask import Flask, request, jsonify
import requests
import re

app = Flask(__name__)

# Branding Constant
MY_BRANDING = "@BRONX_ULTRA"

@app.route('/')
def home():
    return jsonify({"message": "Bronx Multi-API is running!", "owner": MY_BRANDING})

# 1. Telegram API Proxy
@app.route('/tg')
def tg_search():
    tg_id = request.args.get('id')
    if not tg_id:
        return jsonify({"success": False, "message": "ID missing"}), 400
    
    try:
        resp = requests.get(f"http://45.91.248.51:3000/api/tgnum?id={tg_id}", timeout=10)
        data = resp.json()
        
        if data.get("SUCCESS"):
            return jsonify({
                "SUCCESS": True,
                "RESULT": data.get("RESULT"),
                "OWNER": MY_BRANDING,
                "API BY": MY_BRANDING
            })
    except:
        pass
    return jsonify({"success": False, "message": "No data found"}), 404

# 2. Aadhaar API Proxy
@app.route('/adhar')
def adhar_search():
    adhar_id = request.args.get('id')
    if not adhar_id:
        return jsonify({"success": False, "message": "Aadhaar ID missing"}), 400
    
    try:
        resp = requests.get(f"https://trial-api-ybh8.vercel.app/aadhaar/{adhar_id}", timeout=10)
        text_data = resp.text
        
        # Regex to extract only JSON array from the messy text
        match = re.search(r'\[\s*{.*}\s*\]', text_data, re.DOTALL)
        if match:
            results = eval(match.group(0)) # Converting string list to python list
            return jsonify({
                "SUCCESS": True,
                "RESULTS": results,
                "OWNER": MY_BRANDING
            })
    except:
        pass
    return jsonify({"success": False, "message": "Aadhaar data not found"}), 404

# 3. Number API Proxy
@app.route('/num')
def num_search():
    num = request.args.get('num')
    if not num:
        return jsonify({"success": False, "message": "Number missing"}), 400
    
    try:
        resp = requests.get(f"https://dark-osint-number-api.vercel.app/?num={num}", timeout=10)
        data = resp.json()
        
        if data.get("status") == "success":
            return jsonify({
                "SUCCESS": True,
                "RESULTS_COUNT": data.get("results_count"),
                "DATA": data.get("data"),
                "OWNER": MY_BRANDING
            })
    except:
        pass
    return jsonify({"success": False, "message": "Number info not found"}), 404

# Vercel function handler
def handler(request):
    return app(request)
