from flask import Flask, jsonify, request
import requests
import json
import re

app = Flask(__name__)

# Flask ko keys alphabetically sort karne se rokne ke liye
app.json.sort_keys = False

MY_BRANDING = "@BRONX_ULTRA"

@app.route('/')
def home():
    return f"🚀 Bronx Ultimate API is Online\nDeveloped by {MY_BRANDING}", 200, {'Content-Type': 'text/plain'}

# --- 🔍 MAIL SEARCH ENGINE ---
@app.route('/mail/<email_id>')
def get_mail_info(email_id):
    source_url = f"https://trial-api-ybh8.vercel.app/email/{email_id}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        response = requests.get(source_url, headers=headers, timeout=15)
        raw_text = response.text
        # Regex to find JSON inside the "Results:" text
        json_match = re.search(r'Results:\s*(\[.*\])', raw_text, re.DOTALL)

        if json_match:
            raw_results = json.loads(json_match.group(1))
            return jsonify({
                "developer": MY_BRANDING,
                "status": "success",
                "total_found": len(raw_results),
                "results": raw_results
            })
        return jsonify({"status": "error", "message": "No data found", "developer": MY_BRANDING}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- 🔍 AADHAAR SEARCH ---
@app.route('/adhar/<id>')
def adhar_search(id):
    try:
        resp = requests.get(f"https://trial-api-ybh8.vercel.app/aadhaar/{id}", timeout=10)
        match = re.search(r'\[\s*{.*}\s*\]', resp.text, re.DOTALL)
        if match:
            return jsonify({"status": "success", "results": json.loads(match.group(0)), "developer": MY_BRANDING})
        return jsonify({"status": "error", "message": "No data found"}), 404
    except:
        return jsonify({"status": "error", "message": "Server Error"}), 500

# --- 🔍 TELEGRAM SEARCH ---
@app.route('/tg/<id>')
def tg_search(id):
    try:
        resp = requests.get(f"http://45.91.248.51:3000/api/tgnum?id={id}", timeout=10)
        data = resp.json()
        if data.get("SUCCESS"):
            return jsonify({"status": "success", "result": data.get("RESULT"), "developer": MY_BRANDING})
        return jsonify({"status": "error", "message": "Not found"}), 404
    except:
        return jsonify({"status": "error", "message": "API Down"}), 500

# Vercel requires the app instance
def handler(request):
    return app(request)
