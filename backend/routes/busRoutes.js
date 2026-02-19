const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');

// Get all buses
router.get('/', async (req, res) => {
    try {
        const buses = await Bus.find();
        res.json(buses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Search buses by route and date
router.get('/search', async (req, res) => {
    const { from, to, date } = req.query;
    try {
        const query = {};
        if (from) query['route.from'] = new RegExp(from, 'i');
        if (to) query['route.to'] = new RegExp(to, 'i');

        const buses = await Bus.find(query);
        res.json(buses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seed some data (Utility route)
router.post('/seed', async (req, res) => {
    const buses = [
        { busNumber: "KA-01-F-1234", operator: "KSRTC", route: { from: "Bengaluru", to: "Mysuru", stops: ["Mandya"] }, departureTime: "06:30", arrivalTime: "09:15", type: "Express", totalSeats: 42, availableSeats: 12, km: 145, status: "On Time", price: 180 },
        { busNumber: "KA-01-F-5678", operator: "KSRTC", route: { from: "Mysuru", to: "Bengaluru", stops: ["Ramanagara"] }, departureTime: "07:00", arrivalTime: "09:45", type: "Ordinary", totalSeats: 42, availableSeats: 3, km: 145, status: "Delayed 10 min", price: 120 },
        { busNumber: "KA-01-F-9012", operator: "KSRTC", route: { from: "Bengaluru", to: "Mangaluru", stops: ["Hassan", "Sakleshpur"] }, departureTime: "07:30", arrivalTime: "13:00", type: "Volvo AC", totalSeats: 52, availableSeats: 28, km: 352, status: "On Time", price: 750 },
    ];

    try {
        await Bus.deleteMany({});
        const createdBuses = await Bus.insertMany(buses);
        res.json(createdBuses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
