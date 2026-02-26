const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken, requireRole, resolveUserId } = require('../middleware/auth');
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

// GET /api/employee/invitations — see pending bus invitations for this employee
router.get('/invitations', verifyToken, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json([]);
    }
    try {
        const userId = await resolveUserId(req.user);
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find all buses that have this employee's email pending or active
        const buses = await Bus.find({
            'employees.email': user.email.toLowerCase()
        }).select('busNumber name orgName state district isPrivate employees employeeCode owner');

        const invitations = buses.map(bus => {
            const emp = bus.employees.find(e => e.email === user.email.toLowerCase());
            return {
                busId: bus._id,
                busNumber: bus.busNumber,
                busName: bus.name,
                orgName: bus.orgName,
                state: bus.state,
                district: bus.district,
                isPrivate: bus.isPrivate,
                status: emp?.status,
                employeeCode: emp?.status === 'Active' ? bus.employeeCode : null,
            };
        });

        res.json(invitations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/employee/invitations/:busId/accept
router.post('/invitations/:busId/accept', verifyToken, async (req, res) => {
    try {
        const userId = await resolveUserId(req.user);
        const user = await User.findById(userId);
        const bus = await Bus.findById(req.params.busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        const emp = bus.employees.find(e => e.email === user.email.toLowerCase());
        if (!emp) return res.status(404).json({ message: 'No invitation found' });

        emp.status = 'Active';
        emp.userId = user._id;
        await bus.save();

        res.json({ success: true, employeeCode: bus.employeeCode, bus });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/employee/invitations/:busId/reject
router.post('/invitations/:busId/reject', verifyToken, async (req, res) => {
    try {
        const userId = await resolveUserId(req.user);
        const user = await User.findById(userId);
        const bus = await Bus.findById(req.params.busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        const emp = bus.employees.find(e => e.email === user.email.toLowerCase());
        if (!emp) return res.status(404).json({ message: 'No invitation found' });

        emp.status = 'Rejected';
        await bus.save();

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── Attendance (employee side) ───────────────────────────────────────────────
const Attendance = require('../models/Attendance');

// POST /api/employee/go-onair — Driver uses driverCode to go on-air & mark attendance
router.post('/go-onair', verifyToken, async (req, res) => {
    const { driverCode } = req.body;
    if (!driverCode) return res.status(400).json({ message: 'driverCode is required' });
    try {
        const bus = await Bus.findOne({ 'employees.driverCode': driverCode });
        if (!bus) return res.status(404).json({ message: 'Invalid driver code' });
        const emp = bus.employees.find(e => e.driverCode === driverCode);

        // Auto check-in today
        const today = new Date().toISOString().split('T')[0];
        const userId = await resolveUserId(req.user);
        await Attendance.findOneAndUpdate(
            { employee: emp.userId || userId, bus: bus._id, date: today },
            { $setOnInsert: { owner: bus.owner, checkIn: new Date(), present: true } },
            { upsert: true, new: true }
        );

        res.json({ success: true, bus: { _id: bus._id, busNumber: bus.busNumber, name: bus.name }, employee: emp });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/employee/check-out — Driver ends shift
router.post('/check-out', verifyToken, async (req, res) => {
    const { busId } = req.body;
    if (!busId) return res.status(400).json({ message: 'busId is required' });
    try {
        const today = new Date().toISOString().split('T')[0];
        const userId = await resolveUserId(req.user);
        const rec = await Attendance.findOne({ employee: userId, bus: busId, date: today });
        if (!rec) return res.status(404).json({ message: 'No check-in record found for today' });
        const now = new Date();
        const hrs = rec.checkIn ? (now - rec.checkIn) / 3600000 : 0;
        rec.checkOut = now;
        rec.hoursWorked = Math.round(hrs * 10) / 10;
        await rec.save();
        res.json({ success: true, hoursWorked: rec.hoursWorked, record: rec });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/employee/my-attendance?month=YYYY-MM — Employee views own attendance
router.get('/my-attendance', verifyToken, async (req, res) => {
    try {
        const { month } = req.query;
        const userId = await resolveUserId(req.user);
        const query = { employee: userId };
        if (month) query.date = { $regex: `^${month}` };
        const records = await Attendance.find(query).populate('bus', 'busNumber name').sort({ date: -1 });
        res.json({ attendance: records });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

