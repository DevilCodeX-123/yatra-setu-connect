const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Bus = require('../models/Bus');

const { verifyToken, requireAuth } = require('../middleware/auth');

// Get all bookings for the user
router.get('/', verifyToken, requireAuth, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json([
            {
                pnr: 'YS1234567890',
                user: req.user.id,
                bus: {
                    busNumber: 'KA-01-F-1234',
                    operator: 'KSRTC',
                    departureTime: '06:30',
                    arrivalTime: '09:15',
                    route: { from: 'Bengaluru', to: 'Mysuru' }
                },
                passengers: [{ name: 'Demo User', seatNumber: 5 }],
                date: new Date().toISOString().split('T')[0],
                amount: 180,
                status: 'Confirmed',
                createdAt: new Date()
            }
        ]);
    }
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('bus').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new booking
router.post('/', verifyToken, requireAuth, async (req, res) => {
    const { busId, passengers, date, amount, fromStop, toStop } = req.body;

    if (mongoose.connection.readyState !== 1) {
        const pnr = 'YS' + Date.now().toString().slice(-10);
        return res.status(201).json({
            pnr,
            user: req.user.id,
            bus: busId,
            passengers,
            date,
            amount,
            fromStop,
            toStop,
            paymentStatus: 'Completed',
            status: 'Confirmed',
            createdAt: new Date()
        });
    }

    try {
        const bus = await Bus.findById(busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        const pnr = 'YS' + Date.now().toString().slice(-10);
        const booking = new Booking({
            pnr,
            user: req.user.id,
            bus: bus._id,
            passengers,
            date,
            amount,
            fromStop,
            toStop,
            paymentStatus: 'Completed'
        });

        await booking.save();

        if (!bus.bookedSeats) bus.bookedSeats = [];
        passengers.forEach(p => {
            if (p.seatNumber) bus.bookedSeats.push(Number(p.seatNumber));
        });
        await bus.save();

        res.status(201).json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify ticket by PNR
router.get('/verify/:pnr', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json({
            pnr: req.params.pnr,
            user: 'demo-user',
            bus: {
                busNumber: 'KA-01-F-1234',
                operator: 'KSRTC',
                route: { from: 'Bengaluru', to: 'Mysuru' }
            },
            passengers: [{ name: 'Demo User', seatNumber: 5 }],
            status: 'Confirmed'
        });
    }
    try {
        const booking = await Booking.findOne({ pnr: req.params.pnr }).populate('bus');
        if (!booking) return res.status(404).json({ message: 'Ticket not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
