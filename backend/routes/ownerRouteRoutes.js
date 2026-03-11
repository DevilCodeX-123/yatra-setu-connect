const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const { verifyToken, requireAuth, requireRole, resolveUserId } = require('../middleware/auth');

// Helper: compute arrival times for all stops given a startTime (HH:MM) and minsFromPrev per stop
function computeArrivalTimes(stops, startTime) {
    if (!startTime || !stops || stops.length === 0) return stops;
    const [startHr, startMin] = startTime.split(':').map(Number);
    let totalMins = startHr * 60 + startMin;

    return stops.map((stop, idx) => {
        if (idx === 0) {
            const hr = Math.floor(totalMins / 60) % 24;
            const min = totalMins % 60;
            return { ...stop, arrivalTime: `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}` };
        }
        totalMins += (stop.minsFromPrev || 0);
        const hr = Math.floor(totalMins / 60) % 24;
        const min = totalMins % 60;
        return { ...stop, arrivalTime: `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}` };
    });
}

// POST /api/owner-routes - Create a standalone route with bidirectional variants
router.post('/', verifyToken, requireAuth, requireRole('Owner'), async (req, res) => {
    try {
        const { from, to, stops, name } = req.body;
        if (!stops || stops.length < 2) return res.status(400).json({ success: false, message: 'At least 2 stops required' });
        const ownerId = await resolveUserId(req.user);

        // Forward variant (A → B)
        const forwardStops = stops.map((s, i) => ({
            name: s.name, lat: s.lat, lng: s.lng, order: i,
            priceFromPrev: s.priceFromPrev || 0,
            minsFromPrev: s.minsFromPrev || 0,
            arrivalTime: ''
        }));

        // Reverse variant (B → A) — flip prices/times relative to reversed order
        const reversedStops = [...stops].reverse().map((s, i, arr) => {
            const nextInOriginal = arr[i + 1]; // corresponds to the previous stop in original
            return {
                name: s.name, lat: s.lat, lng: s.lng, order: i,
                priceFromPrev: i === 0 ? 0 : (nextInOriginal ? nextInOriginal.priceFromPrev || 0 : 0),
                minsFromPrev: i === 0 ? 0 : (nextInOriginal ? nextInOriginal.minsFromPrev || 0 : 0),
                arrivalTime: ''
            };
        });

        const newRoute = new Route({
            owner: ownerId,
            name: name || `${from} ↔ ${to}`,
            from, to,
            variants: [
                { stops: forwardStops, label: `${from} → ${to}`, isLive: false, isBlocked: false },
                { stops: reversedStops, label: `${to} → ${from}`, isLive: false, isBlocked: false }
            ]
        });
        const savedRoute = await newRoute.save();
        res.status(201).json({ success: true, route: savedRoute });
    } catch (error) {
        console.error("Error saving route:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/owner-routes - Get all saved routes for the logged-in owner
router.get('/', verifyToken, requireAuth, requireRole('Owner'), async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const routes = await Route.find({ owner: ownerId }).sort({ createdAt: -1 });
        res.json({ success: true, routes });
    } catch (error) {
        console.error("Error fetching routes:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH /api/owner-routes/:id - Edit route name or stops
router.patch('/:id', verifyToken, requireAuth, requireRole('Owner'), async (req, res) => {
    try {
        const { name, stops } = req.body;
        const ownerId = await resolveUserId(req.user);
        const route = await Route.findOne({ _id: req.params.id, owner: ownerId });
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

        if (name) route.name = name;
        if (stops && stops.length >= 2) {
            const forwardStops = stops.map((s, i) => ({
                name: s.name, lat: s.lat, lng: s.lng, order: i,
                priceFromPrev: s.priceFromPrev || 0,
                minsFromPrev: s.minsFromPrev || 0,
                arrivalTime: ''
            }));
            const reversedStops = [...stops].reverse().map((s, i, arr) => {
                const nextInOriginal = arr[i + 1];
                return {
                    name: s.name, lat: s.lat, lng: s.lng, order: i,
                    priceFromPrev: i === 0 ? 0 : (nextInOriginal ? nextInOriginal.priceFromPrev || 0 : 0),
                    minsFromPrev: i === 0 ? 0 : (nextInOriginal ? nextInOriginal.minsFromPrev || 0 : 0),
                    arrivalTime: ''
                };
            });
            route.from = stops[0].name;
            route.to = stops[stops.length - 1].name;
            route.variants[0] = { ...route.variants[0].toObject(), stops: forwardStops, label: `${route.from} → ${route.to}` };
            route.variants[1] = { ...route.variants[1].toObject(), stops: reversedStops, label: `${route.to} → ${route.from}` };
        }
        await route.save();
        res.json({ success: true, route });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH /api/owner-routes/:id/block - Toggle master block for whole route
router.patch('/:id/block', verifyToken, requireAuth, requireRole('Owner'), async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const route = await Route.findOne({ _id: req.params.id, owner: ownerId });
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
        route.isBlocked = !route.isBlocked;
        await route.save();
        res.json({ success: true, isBlocked: route.isBlocked, route });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH /api/owner-routes/:id/variant/:variantIdx/block - Block a specific variant
router.patch('/:id/variant/:variantIdx/block', verifyToken, requireAuth, requireRole('Owner'), async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const route = await Route.findOne({ _id: req.params.id, owner: ownerId });
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
        const idx = parseInt(req.params.variantIdx);
        if (!route.variants[idx]) return res.status(400).json({ success: false, message: 'Invalid variant index' });
        route.variants[idx].isBlocked = !route.variants[idx].isBlocked;
        await route.save();
        res.json({ success: true, route });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/owner-routes/:id/activate - Activate a variant: assign to bus, set start time, make bus live
router.post('/:id/activate', verifyToken, requireAuth, requireRole('Owner'), async (req, res) => {
    try {
        const { variantIdx, busId, startTime } = req.body;
        if (variantIdx === undefined || !busId || !startTime) {
            return res.status(400).json({ success: false, message: 'variantIdx, busId and startTime are required' });
        }

        const ownerId = await resolveUserId(req.user);
        const route = await Route.findOne({ _id: req.params.id, owner: ownerId });
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
        if (route.isBlocked) return res.status(400).json({ success: false, message: 'Route is blocked' });

        const idx = parseInt(variantIdx);
        const variant = route.variants[idx];
        if (!variant) return res.status(400).json({ success: false, message: 'Invalid variant index' });
        if (variant.isBlocked) return res.status(400).json({ success: false, message: 'This route variant is blocked' });

        // Compute arrival times for each stop
        const stopsWithTimes = computeArrivalTimes(variant.stops.map(s => s.toObject()), startTime);

        // Update variant
        route.variants[idx].stops = stopsWithTimes;
        route.variants[idx].startTime = startTime;
        route.variants[idx].isLive = true;
        route.variants[idx].busAssigned = busId;

        // Switch off other variant's live if it was on the same bus
        route.variants.forEach((v, i) => {
            if (i !== idx && String(v.busAssigned) === String(busId)) {
                route.variants[i].isLive = false;
            }
        });

        await route.save();

        // Update the Bus itself with route data and make it Active
        const busUpdate = {
            status: 'Active',
            'route.from': stopsWithTimes[0].name,
            'route.to': stopsWithTimes[stopsWithTimes.length - 1].name,
            'route.stops': stopsWithTimes.map(s => ({
                name: s.name, lat: s.lat, lng: s.lng,
                priceFromPrev: s.priceFromPrev,
                arrivalTime: s.arrivalTime
            })),
            date: new Date().toISOString().split('T')[0],
            departureTime: startTime
        };

        const existingBus = await Bus.findById(busId);
        const updateObj = { $set: busUpdate };

        // Archive old route to history
        if (existingBus && existingBus.route && existingBus.route.from && existingBus.route.to) {
            updateObj.$push = {
                routeHistory: {
                    $each: [{ from: existingBus.route.from, to: existingBus.route.to, stops: existingBus.route.stops || [], savedAt: new Date() }],
                    $slice: -25
                }
            };
        }

        const updatedBus = await Bus.findByIdAndUpdate(busId, updateObj, { new: true });

        res.json({ success: true, route, bus: updatedBus, stopsWithTimes });
    } catch (error) {
        console.error("Error activating route:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/owner-routes/:id - Delete a saved route
router.delete('/:id', verifyToken, requireAuth, requireRole('Owner'), async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const route = await Route.findOneAndDelete({ _id: req.params.id, owner: ownerId });
        if (!route) return res.status(404).json({ success: false, message: 'Route not found or unauthorized' });
        res.json({ success: true, message: 'Route deleted successfully' });
    } catch (error) {
        console.error("Error deleting route:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
