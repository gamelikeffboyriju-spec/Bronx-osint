from flask import Flask, jsonify, request
import requests
import json
import re

app = Flask(__name__)

# Branding
MY_BRANDING = "@BRONX_ULTRA"

# --- 🔍 MAIL SEARCH ---
@app.route('/mail/<email_id>')
def get_mail_info(email_id):
    try:
        source_url = f"https://trial-api-ybh8.vercel.app/email/{email_id}"
        response = requests.get(source_url, timeout=15)
        json_match = re.search(r'Results:\s*(\[.*\])', response.text, re.DOTALL)
        if json_match:
            return jsonify({
                "status": "success",
                "developer": MY_BRANDING,
                "results": json.loads(json_match.group(1))
            })
        return jsonify({"status": "error", "message": "No mail data found"}), 404
    except:
        return jsonify({"status": "error", "message": "System Fault"}), 500

# --- 🔍 TELEGRAM SEARCH ---
@app.route('/tg/<id>')
def tg_search(id):
    try:
        resp = requests.get(f"http://45.91.248.51:3000/api/tgnum?id={id}", timeout=10)
        data = resp.json()
        if data.get("SUCCESS"):
            return jsonify({"status": "success", "developer": MY_BRANDING, "result": data.get("RESULT")})
        return jsonify({"status": "error", "message": "Not found"}), 404
    except:
        return jsonify({"status": "error", "message": "TG API Offline"}), 500

# --- 🔍 ADHAR SEARCH ---
@app.route('/adhar/<id>')
def adhar_search(id):
    try:
        resp = requests.get(f"https://trial-api-ybh8.vercel.app/aadhaar/{id}", timeout=10)
        match = re.search(r'\[\s*{.*}\s*\]', resp.text, re.DOTALL)
        if match:
            return jsonify({"status": "success", "developer": MY_BRANDING, "results": json.loads(match.group(0))})
        return jsonify({"status": "error", "message": "Adhar not found"}), 404
    except:
        return jsonify({"status": "error", "message": "Server Error"}), 500

# --- 🔍 NUMBER SEARCH ---
@app.route('/num/<num>')
def num_search(num):
    try:
        resp = requests.get(f"https://dark-osint-number-api.vercel.app/?num={num}", timeout=10)
        data = resp.json()
        if data.get("status") == "success":
            return jsonify({"status": "success", "developer": MY_BRANDING, "data": data.get("data")})
        return jsonify({"status": "error", "message": "Number not found"}), 404
    except:
        return jsonify({"status": "error", "message": "Number API error"}), 500

# Home route for testing
@app.route('/')
def home():
    return f"BRONX API IS ONLINE ✅ | Developer: {MY_BRANDING}"

# Vercel handler
def handler(request):
    return app(request)
