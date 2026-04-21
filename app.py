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

# Environment Variables
API_ID = int(os.environ.get('31968824', '0'))
API_HASH = os.environ.get('d9847a6694b961248f4052d16b89b912', '')

# Session file
SESSION_PATH = '/tmp/bronx_session'

# Telethon Client
client = TelegramClient(SESSION_PATH, API_ID, API_HASH)

# --- DASHBOARD HTML ---
DASHBOARD_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>BRONX ULTRA CHAT ID API</title>
    <style>
        body { background: #050505; color: #00aaff; font-family: 'Courier New', monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { border: 1px solid #00aaff; padding: 30px; border-radius: 10px; box-shadow: 0 0 15px #00aaff; text-align: center; }
        h1 { color: #00aaff; }
        .url { background: #111; padding: 10px; border-radius: 5px; color: #ffaa00; }
        footer { margin-top: 20px; color: #555; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🆔 BRONX ULTRA CHAT ID API</h1>
        <p class="info">Username to Telegram Chat ID</p>
        <div class="url">
            📌 /chatid?username=BRONX_ULTRA
        </div>
        <footer>Developed by {{ owner }}</footer>
    </div>
</body>
</html>
"""

async def ensure_connected():
    if not client.is_connected():
        await client.connect()
        if not await client.is_user_authorized():
            await client.start()
            print("✅ Client Connected & Authorized!")

@app.route('/')
def home():
    return render_template_string(DASHBOARD_HTML, owner=OWNER_TAG)

@app.route('/chatid')
async def chatid_lookup():
    username = request.args.get('username', '').strip()
    
    if not username:
        return jsonify({"status": "error", "message": "Missing username", "credit": CREDIT}), 400
    
    try:
        await ensure_connected()
        
        clean_username = username.replace("@", "")
        entity = await client.get_entity(f"@{clean_username}")
        
        result = {
            "chat_id": entity.id,
            "username": getattr(entity, 'username', None),
        }
        
        if hasattr(entity, 'title'):
            result["type"] = "channel" if entity.broadcast else "group"
            result["title"] = entity.title
        else:
            result["type"] = "user" if not entity.bot else "bot"
            result["first_name"] = entity.first_name
            result["last_name"] = getattr(entity, 'last_name', None)
        
        return jsonify({
            "status": "success",
            "credit": CREDIT,
            "developer": DEVELOPER,
            "data": result
        })
        
    except UsernameNotOccupiedError:
        return jsonify({"status": "error", "message": f"@{clean_username} not found", "credit": CREDIT}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e), "credit": CREDIT}), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
