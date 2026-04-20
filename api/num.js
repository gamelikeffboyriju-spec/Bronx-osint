export default async function handler(req, res) {
    const { num } = req.query;
    if (!num) return res.status(400).json({ error: "Number is required" });

    try {
        const response = await fetch(`https://dark-osint-number-api.vercel.app/?num=${num}`);
        const data = await response.json();
        
        if (data.status === "success") {
            return res.json({
                SUCCESS: true,
                RESULTS_COUNT: data.results_count,
                DATA: data.data,
                "OWNER": "@BRONX_ULTRA"
            });
        }
        res.json({ SUCCESS: false, MESSAGE: "Number not found" });
    } catch (e) {
        res.status(500).json({ error: "Number API Error" });
    }
}
