module.exports = (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 BRONX TG NUM API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 30px #ff00ff, 0 0 60px #ff00ff66; }
            25% { box-shadow: 0 0 40px #ff4444, 0 0 80px #ff444466; }
            50% { box-shadow: 0 0 50px #ffff00, 0 0 100px #ffff0066; }
            75% { box-shadow: 0 0 40px #00ff88, 0 0 80px #00ff8866; }
        }
        
        @keyframes textGlow {
            0%, 100% { text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff; }
            25% { text-shadow: 0 0 20px #ff4444, 0 0 40px #ff4444; }
            50% { text-shadow: 0 0 20px #ffff00, 0 0 40px #ffff00; }
            75% { text-shadow: 0 0 20px #00ff88, 0 0 40px #00ff88; }
        }
        
        body {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0020 100%);
            font-family: 'Segoe UI', 'Courier New', monospace;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            max-width: 900px;
            width: 100%;
        }
        
        .card {
            background: #0a0a0aee;
            border: 3px solid #ff00ff;
            border-radius: 30px;
            padding: 50px 40px;
            text-align: center;
            backdrop-filter: blur(10px);
            animation: glowPulse 4s infinite;
        }
        
        h1 {
            font-size: 64px;
            font-weight: 900;
            letter-spacing: 5px;
            animation: textGlow 3s infinite;
            background: linear-gradient(45deg, #ff00ff, #ff4444, #ffff00, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 18px;
            color: #ffffffcc;
            margin-bottom: 40px;
            text-shadow: 0 0 10px #ff00ff;
        }
        
        .api-box {
            background: #111111;
            border: 2px solid #ffff00;
            border-radius: 20px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 0 30px #ffff0033;
        }
        
        .api-url {
            font-family: 'Courier New', monospace;
            font-size: 22px;
            color: #00ff88;
            word-break: break-all;
            background: #0a0a0a;
            padding: 15px 20px;
            border-radius: 15px;
            border: 1px solid #00ff8866;
            margin: 20px 0;
        }
        
        .copy-btn {
            background: linear-gradient(135deg, #ff00ff, #ff4444);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 0 30px #ff00ff66;
            transition: all 0.3s;
            margin: 10px;
        }
        
        .copy-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 50px #ff00ff;
        }
        
        .example-box {
            background: #0a0a0a;
            border: 2px solid #00ffff;
            border-radius: 20px;
            padding: 25px;
            margin: 30px 0;
            box-shadow: 0 0 30px #00ffff33;
        }
        
        .example-title {
            color: #00ffff;
            font-size: 18px;
            margin-bottom: 15px;
            text-shadow: 0 0 10px #00ffff;
        }
        
        .example-code {
            background: #000000;
            padding: 20px;
            border-radius: 15px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #ffff88;
            overflow-x: auto;
            text-align: left;
            border: 1px solid #ffff0033;
        }
        
        .owner-badge {
            display: inline-block;
            background: linear-gradient(135deg, #ff00ff33, #ff444433);
            border: 2px solid #ff00ff;
            padding: 12px 30px;
            border-radius: 50px;
            font-size: 20px;
            font-weight: bold;
            color: #ff88ff;
            text-shadow: 0 0 15px #ff00ff;
            margin-top: 20px;
        }
        
        .footer {
            margin-top: 40px;
            color: #ffffff88;
            font-size: 14px;
        }
        
        .footer a {
            color: #ff88ff;
            text-decoration: none;
        }
        
        .try-btn {
            background: linear-gradient(135deg, #00ff88, #00ffff);
            color: #0a0a0a;
            border: none;
            padding: 12px 30px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 0 20px #00ff8866;
            transition: all 0.3s;
            margin-top: 15px;
        }
        
        .try-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 40px #00ff88;
        }
        
        #resultBox {
            display: none;
            margin-top: 30px;
        }
        
        pre {
            background: #000;
            padding: 20px;
            border-radius: 15px;
            overflow-x: auto;
            font-size: 12px;
            border: 2px solid #ff00ff;
        }
        
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #ff00ff, #ff4444);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: bold;
            box-shadow: 0 0 40px #ff00ff;
            animation: slideIn 0.3s;
            z-index: 1000;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        input {
            background: #0a0a0a;
            border: 2px solid #ff00ff;
            color: white;
            padding: 15px 20px;
            font-size: 18px;
            border-radius: 50px;
            width: 100%;
            max-width: 300px;
            text-align: center;
            margin: 10px;
        }
        
        input:focus {
            outline: none;
            border-color: #ffff00;
            box-shadow: 0 0 30px #ffff0066;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>🔥 BRONX TG NUM</h1>
            <div class="subtitle">Telegram ID to Number API</div>
            
            <div class="api-box">
                <div style="font-size: 14px; color: #aaa; margin-bottom: 10px;">🌐 API ENDPOINT</div>
                <div class="api-url" id="apiUrl">https://tg-num-api-bronx.vercel.app/search?id=7530266953</div>
                <button class="copy-btn" onclick="copyUrl()">📋 COPY URL</button>
            </div>
            
            <div class="example-box">
                <div class="example-title">🔍 TRY IT NOW</div>
                <input type="text" id="telegramId" placeholder="Enter Telegram ID" value="7530266953">
                <br>
                <button class="try-btn" onclick="tryApi()">🚀 FETCH DATA</button>
                
                <div id="resultBox">
                    <div style="color: #00ff88; margin: 15px 0;">📤 RESPONSE:</div>
                    <pre id="result"></pre>
                </div>
            </div>
            
            <div class="example-box">
                <div class="example-title">📋 EXAMPLE RESPONSE</div>
                <div class="example-code">{
  "SUCCESS": true,
  "RESULT": {
    "BASIC_INFO": {
      "ID": 7530266953,
      "FIRST_NAME": "𝄟͢🦋⃟ADITYA-FIRE≛⃝ 𝄟⃝♠",
      "USERNAMES_COUNT": 3,
      "NAMES_COUNT": 5
    },
    "STATUS_INFO": {
      "IS_BOT": false,
      "IS_ACTIVE": true
    },
    "NUMBER_INFO": {
      "NUMBER": "9934846958",
      "COUNTRY_CODE": "+91",
      "COUNTRY": "India"
    }
  },
  "Owner": "@BRONX_ULTRA",
  "API BY": "@BRONX_ULTRA",
  "POWERED_BY": "@BRONX_ULTRA"
}</div>
            </div>
            
            <div class="owner-badge">
                👑 OWNER: @BRONX_ULTRA
            </div>
        </div>
        
        <div class="footer">
            <p>⚡ TG NUM API v1.0 | Powered by <a href="https://t.me/BRONX_ULTRA">@BRONX_ULTRA</a></p>
            <p style="margin-top: 10px; opacity: 0.7;">© 2026 Bronx Intelligence</p>
        </div>
    </div>
    
    <script>
        function copyUrl() {
            const url = document.getElementById('apiUrl').innerText;
            navigator.clipboard.writeText(url).then(() => {
                showToast('✅ URL COPIED!');
            });
        }
        
        async function tryApi() {
            const id = document.getElementById('telegramId').value;
            if (!id) {
                showToast('❌ Please enter a Telegram ID');
                return;
            }
            
            const resultBox = document.getElementById('resultBox');
            const resultPre = document.getElementById('result');
            
            resultPre.innerHTML = '⏳ Loading...';
            resultBox.style.display = 'block';
            
            try {
                const response = await fetch('/search?id=' + id);
                const data = await response.json();
                resultPre.innerHTML = JSON.stringify(data, null, 2);
                
                // Syntax highlighting
                let html = resultPre.innerHTML;
                html = html.replace(/"([^"]+)":/g, '<span style="color: #79c0ff;">"$1"</span>:');
                html = html.replace(/: "([^"]*)"/g, ': <span style="color: #a5d6ff;">"$1"</span>');
                html = html.replace(/: (\\d+)/g, ': <span style="color: #79c0ff;">$1</span>');
                html = html.replace(/: (true|false)/g, ': <span style="color: #ff7b72;">$1</span>');
                resultPre.innerHTML = html;
            } catch (error) {
                resultPre.innerHTML = '❌ Error: ' + error.message;
            }
        }
        
        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
        
        // Try API on page load
        window.onload = function() {
            tryApi();
        };
    </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
};
