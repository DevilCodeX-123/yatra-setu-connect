const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken, requireAuth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');

// POST /api/employee/activate
router.post('/activate', async (req, res) => {
    const { busNumber, activationCode } = req.body;
    if (mongoose.connection.readyState !== 1) {
        return res.json({
            message: 'Activated successfully (Demo Mode)',
            bus: { busNumber, operator: 'Yatra Setu Demo', status: 'Active' }
        });
    }
    try {
        const bus = await Bus.findOne({ busNumber });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        if (bus.activationCode !== activationCode) {
            return res.status(400).json({ message: 'Invalid activation code' });
        }
        res.json({ message: 'Activated successfully', bus });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/employee/location
router.post('/location', async (req, res) => {
    const { busNumber, lat, lng, source } = req.body;

    // Broadcast via socket even in demo mode
    const io = req.app.get('io');
    if (io) {
        io.to(`bus:${busNumber}`).emit('bus:location', { lat, lng, busNumber, source });
    }

    if (mongoose.connection.readyState !== 1) {
        return res.json({ success: true, mode: 'demo' });
    }

    try {
        await Bus.findOneAndUpdate(
            { busNumber },
            { 'liveLocation.lat': lat, 'liveLocation.lng': lng, 'liveLocation.source': source, 'liveLocation.updatedAt': new Date() }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/employee/scan-qr
router.post('/scan-qr', async (req, res) => {
    const { pnr } = req.body;
    if (mongoose.connection.readyState !== 1) {
        return res.json({
            valid: true,
            booking: { pnr, status: 'Boarded', passengers: [{ name: 'Demo User' }] }
        });
    }
    try {
        const booking = await Booking.findOne({ pnr });
        if (!booking) return res.status(404).json({ valid: false, message: 'Booking not found' });
        booking.status = 'Boarded';
        await booking.save();
        res.json({ valid: true, booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
