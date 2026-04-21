from flask import Flask, request, jsonify, render_template_string
import asyncio
from telethon import TelegramClient
from telethon.errors import UsernameNotOccupiedError, FloodWaitError
import time
import os

app = Flask(__name__)

# --- CONFIGURATION ---
OWNER_TAG = "@BRONX_ULTRA"
CREDIT = "BRONX_ULTRA"
DEVELOPER = "BRONX_ULTRA"

# Telegram API Credentials (my.telegram.org se lo)
API_ID = 12345678  # Apna API ID dalo
API_HASH = "your_api_hash_here"  # Apna API Hash dalo

# Telethon Client (Session file banegi)
client = TelegramClient('bronx_session', 31968824, d9847a6694b961248f4052d16b89b912)

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
            https://{{ host }}/chatid?username=BRONX_ULTRA<br>
            https://{{ host }}/chatid?username=@BRONX_ULTRA
        </div>
        <footer>Developed by {{ owner }} | Privacy Protected ✅</footer>
    </div>
</body>
</html>
"""

async def get_entity_info(username):
    """Get user/channel info using Telethon"""
    try:
        clean_username = username.replace("@", "")
        
        # Resolve username to entity
        entity = await client.get_entity(f"@{clean_username}")
        
        result = {
            "chat_id": entity.id,
            "username": getattr(entity, 'username', None),
            "type": "unknown"
        }
        
        # Check entity type
        if hasattr(entity, 'title'):
            result["type"] = "channel" if entity.broadcast else "supergroup"
            result["title"] = entity.title
        elif hasattr(entity, 'first_name'):
            result["type"] = "user" if not entity.bot else "bot"
            result["first_name"] = entity.first_name
            result["last_name"] = getattr(entity, 'last_name', None)
        
        # Additional info
        result["phone"] = getattr(entity, 'phone', None)
        result["is_bot"] = getattr(entity, 'bot', False)
        result["is_verified"] = getattr(entity, 'verified', False)
        
        return {"success": True, "data": result}
        
    except UsernameNotOccupiedError:
        return {"success": False, "message": f"Username @{clean_username} not found"}
    except FloodWaitError as e:
        return {"success": False, "message": f"Flood wait: {e.seconds} seconds"}
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}

@app.route('/')
def home():
    return render_template_string(DASHBOARD_HTML, host=request.host, owner=OWNER_TAG)

@app.route('/chatid')
def chatid_lookup():
    username = request.args.get('username', '').strip()
    
    if not username:
        return jsonify({
            "status": "error",
            "message": "Missing 'username' parameter",
            "credit": CREDIT
        }), 400
    
    # Ensure client is connected
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Connect if not already
        if not client.is_connected():
            loop.run_until_complete(client.start())
        
        # Get entity info
        result = loop.run_until_complete(get_entity_info(username))
        
        if result["success"]:
            return jsonify({
                "status": "success",
                "credit": CREDIT,
                "developer": DEVELOPER,
                "data": result["data"]
            })
        else:
            return jsonify({
                "status": "error",
                "message": result["message"],
                "credit": CREDIT
            }), 404
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}",
            "credit": CREDIT
        }), 500

@app.route('/setup')
def setup_info():
    return jsonify({
        "status": "info",
        "credit": CREDIT,
        "steps": [
            "1. Go to https://my.telegram.org",
            "2. Login with fake account",
            "3. Go to API Development Tools",
            "4. Create Application",
            "5. Copy API ID and API Hash",
            "6. Update app.py with your credentials"
        ]
    })

if __name__ == "__main__":
    # First time login
    print("Starting Telegram Client...")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(client.start())
    print("✅ Client Connected!")
    
    app.run(host='0.0.0.0', port=5000)
