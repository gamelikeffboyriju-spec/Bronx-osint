from flask import Flask, request, jsonify, render_template_string
import asyncio
from telethon import TelegramClient
from telethon.errors import UsernameNotOccupiedError, FloodWaitError
import os

app = Flask(__name__)

# --- CONFIGURATION ---
OWNER_TAG = "@BRONX_ULTRA"
CREDIT = "BRONX_ULTRA"
DEVELOPER = "BRONX_ULTRA"

# Environment Variables se lo (Render pe set karenge)
API_ID = int(os.environ.get('API_ID', '31968824'))
API_HASH = os.environ.get('API_HASH', 'd9847a6694b961248f4052d16b89b912')

# Session file path
SESSION_PATH = '/tmp/bronx_session'

# Telethon Client
client = TelegramClient(SESSION_PATH, API_ID, API_HASH)

# --- DASHBOARD HTML ---
DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRONX ULTRA CHAT ID API</title>
    <style>
        body { background: #050505; color: #00aaff; font-family: 'Courier New', Courier, monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { border: 1px solid #00aaff; padding: 30px; border-radius: 10px; box-shadow: 0 0 15px #00aaff; text-align: center; max-width: 650px; }
        h1 { font-size: 24px; margin-bottom: 10px; color: #00aaff; }
        .status { color: #fff; background: #00aaff; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
        .info { color: #ccc; font-size: 14px; margin: 20px 0; }
        .url { background: #111; padding: 10px; border-radius: 5px; color: #ffaa00; word-break: break-all; font-size: 13px; }
        footer { margin-top: 20px; font-size: 12px; color: #555; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🆔 BRONX ULTRA CHAT ID API</h1>
        <span class="status">Status: ONLINE ✅</span>
        <p class="info">Username to Telegram Chat ID (User Account)</p>
        <div class="url">
            📌 <b>How to Use:</b><br>
            https://{{ host }}/chatid?username=BRONX_ULTRA
        </div>
        <footer>Developed by {{ owner }} | Privacy Protected ✅</footer>
    </div>
</body>
</html>
"""

# Initialize client at startup
@app.before_request
async def ensure_connected():
    if not client.is_connected():
        await client.start()
        print("✅ Client Connected!")

@app.route('/')
def home():
    return render_template_string(DASHBOARD_HTML, host=request.host, owner=OWNER_TAG)

@app.route('/chatid')
async def chatid_lookup():
    username = request.args.get('username', '').strip()
    
    if not username:
        return jsonify({
            "status": "error",
            "message": "Missing 'username' parameter",
            "credit": CREDIT
        }), 400
    
    try:
        clean_username = username.replace("@", "")
        
        # Ensure connected
        if not client.is_connected():
            await client.start()
        
        # Get entity
        entity = await client.get_entity(f"@{clean_username}")
        
        result = {
            "chat_id": entity.id,
            "username": getattr(entity, 'username', None),
        }
        
        # Check type
        if hasattr(entity, 'title'):
            result["type"] = "channel" if entity.broadcast else "group"
            result["title"] = entity.title
        else:
            result["type"] = "user" if not entity.bot else "bot"
            result["first_name"] = entity.first_name
            result["last_name"] = getattr(entity, 'last_name', None)
        
        result["is_bot"] = getattr(entity, 'bot', False)
        result["is_verified"] = getattr(entity, 'verified', False)
        result["phone"] = getattr(entity, 'phone', None)
        
        return jsonify({
            "status": "success",
            "credit": CREDIT,
            "developer": DEVELOPER,
            "data": result
        })
        
    except UsernameNotOccupiedError:
        return jsonify({
            "status": "error",
            "message": f"Username @{clean_username} not found",
            "credit": CREDIT
        }), 404
    except FloodWaitError as e:
        return jsonify({
            "status": "error",
            "message": f"Flood wait: {e.seconds}s",
            "credit": CREDIT
        }), 429
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "credit": CREDIT
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
