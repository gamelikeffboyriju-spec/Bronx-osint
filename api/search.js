const axios = require('axios');

module.exports = async (req, res) => {
    const { id } = req.query;
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (!id) {
        return res.status(400).json({
            SUCCESS: false,
            ERROR: 'Missing "id" parameter',
            EXAMPLE: '/api/search?id=7530266953',
            Owner: '@BRONX_ULTRA',
            'API BY': '@BRONX_ULTRA'
        });
    }
    
    try {
        const response = await axios.get(`http://45.91.248.51:3000/api/tgnum?id=${id}`, {
            timeout: 30000
        });
        
        const data = response.data;
        
        // Replace with @BRONX_ULTRA
        data.Owner = '@BRONX_ULTRA';
        data['API BY'] = '@BRONX_ULTRA';
        data.POWERED_BY = '@BRONX_ULTRA';
        
        return res.status(200).json(data);
        
    } catch (error) {
        return res.status(500).json({
            SUCCESS: false,
            ERROR: 'Failed to fetch data',
            Owner: '@BRONX_ULTRA',
            'API BY': '@BRONX_ULTRA'
        });
    }
};
