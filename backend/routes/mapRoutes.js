const express = require('express');
const router = express.Router();
const axios = require('axios');

const REST_KEY = process.env.MAPPLS_REST_KEY;

// ===== 1. PLACE SEARCH using Nominatim (OpenStreetMap) =====
// Nominatim is free, no API key needed, and has excellent India coverage
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.json({ suggestions: [] });
        }

        // Use Nominatim for geocoding/search
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8&countrycodes=in`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'YatraSetuApp/1.0'  // Required by Nominatim
            }
        });

        const suggestions = (response.data || []).map(loc => ({
            placeName: loc.name || loc.display_name.split(',')[0] || '',
            placeAddress: loc.display_name || '',
            lat: Number(loc.lat),
            lng: Number(loc.lon),
            type: loc.type || loc.class || ''
        })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));

        res.json({ suggestions });
    } catch (error) {
        console.error('Search API Error:', error.message);
        res.json({ suggestions: [] });
    }
});

// ===== 2. ROUTE (Driving Directions via Mappls) =====
router.get('/route', async (req, res) => {
    try {
        // Use OSRM for reliable, free, and fast road-following routes
        // OSRM expects {lng,lat;lng,lat} format for coordinates
        const url = `http://router.project-osrm.org/route/v1/driving/${pts}?overview=full&geometries=polyline6`;

        console.log("Backend: Fetching road route from OSRM:", url);
        const response = await axios.get(url);

        // Transform OSRM response to match expected format if needed
        // OSRM returns geometry as a polyline6 string in routes[0].geometry
        res.json(response.data);
    } catch (error) {
        console.error('Route API Error (OSRM Fallback):', error.message);
        res.status(500).json({ error: 'Failed to fetch road route from OSRM', details: error.message });
    }
});

module.exports = router;
