const express = require('express');
const router = express.Router();
const axios = require('axios');

const REST_KEY = process.env.MAPPLS_REST_KEY;

// Plot Route between points
router.get('/route', async (req, res) => {
    try {
        const { pts } = req.query; // Expecting coordinates in "start_lon,start_lat;waypoint1_lon,waypoint1_lat;end_lon,end_lat" format
        if (!pts) {
            return res.status(400).json({ error: "Points (pts) query parameter is required" });
        }

        const url = `https://apis.mappls.com/advancedmaps/v1/${REST_KEY}/route_adv/driving/${pts}?steps=true&overview=full`;
        const response = await axios.get(url);

        res.json(response.data);
    } catch (error) {
        console.error('Mappls Route API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch route data' });
    }
});

// Fetch Markers / Points of Interest
router.get('/markers', async (req, res) => {
    try {
        // Mocking marker data for now, could be stored in DB or fetched from Mappls eLoc API
        const markers = [
            { id: 'origin', name: 'Starting Point', lat: 12.9716, lon: 77.5946, icon: 'start' },
            { id: 'dest', name: 'Destination', lat: 12.2958, lon: 76.6394, icon: 'end' }
        ];
        res.json(markers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch markers' });
    }
});

module.exports = router;
