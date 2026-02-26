const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Bus = require('../models/Bus');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'yatra-setu-secret-key-2024';

// Middleware to resolve owner ID or user ID
const resolveUserId = async (token) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        return decoded.id;
    } catch {
        return null;
    }
};

// GET /api/complaints/owner — Get complaints for all buses owned by the requester
router.get('/owner', async (req, res) => {
    const userId = await resolveUserId(req.headers.authorization);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const complaints = await Complaint.find({ owner: userId })
            .populate('bus', 'busNumber name')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/complaints — Submit a new complaint/suggestion
router.post('/', async (req, res) => {
    const { busNumber, type, category, description, userName, userPhone } = req.body;
    const userId = await resolveUserId(req.headers.authorization);

    try {
        const bus = await Bus.findOne({ busNumber: busNumber });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        const complaint = new Complaint({
            bus: bus._id,
            owner: bus.owner,
            user: userId,
            userName,
            userPhone,
            type,
            category,
            description
        });

        await complaint.save();
        res.status(201).json({ success: true, complaint });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/complaints/:id/status — Update complaint status (Owner)
router.patch('/:id/status', async (req, res) => {
    const userId = await resolveUserId(req.headers.authorization);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { status, response } = req.body;
    try {
        const complaint = await Complaint.findOne({ _id: req.params.id, owner: userId });
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        complaint.status = status;
        if (response !== undefined) complaint.response = response;
        complaint.updatedAt = Date.now();

        await complaint.save();
        res.json({ success: true, complaint });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
