const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const SupportTicket = require('../models/SupportTicket');
const EmergencyAlert = require('../models/EmergencyAlert');
const User = require('../models/User');

const { verifyToken, requireAuth } = require('../middleware/auth');

// Get Real-Time Statistics
router.get('/stats', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json({
            busesRunningToday: 124,
            passengersServed: 12540,
            routesActive: 48,
            co2Saved: 840
        });
    }
    try {
        const allBookings = await Booking.find({ status: { $ne: 'Cancelled' } });
        const totalPassengers = allBookings.reduce((sum, b) => sum + (b.passengers ? b.passengers.length : 0), 0);
        const busesTodayCount = await Bus.countDocuments({ status: 'Active' });

        res.json({
            busesRunningToday: busesTodayCount || 0,
            passengersServed: totalPassengers || 0,
            routesActive: 12, // Placeholder
            co2Saved: Math.round(totalPassengers * 0.133)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Support Ticket
router.post('/support', verifyToken, requireAuth, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(201).json({ id: 'demo-support-' + Date.now(), ...req.body });
    }
    try {
        const ticket = new SupportTicket({
            user: req.user.id,
            ...req.body
        });
        await ticket.save();
        res.status(201).json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Emergency Alert
router.post('/emergency', verifyToken, requireAuth, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(201).json({ id: 'demo-sos-' + Date.now(), ...req.body });
    }
    try {
        const alert = new EmergencyAlert({
            user: req.user.id,
            ...req.body
        });
        await alert.save();
        res.status(201).json(alert);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
