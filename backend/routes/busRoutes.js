const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const SeatLock = require('../models/SeatLock');
const Booking = require('../models/Booking');

const { MOCK_BUSES } = require('../data/mockData');

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
        return res.json(["Bengaluru", "Delhi", "Jaipur", "Kota", "Mangaluru", "Mysuru", "Pune"]);
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
        const { from, to, date } = req.query;
        console.log(`🔍 [DEMO SEARCH] from=${from}, to=${to}, date=${date}`);

        let filtered = MOCK_BUSES;
        if (from) filtered = filtered.filter(b => b.route.from.toLowerCase().includes(from.toLowerCase()));
        if (to) filtered = filtered.filter(b => b.route.to.toLowerCase().includes(to.toLowerCase()));
        if (date) {
            const datesArray = date.split(',');
            filtered = filtered.filter(b => datesArray.includes(b.date));
        }

        console.log(`✨ [DEMO RESULT] Found ${filtered.length} buses`);
        return res.json(filtered);
    }
    const { from, to, date } = req.query;
    try {
        const query = {};
        if (from) query['route.from'] = new RegExp(from, 'i');
        if (to) query['route.to'] = new RegExp(to, 'i');
        if (date) {
            query['date'] = { $in: date.split(',') };
            query['bookedDates'] = { $nin: date.split(',') };
        }
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

// Lock seat
router.post('/:id/lock', async (req, res) => {
    const { seatNumber, lockerId } = req.body;
    if (mongoose.connection.readyState !== 1) {
        // In demo mode, we'll just simulate a successful lock
        // unless we want to keep track of it in memory
        const bus = MOCK_BUSES.find(b => b._id === req.params.id);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        if (!bus.activeLocks) bus.activeLocks = [];
        const existing = bus.activeLocks.find(l => l.seatNumber === seatNumber);
        if (existing && existing.lockerId !== lockerId) {
            return res.json({ message: "Seat already locked" });
        }

        if (!existing) {
            bus.activeLocks.push({ seatNumber, lockerId });
        }
        return res.json({ message: "Seat locked", lockerId });
    }
    try {
        const lock = await SeatLock.findOneAndUpdate(
            { busId: req.params.id, seatNumber },
            { lockerId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }, // 10 mins
            { upsert: true, new: true }
        );
        res.json({ message: 'Seat locked', lock });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Unlock seat
router.post('/:id/unlock', async (req, res) => {
    const { seatNumber, lockerId } = req.body;
    if (mongoose.connection.readyState !== 1) {
        const bus = MOCK_BUSES.find(b => b._id === req.params.id);
        if (bus && bus.activeLocks) {
            bus.activeLocks = bus.activeLocks.filter(l => !(l.seatNumber === seatNumber && l.lockerId === lockerId));
        }
        return res.json({ message: "Seat unlocked" });
    }
    try {
        await SeatLock.findOneAndDelete({ busId: req.params.id, seatNumber, lockerId });
        res.json({ message: 'Seat unlocked' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
