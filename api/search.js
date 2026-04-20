const axios = require('axios');

module.exports = async (req, res) => {
    const { id } = req.query;
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Check if ID is provided
    if (!id) {
        return res.status(400).json({
            SUCCESS: false,
            ERROR: '❌ Missing "id" parameter',
            EXAMPLE: '/search?id=7530266953',
            OWNER: '@BRONX_ULTRA'
        });
    }
    
    try {
        // Fetch from upstream API
        const response = await axios.get(`http://45.91.48.51:3000/api/tgnum?id=${id}`, {
            timeout: 30000,
            headers: {
                'User-Agent': 'BRONX-OSINT/2.0'
            }
        });
        
        const data = response.data;
        
        // Replace Owner and API BY with @BRONX_ULTRA
        if (data) {
            data.Owner = '@BRONX_ULTRA';
            data['API BY'] = '@BRONX_ULTRA';
            
            // Also add a powered_by field
            data.POWERED_BY = '@BRONX_ULTRA';
        }
        
        return res.status(200).json(data);
        
    } catch (error) {
        console.error('Error fetching data:', error.message);
        
        return res.status(500).json({
            SUCCESS: false,
            ERROR: '❌ Failed to fetch data from upstream API',
            DETAILS: error.message,
            OWNER: '@BRONX_ULTRA'
        });
    }
};
