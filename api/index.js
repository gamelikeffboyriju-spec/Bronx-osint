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
            0%,100%{box-shadow:0 0 30px #ff00ff,0 0 60px #ff00ff66}
            25%{box-shadow:0 0 40px #ff4444,0 0 80px #ff444466}
            50%{box-shadow:0 0 50px #ffff00,0 0 100px #ffff0066}
            75%{box-shadow:0 0 40px #00ff88,0 0 80px #00ff8866}
        }
        body{
            background:linear-gradient(135deg,#0a0a0a 0%,#1a0020 100%);
            font-family:'Segoe UI',monospace;
            color:#fff;
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        }
        .card{
            background:#0a0a0aee;
            border:3px solid #ff00ff;
            border-radius:30px;
            padding:50px 40px;
            text-align:center;
            backdrop-filter:blur(10px);
            animation:glowPulse 4s infinite;
            max-width:900px;
        }
        h1{
            font-size:64px;
            font-weight:900;
            background:linear-gradient(45deg,#ff00ff,#ff4444,#ffff00,#00ff88);
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
            margin-bottom:10px;
        }
        .api-box{
            background:#111;
            border:2px solid #ffff00;
            border-radius:20px;
            padding:30px;
            margin:30px 0;
            box-shadow:0 0 30px #ffff0033;
        }
        .api-url{
            font-family:monospace;
            font-size:18px;
            color:#00ff88;
            background:#0a0a0a;
            padding:15px;
            border-radius:15px;
            border:1px solid #00ff8866;
            margin:20px 0;
            word-break:break-all;
        }
        .copy-btn{
            background:linear-gradient(135deg,#ff00ff,#ff4444);
            color:#fff;
            border:none;
            padding:15px 40px;
            font-size:18px;
            font-weight:bold;
            border-radius:50px;
            cursor:pointer;
            box-shadow:0 0 30px #ff00ff66;
        }
        .copy-btn:hover{
            transform:scale(1.05);
            box-shadow:0 0 50px #ff00ff;
        }
        .owner-badge{
            background:linear-gradient(135deg,#ff00ff33,#ff444433);
            border:2px solid #ff00ff;
            padding:12px 30px;
            border-radius:50px;
            font-size:20px;
            font-weight:bold;
            color:#ff88ff;
            text-shadow:0 0 15px #ff00ff;
            margin-top:20px;
        }
        input{
            background:#0a0a0a;
            border:2px solid #ff00ff;
            color:#fff;
            padding:15px 20px;
            font-size:18px;
            border-radius:50px;
            width:200px;
            text-align:center;
            margin:10px;
        }
        .try-btn{
            background:linear-gradient(135deg,#00ff88,#00ffff);
            color:#0a0a0a;
            border:none;
            padding:12px 30px;
            font-size:16px;
            font-weight:bold;
            border-radius:50px;
            cursor:pointer;
            margin:15px;
        }
        pre{
            background:#000;
            padding:20px;
            border-radius:15px;
            overflow-x:auto;
            font-size:12px;
            border:2px solid #ff00ff;
            text-align:left;
        }
        .toast{
            position:fixed;
            bottom:30px;
            right:30px;
            background:linear-gradient(135deg,#ff00ff,#ff4444);
            color:#fff;
            padding:15px 30px;
            border-radius:50px;
            font-weight:bold;
            box-shadow:0 0 40px #ff00ff;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🔥 BRONX TG NUM</h1>
        <div style="color:#aaa;margin-bottom:10px;">Telegram ID to Number API</div>
        
        <div class="api-box">
            <div style="color:#aaa;">🌐 API ENDPOINT</div>
            <div class="api-url" id="apiUrl">https://bronx-osint-tg.vercel.app/api/search?id=7530266953</div>
            <button class="copy-btn" onclick="copyUrl()">📋 COPY URL</button>
        </div>
        
        <div style="background:#0a0a0a;border:2px solid #00ffff;border-radius:20px;padding:25px;margin:30px 0;">
            <div style="color:#00ffff;margin-bottom:15px;">🔍 TRY IT NOW</div>
            <input type="text" id="telegramId" placeholder="Telegram ID" value="7530266953">
            <button class="try-btn" onclick="tryApi()">🚀 FETCH</button>
            <div id="resultBox" style="display:none;margin-top:20px;">
                <pre id="result">Loading...</pre>
            </div>
        </div>
        
        <div class="owner-badge">
            👑 OWNER: @BRONX_ULTRA
        </div>
        <div style="margin-top:20px;color:#888;">⚡ Powered by @BRONX_ULTRA</div>
    </div>
    
    <script>
        function copyUrl(){
            navigator.clipboard.writeText(document.getElementById('apiUrl').innerText);
            showToast('✅ URL COPIED!');
        }
        async function tryApi(){
            const id=document.getElementById('telegramId').value;
            const box=document.getElementById('resultBox');
            const pre=document.getElementById('result');
            box.style.display='block';
            pre.innerHTML='⏳ Loading...';
            try{
                const res=await fetch('/api/search?id='+id);
                const data=await res.json();
                pre.innerHTML=JSON.stringify(data,null,2);
            }catch(e){
                pre.innerHTML='❌ Error: '+e.message;
            }
        }
        function showToast(m){
            const t=document.createElement('div');
            t.className='toast';
            t.innerHTML=m;
            document.body.appendChild(t);
            setTimeout(()=>t.remove(),3000);
        }
        window.onload=tryApi;
    </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
};
