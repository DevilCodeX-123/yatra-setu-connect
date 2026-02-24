const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TrackingRequest = require('../models/TrackingRequest');
const Bus = require('../models/Bus');
const User = require('../models/User');
const { MOCK_OFFICIAL_BUSES } = require('../data/mockData');
const { verifyToken, requireAuth, requireRole } = require('../middleware/auth');

// POST /api/tracking/request — Submit a tracking request with activation code
router.post('/request', verifyToken, requireAuth, async (req, res) => {
    const { busId, activationCode, nickname } = req.body;
    const userId = req.user.id;

    // Handle Demo Mode (DB down)
    if (mongoose.connection.readyState !== 1) {
        console.log("📢 [DEMO REQUEST] ID:", busId);
        const bus = MOCK_OFFICIAL_BUSES.find(b => b._id === busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        if (bus.activationCode !== activationCode) {
            return res.status(403).json({ message: 'Invalid activation code' });
        }

        return res.status(201).json({
            message: 'Tracking request submitted for owner approval (Demo Mode)',
            request: {
                _id: 'demo-req-' + Date.now(),
                user: userId,
                bus: busId,
                status: 'Pending',
                message: `Request for ${nickname || bus.busNumber}`
            }
        });
    }

    try {
        const bus = await Bus.findById(busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        // Validate activation code
        if (bus.activationCode !== activationCode) {
            return res.status(403).json({ message: 'Invalid activation code' });
        }

        // Check if a request already exists
        const existingRequest = await TrackingRequest.findOne({ user: userId, bus: busId, status: 'Pending' });
        if (existingRequest) {
            return res.status(400).json({ message: 'A request is already pending for this bus' });
        }

        // Create new request
        const request = new TrackingRequest({
            user: userId,
            bus: busId,
            message: `Request for ${nickname || bus.busNumber}`
        });

        await request.save();
        res.status(201).json({ message: 'Tracking request submitted for owner approval', request });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/tracking/owner/requests — Get requests for owner's buses
router.get('/owner/requests', verifyToken, requireAuth, requireRole('Owner'), async (req, res) => {
    try {
        // Find all buses owned by this owner
        const ownerBuses = await Bus.find({ owner: req.user.id }).select('_id');
        const busIds = ownerBuses.map(b => b._id);

        const requests = await TrackingRequest.find({ bus: { $in: busIds } })
            .populate('user', 'name email')
            .populate('bus', 'busNumber name orgName')
            .sort({ requestedAt: -1 });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/tracking/owner/requests/:id — Approve/Reject request
router.patch('/owner/requests/:id', verifyToken, requireAuth, requireRole('Owner'), async (req, res) => {
    const { status } = req.body;
    if (!['Accepted', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const request = await TrackingRequest.findById(req.params.id).populate('bus');
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Security check: ensure ownner owns the bus
        if (request.bus.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        request.status = status;
        request.handledAt = new Date();
        await request.save();

        if (status === 'Accepted') {
            // Add bus to user's authorized list
            await User.findByIdAndUpdate(request.user, {
                $push: {
                    authorizedBuses: {
                        bus: request.bus._id,
                        nickname: request.bus.orgName || request.bus.name
                    }
                }
            });
        }

        res.json({ message: `Request ${status.toLowerCase()} successfully`, request });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/tracking/authorized — Get user's authorized buses
router.get('/authorized', verifyToken, requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'authorizedBuses.bus',
            select: 'busNumber name orgName orgCategory liveLocation status route'
        });
        res.json(user.authorizedBuses || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/tracking/my-requests — Get user's pending/all tracking requests
router.get('/my-requests', verifyToken, requireAuth, async (req, res) => {
    // Handle Demo Mode (DB down)
    if (mongoose.connection.readyState !== 1) {
        // Return RTU Kota as pending if it exists in mock data
        const rtuBus = MOCK_OFFICIAL_BUSES.find(b => b.busNumber === 'RJ-20-C-7007');
        return res.json([
            {
                _id: 'demo-req-rtu',
                user: req.user.id,
                bus: rtuBus,
                status: 'Pending',
                message: 'Request for RTU Kota'
            }
        ]);
    }

    try {
        const requests = await TrackingRequest.find({ user: req.user.id, status: 'Pending' })
            .populate('bus', 'busNumber name orgName orgCategory');
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
