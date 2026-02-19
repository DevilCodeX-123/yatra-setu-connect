const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const EmergencyAlert = require('../models/EmergencyAlert');
const User = require('../models/User');

// Create Support Ticket
router.post('/support', async (req, res) => {
    try {
        const user = await User.findOne({ email: 'john.doe@government.in' });
        const ticket = new SupportTicket({
            user: user._id,
            ...req.body
        });
        await ticket.save();
        res.status(201).json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Emergency Alert
router.post('/emergency', async (req, res) => {
    try {
        const user = await User.findOne({ email: 'john.doe@government.in' });
        const alert = new EmergencyAlert({
            user: user._id,
            ...req.body
        });
        await alert.save();
        res.status(201).json(alert);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
