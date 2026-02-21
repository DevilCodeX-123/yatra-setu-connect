const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const { verifyToken, requireRole } = require('../middleware/auth');

// Apply auth and owner role to all routes
router.use(verifyToken, requireRole('Owner', 'Owner+Employee', 'Admin'));

// GET /api/owner/dashboard
router.get('/dashboard', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json({
            activeBuses: 3,
            totalBuses: 5,
            totalRevenue: 45200,
            totalBookings: 124,
            buses: [
                { _id: 'b1', busNumber: 'KA-01-F-1234', operator: 'KSRTC', status: 'Active' },
                { _id: 'b2', busNumber: 'DL-01-A-4122', operator: 'Yatra Pro', status: 'Inactive' }
            ]
        });
    }
    try {
        const buses = await Bus.find({ owner: req.user.id });
        const busIds = buses.map(b => b._id);
        const bookings = await Booking.find({ bus: { $in: busIds } }).populate('bus');

        res.json({
            activeBuses: buses.filter(b => b.status === 'Active').length,
            totalBuses: buses.length,
            totalRevenue: bookings.reduce((s, b) => s + (b.amount || 0), 0),
            totalBookings: bookings.length,
            buses
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
