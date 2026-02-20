const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const SeatLock = require('../models/SeatLock');
const Booking = require('../models/Booking');

// Get all buses
router.get('/', async (req, res) => {
    try {
        const buses = await Bus.find();
        res.json(buses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get unique city names for suggestions
router.get('/cities', async (req, res) => {
    try {
        const fromCities = await Bus.distinct('route.from');
        const toCities = await Bus.distinct('route.to');
        const cities = Array.from(new Set([...fromCities, ...toCities])).sort();
        res.json(cities);
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

        if (date) {
            const dates = date.split(',');
            query['date'] = { $in: dates };
        }

        const buses = await Bus.find(query);
        res.json(buses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single bus by busNumber
router.get('/:busNumber', async (req, res) => {
    try {
        const bus = await Bus.findOne({ busNumber: req.params.busNumber });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        res.json(bus);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single bus by MongoDB ID
router.get('/by-id/:id', async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id).lean();
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        // Fetch active locks for this bus
        const locks = await SeatLock.find({ busId: req.params.id });
        bus.activeLocks = locks.map(l => ({ seatNumber: l.seatNumber, lockerId: l.lockerId }));

        // Fetch real bookings for this bus to show occupied seats
        const confirmedBookings = await Booking.find({
            bus: req.params.id,
            paymentStatus: 'Completed'
        });

        // Flatten all seatNumbers from all passenger lists in all bookings
        const bookedSeatsArray = confirmedBookings.reduce((acc, b) => {
            const seats = b.passengers.map(p => parseInt(p.seatNumber));
            return [...acc, ...seats];
        }, []);

        bus.bookedSeats = Array.from(new Set(bookedSeatsArray));

        res.json(bus);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Lock a seat
router.post('/:id/lock', async (req, res) => {
    try {
        const { seatNumber, lockerId } = req.body;
        const lock = new SeatLock({
            busId: req.params.id,
            seatNumber,
            lockerId
        });
        await lock.save();
        res.status(201).json(lock);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Seat already locked' });
        }
        res.status(500).json({ message: err.message });
    }
});

// Unlock a seat
router.post('/:id/unlock', async (req, res) => {
    try {
        const { seatNumber, lockerId } = req.body;
        await SeatLock.deleteOne({
            busId: req.params.id,
            seatNumber,
            lockerId
        });
        res.json({ message: 'Seat unlocked' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update bus route and stops
router.patch('/:busNumber/route', async (req, res) => {
    try {
        const { from, to, stops } = req.body;
        const bus = await Bus.findOneAndUpdate(
            { busNumber: req.params.busNumber },
            {
                $set: {
                    'route.from': from,
                    'route.to': to,
                    'route.stops': stops
                }
            },
            { new: true }
        );
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        res.json(bus);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Seed some data (Utility route)
router.post('/seed', async (req, res) => {
    const buses = [
        {
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
            price: 180
        },
        {
            busNumber: "KA-01-F-5678",
            operator: "KSRTC",
            route: {
                from: "Mysuru",
                to: "Bengaluru",
                stops: [
                    { name: "Mysuru", lat: 12.2958, lng: 76.6394 },
                    { name: "Ramanagara", lat: 12.7209, lng: 77.2781 },
                    { name: "Bengaluru Central", lat: 12.9716, lng: 77.5946 }
                ]
            },
            departureTime: "07:00",
            arrivalTime: "09:45",
            type: "Ordinary",
            totalSeats: 42,
            availableSeats: 3,
            km: 145,
            status: "Delayed 10 min",
            price: 120
        },
        {
            busNumber: "KA-01-F-9012",
            operator: "KSRTC",
            route: {
                from: "Bengaluru",
                to: "Mangaluru",
                stops: [
                    { name: "Bengaluru Central", lat: 12.9716, lng: 77.5946 },
                    { name: "Hassan", lat: 13.0072, lng: 76.1029 },
                    { name: "Sakleshpur", lat: 12.9723, lng: 75.7828 },
                    { name: "Mangaluru", lat: 12.9141, lng: 74.8560 }
                ]
            },
            departureTime: "07:30",
            arrivalTime: "13:00",
            type: "Volvo AC",
            totalSeats: 52,
            availableSeats: 28,
            km: 352,
            status: "On Time",
            price: 750
        },
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
