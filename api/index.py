from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

API_URL = "https://dark-osint-number-api.vercel.app/"

@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>@BRONX_ULTRA OSINT</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                background: linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: 'Courier New', monospace;
                padding: 20px;
            }
            .container {
                background: rgba(10, 10, 20, 0.95);
                border: 2px solid #ff0055;
                border-radius: 20px;
                padding: 40px 30px;
                max-width: 600px;
                width: 100%;
                box-shadow: 0 0 60px rgba(255, 0, 85, 0.3);
                text-align: center;
            }
            h1 {
                font-size: 2.8rem;
                font-weight: 900;
                background: linear-gradient(45deg, #ff0055, #ff6600);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                margin-bottom: 10px;
                letter-spacing: 3px;
            }
            .brand {
                color: #ff0055;
                font-size: 1.4rem;
                margin-bottom: 30px;
                border-bottom: 1px solid #ff005544;
                padding-bottom: 15px;
            }
            .search-box {
                display: flex;
                gap: 10px;
                margin: 30px 0;
            }
            input {
                flex: 1;
                padding: 15px 20px;
                background: #0a0a15;
                border: 1.5px solid #2a2a40;
                border-radius: 50px;
                font-size: 1.1rem;
                color: #fff;
                outline: none;
            }
            input:focus {
                border-color: #ff0055;
                box-shadow: 0 0 15px #ff005555;
            }
            button {
                padding: 15px 30px;
                background: #ff0055;
                color: white;
                border: none;
                border-radius: 50px;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                transition: 0.3s;
            }
            button:hover {
                background: #ff3366;
                box-shadow: 0 0 20px #ff0055;
            }
            .result {
                background: #0a0a15;
                border: 1px solid #2a2a40;
                border-radius: 15px;
                padding: 20px;
                text-align: left;
                max-height: 400px;
                overflow-y: auto;
                margin-top: 20px;
                display: none;
            }
            .result pre {
                color: #00ff88;
                font-family: 'Courier New', monospace;
                font-size: 0.9rem;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .endpoint {
                color: #888;
                margin-top: 20px;
                font-size: 0.9rem;
            }
            code {
                background: #1a1a2e;
                padding: 5px 10px;
                border-radius: 20px;
                color: #ff0055;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>BRONX ULTRA</h1>
            <div class="brand">⚡ @BRONX_ULTRA ⚡</div>
            
            <div class="search-box">
                <input type="text" id="numberInput" placeholder="Enter Mobile Number" value="9212757715">
                <button onclick="searchNumber()">SEARCH</button>
            </div>
            
            <div class="result" id="resultBox">
                <pre id="resultText">Loading...</pre>
            </div>
            
            <div class="endpoint">
                <code>GET /lookup?num=9212757715</code><br>
                <code>GET /api/num?num=9212757715</code>
            </div>
        </div>
        
        <script>
            async function searchNumber() {
                const num = document.getElementById('numberInput').value.trim();
                const resultBox = document.getElementById('resultBox');
                const resultText = document.getElementById('resultText');
                
                if (!num) {
                    alert('Please enter a number');
                    return;
                }
                
                resultBox.style.display = 'block';
                resultText.style.color = '#00ff88';
                resultText.textContent = 'Searching for ' + num + '...';
                
                try {
                    const response = await fetch('/lookup?num=' + encodeURIComponent(num));
                    const data = await response.json();
                    resultText.textContent = JSON.stringify(data, null, 2);
                } catch (error) {
                    resultText.style.color = '#ff0055';
                    resultText.textContent = 'Error: ' + error.message;
                }
            }
            
            // Enter key support
            document.getElementById('numberInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') searchNumber();
            });
            
            // Auto search on load if default value exists
            window.onload = function() {
                if (document.getElementById('numberInput').value) {
                    searchNumber();
                }
            };
        </script>
    </body>
    </html>
    '''

@app.route('/lookup')
@app.route('/api/num')  # Dono routes support karega
def lookup():
    number = request.args.get('num', '').strip()
    
    if not number:
        return jsonify({
            "error": "Number parameter required. Use ?num=9212757715",
            "brand": "@BRONX_ULTRA",
            "example": "/lookup?num=9212757715"
        }), 400

    try:
        res = requests.get(f"{API_URL}?num={number}", timeout=10)
        data = res.json()

        # Remove all @DarkOwnerX4 branding
        remove_fields = ['status', 'branding', 'developer', 'processed_by', 'owner_contact', 'api_owner']
        for field in remove_fields:
            data.pop(field, None)

        # Add @BRONX_ULTRA branding
        data['brand'] = '@BRONX_ULTRA'
        data['powered_by'] = '@BRONX_ULTRA'
        data['search_number'] = number

        return jsonify(data)

    except Exception as e:
        return jsonify({
            "error": str(e),
            "brand": "@BRONX_ULTRA",
            "search_number": number
        }), 500

def handler(request, context):
    return app(request.environ, lambda x, y: None)
