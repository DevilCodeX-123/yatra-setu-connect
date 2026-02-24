const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const SeatLock = require('../models/SeatLock');
const Booking = require('../models/Booking');

const { MOCK_BUSES, MOCK_OFFICIAL_BUSES } = require('../data/mockData');

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

// GET /api/buses/official — search official buses (school/college/office)

// GET /api/buses/official/districts — get districts for a state
router.get('/official/districts', async (req, res) => {
    const { state } = req.query;
    if (!state) return res.status(400).json({ message: "State is required" });

    if (mongoose.connection.readyState !== 1) {
        const districts = Array.from(new Set(
            MOCK_OFFICIAL_BUSES
                .filter(b => b.state.toLowerCase().trim() === state.toLowerCase().trim())
                .map(b => b.district)
        )).sort();
        return res.json(districts);
    }
    try {
        const districts = await Bus.distinct('district', { state: new RegExp(`^${state}$`, 'i') });
        res.json(districts.filter(Boolean).sort());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/buses/official/names — get organization names
router.get('/official/names', async (req, res) => {
    const { state, district, orgCategory } = req.query;
    if (mongoose.connection.readyState !== 1) {
        let result = MOCK_OFFICIAL_BUSES;
        if (state) result = result.filter(b => b.state.toLowerCase() === state.toLowerCase());
        if (district) result = result.filter(b => b.district.toLowerCase() === district.toLowerCase());
        if (orgCategory) result = result.filter(b => b.orgCategory === orgCategory);

        const names = Array.from(new Set(result.map(b => b.orgName))).sort();
        return res.json(names);
    }
    try {
        const query = {};
        if (state) query.state = new RegExp(`^${state}$`, 'i');
        if (district) query.district = new RegExp(`^${district}$`, 'i');
        if (orgCategory) query.orgCategory = orgCategory;

        const names = await Bus.distinct('orgName', query);
        res.json(names.filter(Boolean).sort());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/buses/official/locations — get unique states
router.get('/official/locations', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        const states = Array.from(new Set(MOCK_OFFICIAL_BUSES.map(b => b.state))).sort();
        return res.json({ states });
    }
    try {
        const states = await Bus.distinct('state');
        res.json({ states: states.filter(Boolean).sort() });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Temporary Route to seed RTU Kota Bus - will be deleted after use
router.get('/official/seed-rtu', async (req, res) => {
    try {
        const rtuBus = {
            busNumber: 'RJ-20-C-7007',
            name: 'RTU Kota Shuttle',
            orgCategory: 'College',
            orgName: 'RTU Kota',
            state: 'Rajasthan',
            district: 'Kota',
            town: 'Kota',
            pinCode: '324010',
            activationCode: '123456',
            status: 'Active',
            liveLocation: { lat: 25.1311, lng: 75.8034, source: 'gps' },
            route: { from: 'Nayapura', to: 'RTU Campus' },
            type: 'Volvo',
            totalSeats: 40,
            pricePerKm: 1.5,
            date: new Date().toISOString().split('T')[0],
            seats: Array.from({ length: 40 }, (_, i) => ({
                number: i + 1,
                status: 'Available',
                reservedFor: 'general'
            }))
        };

        const doc = await Bus.findOneAndUpdate(
            { busNumber: rtuBus.busNumber },
            { $set: rtuBus },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: "RTU Kota Bus seeded!", bus: doc });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Search official buses (school/college/office)
router.get('/official', async (req, res) => {
    const { state, district, town, pinCode, orgCategory, orgName } = req.query;
    if (mongoose.connection.readyState !== 1) {
        let result = MOCK_OFFICIAL_BUSES;
        if (state) result = result.filter(b => b.state.toLowerCase().includes(state.toLowerCase()) || state.toLowerCase().includes(b.state.toLowerCase()));
        if (district) result = result.filter(b => b.district.toLowerCase().includes(district.toLowerCase()) || district.toLowerCase().includes(b.district.toLowerCase()));
        if (town) result = result.filter(b => b.town.toLowerCase().includes(town.toLowerCase()) || town.toLowerCase().includes(b.town.toLowerCase()));
        if (orgName) result = result.filter(b => b.orgName.toLowerCase().includes(orgName.toLowerCase()) || orgName.toLowerCase().includes(b.orgName.toLowerCase()));

        // Soft PIN filter: prioritize but don't fail search
        if (pinCode && pinCode.length === 6) {
            const pinMatches = result.filter(b => b.pinCode === pinCode);
            if (pinMatches.length > 0) result = pinMatches;
        }
        return res.json(result);
    }
    try {
        const query = {};
        if (state) query.state = new RegExp(state, 'i');
        if (district) query.district = new RegExp(district, 'i');
        if (town) query.town = new RegExp(town, 'i');
        if (pinCode) query.pinCode = pinCode;
        if (orgCategory) query.orgCategory = orgCategory;
        if (orgName) query.orgName = new RegExp(orgName, 'i');

        console.log('🔍 [OFFICIAL SEARCH QUERY]', query);
        const buses = await Bus.find(query);
        console.log(`✨ [OFFICIAL SEARCH RESULT] Found ${buses.length} buses`);

        if (buses.length > 0) {
            res.json(buses);
        } else {
            console.log('🔄 [DB EMPTY] Falling back to mock data...');
            let result = MOCK_OFFICIAL_BUSES;
            const s = (state || "").toLowerCase().trim();
            const d = (district || "").toLowerCase().trim();
            const c = (orgCategory || "").toLowerCase().trim();
            const n = (orgName || "").toLowerCase().trim();
            const p = (pinCode || "").trim();

            if (s) result = result.filter(b => b.state.toLowerCase().includes(s));
            if (d) result = result.filter(b => b.district.toLowerCase().includes(d));
            if (c) result = result.filter(b => (b.orgCategory || "").toLowerCase().includes(c));
            if (n) result = result.filter(b => (b.orgName || "").toLowerCase().includes(n));

            // Soft PIN filter: prioritize but don't fail search
            if (p && p.length === 6) {
                const pinMatches = result.filter(b => b.pinCode === p);
                if (pinMatches.length > 0) result = pinMatches;
            }

            console.log(`✨ [MOCK RESULT] Found ${result.length} buses`);
            res.json(result);
        }
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
