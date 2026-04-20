export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Aadhaar number is required" });

    try {
        const response = await fetch(`https://trial-api-ybh8.vercel.app/aadhaar/${id}`);
        const rawText = await response.text();
        
        // JSON nikalne ke liye logic kyuki source API mein text mix hai
        const jsonMatch = rawText.match(/\[\s*{[\s\S]*}\s*\]/);
        
        if (jsonMatch) {
            const results = JSON.parse(jsonMatch[0]);
            return res.json({
                SUCCESS: true,
                RESULTS: results,
                "OWNER": "@BRONX_ULTRA"
            });
        }
        res.json({ SUCCESS: false, MESSAGE: "No data found or invalid format" });
    } catch (e) {
        res.status(500).json({ error: "Error parsing Aadhaar data" });
    }
}
