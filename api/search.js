export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const query = Object.fromEntries(url.searchParams);

    // Route handling
    try {
        // ========== TG API ==========
        if (path.includes('/tg')) {
            const { id } = query;
            
            if (!id) {
                return res.json({
                    SUCCESS: false,
                    ERROR: "ID parameter required. Use /tg?id=123456789",
                    Owner: "@BRONX_ULTRA",
                    "API BY": "@BRONX_ULTRA"
                });
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(`http://45.91.248.51:3000/api/tgnum?id=${id}`, {
                    signal: controller.signal
                });
                clearTimeout(timeout);
                const data = await response.json();

                if (data.SUCCESS) {
                    return res.json({
                        SUCCESS: true,
                        RESULT: data.RESULT,
                        Owner: "@BRONX_ULTRA",
                        "API BY": "@BRONX_ULTRA"
                    });
                } else {
                    return res.json({
                        SUCCESS: false,
                        ERROR: "User not found",
                        Owner: "@BRONX_ULTRA",
                        "API BY": "@BRONX_ULTRA"
                    });
                }
            } catch (e) {
                clearTimeout(timeout);
                return res.json({
                    SUCCESS: false,
                    ERROR: "API timeout or error",
                    Owner: "@BRONX_ULTRA",
                    "API BY": "@BRONX_ULTRA"
                });
            }
        }

        // ========== AADHAAR API ==========
        else if (path.includes('/adhar') || path.includes('/aadhaar')) {
            const { id } = query;
            
            if (!id) {
                return res.json({
                    status: "error",
                    message: "Aadhaar number required. Use /adhar?id=XXXXXXXXXXXX",
                    owner: "@BRONX_ULTRA"
                });
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(`https://trial-api-ybh8.vercel.app/aadhaar/${id}`, {
                    signal: controller.signal
                });
                clearTimeout(timeout);
                const text = await response.text();
                
                const jsonMatch = text.match(/Results: \[(.*)\]/s);
                
                if (jsonMatch && jsonMatch[1]) {
                    try {
                        const results = JSON.parse(`[${jsonMatch[1]}]`);
                        return res.json(results);
                    } catch (e) {
                        return res.json({
                            status: "error",
                            message: "Failed to parse data",
                            owner: "@BRONX_ULTRA"
                        });
                    }
                } else {
                    return res.json({
                        status: "error",
                        message: "No data found",
                        owner: "@BRONX_ULTRA"
                    });
                }
            } catch (e) {
                clearTimeout(timeout);
                return res.json({
                    status: "error",
                    message: "API timeout",
                    owner: "@BRONX_ULTRA"
                });
            }
        }

        // ========== NUMBER API ==========
        else if (path.includes('/num')) {
            const { num } = query;
            
            if (!num) {
                return res.json({
                    status: "error",
                    message: "Number required. Use /num?num=XXXXXXXXXX",
                    owner: "@BRONX_ULTRA"
                });
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(`https://dark-osint-number-api.vercel.app/?num=${num}`, {
                    signal: controller.signal
                });
                clearTimeout(timeout);
                const data = await response.json();

                if (data.status === "success" && data.data) {
                    return res.json({
                        status: "success",
                        data: data.data,
                        owner: "@BRONX_ULTRA"
                    });
                } else {
                    return res.json({
                        status: "error",
                        message: "No data found",
                        owner: "@BRONX_ULTRA"
                    });
                }
            } catch (e) {
                clearTimeout(timeout);
                return res.json({
                    status: "error",
                    message: "API timeout",
                    owner: "@BRONX_ULTRA"
                });
            }
        }

        // ========== HOME PAGE ==========
        else {
            return res.json({
                message: "BRONX ULTRA OSINT API",
                owner: "@BRONX_ULTRA",
                endpoints: {
                    tg: "/tg?id=7530266953",
                    adhar: "/adhar?id=533970021520",
                    num: "/num?num=9876543210"
                },
                example: {
                    tg: "https://bronx-osint-tg.vercel.app/tg?id=7530266953",
                    adhar: "https://bronx-osint-tg.vercel.app/adhar?id=533970021520",
                    num: "https://bronx-osint-tg.vercel.app/num?num=9876543210"
                }
            });
        }

    } catch (error) {
        return res.status(200).json({
            status: "error",
            message: "Server error",
            owner: "@BRONX_ULTRA"
        });
    }
}
