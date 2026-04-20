export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID is required" });

    try {
        const response = await fetch(`http://45.91.248.51:3000/api/tgnum?id=${id}`);
        const data = await response.json();
        
        if (data.SUCCESS) {
            return res.json({
                SUCCESS: true,
                RESULT: data.RESULT,
                "OWNER": "@BRONX_ULTRA"
            });
        }
        res.json({ SUCCESS: false, MESSAGE: "No data found" });
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
}
