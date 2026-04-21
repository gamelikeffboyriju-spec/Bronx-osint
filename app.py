from flask import Flask, request, jsonify, render_template_string
import requests
import time
import re

app = Flask(__name__)

# --- CONFIGURATION ---
OWNER_TAG = "@BRONX_ULTRA"
CREDIT = "BRONX_ULTRA"
DEVELOPER = "BRONX_ULTRA"

# Bot Token - BotFather se milega
BOT_TOKEN = "8695953327:AAH83JCMTJrG1GxvyLR-fIj3nAGl8zHL7Tw"  # BotFather se token leke yaha dalo

# Telegram API Base URL
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

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
        .warning { color: #ffaa00; font-size: 12px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🆔 BRONX ULTRA CHAT ID API</h1>
        <span class="status">Status: ONLINE ✅</span>
        <p class="info">Username to Telegram Chat ID Converter</p>
        <div class="url">
            📌 <b>How to Use:</b><br>
            https://{{ host }}/chatid?username=BRONX_ULTRA<br>
            https://{{ host }}/chatid?username=@BRONX_ULTRA
        </div>
        <div class="warning">⚠️ Bot Token Required - Get from @BotFather</div>
        <footer>Developed by {{ owner }} | Privacy Protected ✅</footer>
    </div>
</body>
</html>
"""

def get_chat_id_via_getupdates(username):
    """Get chat ID by checking recent messages using getUpdates"""
    try:
        # Get recent updates
        resp = requests.get(f"{TELEGRAM_API}/getUpdates", timeout=10)
        data = resp.json()
        
        if data.get("ok") and data.get("result"):
            # Search for messages from the username
            clean_username = username.replace("@", "").lower()
            
            for update in data["result"]:
                # Check message from user
                if "message" in update:
                    msg = update["message"]
                    chat = msg.get("chat", {})
                    from_user = msg.get("from", {})
                    
                    # Check username match
                    if from_user.get("username", "").lower() == clean_username:
                        return {
                            "chat_id": chat.get("id"),
                            "type": chat.get("type"),
                            "first_name": from_user.get("first_name"),
                            "last_name": from_user.get("last_name"),
                            "username": from_user.get("username")
                        }
                    
                    # Check if username in chat title
                    if chat.get("username", "").lower() == clean_username:
                        return {
                            "chat_id": chat.get("id"),
                            "type": chat.get("type"),
                            "title": chat.get("title"),
                            "username": chat.get("username")
                        }
                
                # Check channel post
                if "channel_post" in update:
                    post = update["channel_post"]
                    chat = post.get("chat", {})
                    if chat.get("username", "").lower() == clean_username:
                        return {
                            "chat_id": chat.get("id"),
                            "type": chat.get("type"),
                            "title": chat.get("title"),
                            "username": chat.get("username")
                        }
        
        return None
    except:
        return None

def get_chat_id_direct(username):
    """Try direct getChat method"""
    try:
        clean_username = username.replace("@", "")
        resp = requests.get(f"{TELEGRAM_API}/getChat?chat_id=@{clean_username}", timeout=10)
        data = resp.json()
        
        if data.get("ok"):
            result = data.get("result", {})
            return {
                "chat_id": result.get("id"),
                "type": result.get("type"),
                "title": result.get("title") or result.get("first_name"),
                "username": result.get("username")
            }
        return None
    except:
        return None

def get_chat_id_via_forward(username):
    """Alternative: Use bot's own info to check"""
    try:
        clean_username = username.replace("@", "").lower()
        
        # Get bot's info first
        me_resp = requests.get(f"{TELEGRAM_API}/getMe", timeout=10)
        if me_resp.json().get("ok"):
            bot_username = me_resp.json()["result"]["username"]
            
            # Try getUpdates with limit
            resp = requests.get(f"{TELEGRAM_API}/getUpdates?limit=100", timeout=10)
            data = resp.json()
            
            if data.get("ok"):
                for update in data["result"]:
                    # Check all possible places for username
                    update_str = str(update).lower()
                    if clean_username in update_str:
                        # Extract chat ID using regex
                        chat_id_match = re.search(r"'id':\s*(-?\d+)", str(update))
                        if chat_id_match:
                            return {
                                "chat_id": int(chat_id_match.group(1)),
                                "username": username,
                                "note": "Found in updates"
                            }
        
        return None
    except:
        return None

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
    
    # Remove @ if present
    clean_username = username.replace("@", "")
    
    try:
        # Try Method 1: Direct getChat (works for channels/supergroups)
        result = get_chat_id_direct(clean_username)
        
        if result:
            return jsonify({
                "status": "success",
                "credit": CREDIT,
                "developer": DEVELOPER,
                "method": "direct",
                "data": result
            })
        
        # Try Method 2: getUpdates scanning
        result = get_chat_id_via_getupdates(clean_username)
        
        if result:
            return jsonify({
                "status": "success",
                "credit": CREDIT,
                "developer": DEVELOPER,
                "method": "updates_scan",
                "data": result
            })
        
        # Try Method 3: Alternative scan
        result = get_chat_id_via_forward(clean_username)
        
        if result:
            return jsonify({
                "status": "success",
                "credit": CREDIT,
                "developer": DEVELOPER,
                "method": "alternative",
                "data": result
            })
        
        # No result found
        return jsonify({
            "status": "error",
            "message": f"Could not find Chat ID for @{clean_username}. Make sure the user/channel has interacted with the bot.",
            "credit": CREDIT,
            "hint": "Send a message to the bot or add bot to the channel/group"
        }), 404
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}",
            "credit": CREDIT
        }), 500

@app.route('/setup')
def setup_guide():
    """Guide to setup bot token"""
    return jsonify({
        "status": "info",
        "credit": CREDIT,
        "message": "How to get Bot Token",
        "steps": [
            "1. Open Telegram and search @BotFather",
            "2. Send /newbot and follow instructions",
            "3. Copy the token you receive",
            "4. Replace BOT_TOKEN in app.py with your token",
            "5. Send a message to your bot (important!)",
            "6. Redeploy the API"
        ]
    })

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
