const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const SeatLock = require('../models/SeatLock');
const Booking = require('../models/Booking');

// Mock data for Demo Mode
const MOCK_BUSES = [
    {
        _id: "demo-bus-1",
        busNumber: "KA-01-F-1234",
        operator: "KSRTC",
        route: {
            from: "Bengaluru",
            to: "Mysuru",
            stops: [
                { name: "Bengaluru Central", lat: 12.9716, lng: 77.5946 },
                { name: "Mandya", lat: 12.5221, lng: 76.8967 },
                { name: "Mysuru", lat: 12.2958, lng: 76.6394 }
            ]
        },
        departureTime: "06:30",
        arrivalTime: "09:15",
        type: "Express",
        totalSeats: 42,
        availableSeats: 12,
        km: 145,
        status: "On Time",
        price: 180,
        bookedSeats: [5, 6, 12, 14],
        activeLocks: []
    },
    {
        _id: "demo-bus-2",
        busNumber: "DL-01-A-4122",
        operator: "Yatra Setu Pro",
        route: {
            from: "Delhi",
            to: "Jaipur",
            stops: [
                { name: "ISBT Kashmere Gate", lat: 28.6675, lng: 77.2282 },
                { name: "Gurugram", lat: 28.4595, lng: 77.0266 },
                { name: "Jaipur", lat: 26.9124, lng: 75.7873 }
            ]
        },
        departureTime: "10:00",
        arrivalTime: "15:30",
        type: "Volvo AC",
        totalSeats: 52,
        availableSeats: 28,
        km: 270,
        status: "Delayed 15m",
        price: 850,
        bookedSeats: [1, 2, 10],
        activeLocks: []
    }
];

// Get all buses
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json(MOCK_BUSES);
    }
    try {
        const buses = await Bus.find();
        res.json(buses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get unique city names
router.get('/cities', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json(["Bengaluru", "Delhi", "Jaipur", "Mangaluru", "Mysuru", "Pune"]);
    }
    try {
        const fromCities = await Bus.distinct('route.from');
        const toCities = await Bus.distinct('route.to');
        const cities = Array.from(new Set([...fromCities, ...toCities])).sort();
        res.json(cities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Search buses
router.get('/search', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        const { from, to } = req.query;
        let filtered = MOCK_BUSES;
        if (from) filtered = filtered.filter(b => b.route.from.toLowerCase().includes(from.toLowerCase()));
        if (to) filtered = filtered.filter(b => b.route.to.toLowerCase().includes(to.toLowerCase()));
        return res.json(filtered);
    }
    const { from, to, date } = req.query;
    try {
        const query = {};
        if (from) query['route.from'] = new RegExp(from, 'i');
        if (to) query['route.to'] = new RegExp(to, 'i');
        if (date) query['date'] = { $in: date.split(',') };
        const buses = await Bus.find(query);
        res.json(buses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single bus by ID
router.get('/by-id/:id', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        const bus = MOCK_BUSES.find(b => b._id === req.params.id) || MOCK_BUSES[0];
        return res.json(bus);
    }
    try {
        const bus = await Bus.findById(req.params.id).lean();
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        const locks = await SeatLock.find({ busId: req.params.id });
        bus.activeLocks = locks.map(l => ({ seatNumber: l.seatNumber, lockerId: l.lockerId }));
        const confirmedBookings = await Booking.find({ bus: req.params.id, paymentStatus: 'Completed' });
        const bookedSeatsArray = confirmedBookings.reduce((acc, b) => {
            return [...acc, ...b.passengers.map(p => parseInt(p.seatNumber))];
        }, []);
        bus.bookedSeats = Array.from(new Set(bookedSeatsArray));
        res.json(bus);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
