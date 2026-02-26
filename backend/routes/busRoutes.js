const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const SeatLock = require('../models/SeatLock');
const Booking = require('../models/Booking');

const { MOCK_BUSES, MOCK_OFFICIAL_BUSES } = require('../data/mockData');

// Helper to escape regex special characters
const escapeRegExp = (string) => {
    return string ? string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
};

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
        let filtered = MOCK_BUSES;
        if (from) filtered = filtered.filter(b => b.route.from.toLowerCase().includes(from.toLowerCase()));
        if (to) filtered = filtered.filter(b => b.route.to.toLowerCase().includes(to.toLowerCase()));
        if (date) {
            const datesArray = date.split(',');
            filtered = filtered.filter(b => datesArray.includes(b.date));
        }
        return res.json(filtered);
    }
    const { from, to, date } = req.query;
    try {
        const query = {};
        if (from) query['route.from'] = new RegExp(escapeRegExp(from), 'i');
        if (to) query['route.to'] = new RegExp(escapeRegExp(to), 'i');
        if (date) {
            query['date'] = { $in: date.split(',') };
            query['bookedDates'] = { $nin: date.split(',') };
        }
        const buses = await Bus.find(query).populate('owner', 'upiId');
        const formatted = buses.map(b => {
            const obj = b.toObject();
            obj.ownerUPI = obj.owner?.upiId || '8302391227-2@ybl';
            return obj;
        });
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all buses
router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json(MOCK_BUSES);
    }
    try {
        const buses = await Bus.find().populate('owner', 'upiId');
        const formatted = buses.map(b => {
            const obj = b.toObject();
            obj.ownerUPI = obj.owner?.upiId || '8302391227-2@ybl';
            return obj;
        });
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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
        const districts = await Bus.distinct('district', { state: new RegExp(`^${escapeRegExp(state)}$`, 'i') });
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
        if (state) query.state = new RegExp(`^${escapeRegExp(state)}$`, 'i');
        if (district) query.district = new RegExp(`^${escapeRegExp(district)}$`, 'i');
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

// Search official buses (school/college/office)
router.get('/official', async (req, res) => {
    const { state, district, town, pinCode, orgCategory, orgName } = req.query;
    if (mongoose.connection.readyState !== 1) {
        let result = MOCK_OFFICIAL_BUSES;
        if (state) result = result.filter(b => b.state.toLowerCase().includes(state.toLowerCase()) || state.toLowerCase().includes(b.state.toLowerCase()));
        if (district) result = result.filter(b => b.district.toLowerCase().includes(district.toLowerCase()) || district.toLowerCase().includes(b.district.toLowerCase()));
        if (town) result = result.filter(b => b.town.toLowerCase().includes(town.toLowerCase()) || town.toLowerCase().includes(b.town.toLowerCase()));
        if (orgName) result = result.filter(b => b.orgName.toLowerCase().includes(orgName.toLowerCase()) || orgName.toLowerCase().includes(b.orgName.toLowerCase()));

        if (pinCode && pinCode.length === 6) {
            const pinMatches = result.filter(b => b.pinCode === pinCode);
            if (pinMatches.length > 0) result = pinMatches;
        }
        return res.json(result);
    }
    try {
        const query = {};
        if (state) query.state = new RegExp(escapeRegExp(state), 'i');
        if (district) query.district = new RegExp(escapeRegExp(district), 'i');
        if (town) query.town = new RegExp(escapeRegExp(town), 'i');
        if (pinCode) query.pinCode = pinCode;
        if (orgCategory) query.orgCategory = orgCategory;
        if (orgName) query.orgName = new RegExp(escapeRegExp(orgName), 'i');

        const buses = await Bus.find(query);
        if (buses.length > 0) {
            res.json(buses);
        } else {
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

            if (p && p.length === 6) {
                const pinMatches = result.filter(b => b.pinCode === p);
                if (pinMatches.length > 0) result = pinMatches;
            }
            res.json(result);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single bus by ObjectId
router.get('/:id/route', async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id).lean();
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        res.json({ route: bus.route || { stops: [] } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/buses/:id/route
router.patch('/:id/route', async (req, res) => {
    const { from, to, stops } = req.body;
    try {
        const bus = await Bus.findByIdAndUpdate(
            req.params.id,
            { $set: { 'route.from': from, 'route.to': to, 'route.stops': stops || [] } },
            { new: true }
        );
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        res.json({ success: true, bus });
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
        const bus = await Bus.findById(req.params.id).populate('owner', 'upiId').lean();
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        bus.ownerUPI = bus.owner?.upiId || '8302391227-2@ybl';

        const tripDate = req.query.date ? new Date(req.query.date + 'T00:00:00') : new Date();
        const hrsDiff = (tripDate.getTime() - Date.now()) / (1000 * 60 * 60);

        if (hrsDiff <= 48 && bus.seats) {
            bus.seats = bus.seats.map(s => {
                if (s.reservedFor === 'elderly' || s.reservedFor === 'disabled') {
                    return { ...s, reservedFor: 'general', originalReservedFor: s.reservedFor };
                }
                return s;
            });
        }

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
        const bus = MOCK_BUSES.find(b => b._id === req.params.id);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        if (!bus.activeLocks) bus.activeLocks = [];
        const existing = bus.activeLocks.find(l => l.seatNumber === seatNumber);
        if (existing && existing.lockerId !== lockerId) {
            return res.json({ message: "Seat already locked" });
        }
        if (!existing) bus.activeLocks.push({ seatNumber, lockerId });
        return res.json({ message: "Seat locked", lockerId });
    }
    try {
        const lock = await SeatLock.findOneAndUpdate(
            { busId: req.params.id, seatNumber },
            { lockerId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
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
