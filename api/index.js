export default function handler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const searchParams = url.searchParams;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    // HOME
    if (path === '/') {
        return res.status(200).json({
            status: "online",
            owner: "@BRONX_ULTRA",
            endpoints: [
                "/tg?id=7530266953",
                "/adhar?id=533970021520",
                "/num?num=9876543210"
            ]
        });
    }

    // TG
    if (path === '/tg') {
        const id = searchParams.get('id');
        if (!id) return res.status(200).json({ error: "?id= required", owner: "@BRONX_ULTRA" });
        
        return fetch(`http://45.91.48.51:3000/api/tgnum?id=${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.SUCCESS) {
                    res.status(200).json({
                        SUCCESS: true,
                        RESULT: data.RESULT,
                        Owner: "@BRONX_ULTRA",
                        "API BY": "@BRONX_ULTRA"
                    });
                } else {
                    res.status(200).json({ SUCCESS: false, Owner: "@BRONX_ULTRA" });
                }
            })
            .catch(() => res.status(200).json({ error: "API down", owner: "@BRONX_ULTRA" }));
        return;
    }

    // AADHAAR
    if (path === '/adhar' || path === '/aadhaar') {
        const id = searchParams.get('id');
        if (!id) return res.status(200).json({ error: "?id= required", owner: "@BRONX_ULTRA" });
        
        return fetch(`https://trial-api-ybh.vercel.app/aadhaar/${id}`)
            .then(r => r.text())
            .then(text => {
                const match = text.match(/Results: \[(.*)\]/s);
                if (match && match[1]) {
                    try {
                        const results = JSON.parse(`[${match[1]}]`);
                        res.status(200).json(results);
                    } catch(e) {
                        res.status(200).json([]);
                    }
                } else {
                    res.status(200).json([]);
                }
            })
            .catch(() => res.status(200).json({ error: "API down", owner: "@BRONX_ULTRA" }));
        return;
    }

    // NUMBER
    if (path === '/num') {
        const num = searchParams.get('num');
        if (!num) return res.status(200).json({ error: "?num= required", owner: "@BRONX_ULTRA" });
        
        return fetch(`https://dak-osint-number-api.vercel.app/?num=${num}`)
            .then(r => r.json())
            .then(data => {
                if (data.status === "success" && data.data) {
                    res.status(200).json({
                        status: "success",
                        data: data.data,
                        owner: "@BRONX_ULTRA"
                    });
                } else {
                    res.status(200).json({ status: "error", owner: "@BRONX_ULTRA" });
                }
            })
            .catch(() => res.status(200).json({ error: "API down", owner: "@BRONX_ULTRA" }));
        return;
    }

    // 404
    return res.status(200).json({ 
        error: "Route not found. Use /tg, /adhar, or /num", 
        owner: "@BRONX_ULTRA" 
    });
}
