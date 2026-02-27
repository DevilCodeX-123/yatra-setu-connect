const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken, resolveUserId } = require('../middleware/auth');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');

const generatePNR = () => 'YSPNR' + Math.floor(100000 + Math.random() * 900000);

// ═══ 1. BUS ACTIVATION (Bus Number + Owner Activation Code) ═══════════════════
router.post('/activate', async (req, res) => {
    const { busNumber, activationCode } = req.body;
    if (!busNumber || !activationCode)
        return res.status(400).json({ message: 'Bus number and activation code required' });

    if (mongoose.connection.readyState !== 1) {
        return res.json({ success: true, mode: 'demo', bus: { busNumber, operator: 'Demo', status: 'Active', route: { from: 'City A', to: 'City B', stops: [] } } });
    }
    try {
        const bus = await Bus.findOne({ busNumber: busNumber.toUpperCase() });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        if (bus.activationCode !== activationCode)
            return res.status(400).json({ message: 'Invalid activation code' });
        res.json({ success: true, bus });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══ 2. DUTY START (Driver Code → Auto Attendance) ════════════════════════════
router.post('/go-onair', verifyToken, async (req, res) => {
    const { driverCode, busNumber, role } = req.body;
    if (!driverCode) return res.status(400).json({ message: 'driverCode is required' });

    if (mongoose.connection.readyState !== 1) {
        return res.json({ success: true, mode: 'demo', attendanceId: 'DEMO_ATT', checkIn: new Date(), bus: { busNumber: busNumber || 'DEMO-BUS', name: 'Demo Bus', route: { from: 'Start', to: 'End', stops: [] } } });
    }
    try {
        const busQuery = busNumber
            ? { busNumber: busNumber.toUpperCase(), 'employees.driverCode': driverCode }
            : { 'employees.driverCode': driverCode };
        const bus = await Bus.findOne(busQuery);
        if (!bus) return res.status(404).json({ message: 'Invalid driver code for this bus' });

        const emp = bus.employees.find(e => e.driverCode === driverCode);
        const today = new Date().toISOString().split('T')[0];
        const userId = await resolveUserId(req.user);

        const att = await Attendance.findOneAndUpdate(
            { employee: emp.userId || userId, bus: bus._id, date: today },
            { $setOnInsert: { owner: bus.owner, checkIn: new Date(), present: true, notes: `Role: ${role || 'Driver'}` } },
            { upsert: true, new: true }
        );
        res.json({ success: true, attendanceId: att._id, checkIn: att.checkIn, bus: { _id: bus._id, busNumber: bus.busNumber, name: bus.name, route: bus.route }, employee: emp });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══ 3. DUTY END ══════════════════════════════════════════════════════════════
router.post('/check-out', verifyToken, async (req, res) => {
    const { busId } = req.body;
    if (!busId) return res.status(400).json({ message: 'busId is required' });

    if (mongoose.connection.readyState !== 1) {
        return res.json({ success: true, mode: 'demo', hoursWorked: 8, checkIn: new Date(Date.now() - 8 * 3600000), checkOut: new Date(), shiftSummary: { totalTickets: 12, cashCollected: 960, onlineCollected: 520, totalRevenue: 1480 } });
    }
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

        const startOfDay = new Date(today);
        const endOfDay = new Date(today); endOfDay.setHours(23, 59, 59, 999);
        const bookings = await Booking.find({ bus: busId, date: { $gte: startOfDay, $lte: endOfDay } });
        const cashTotal = bookings.filter(b => b.paymentMethod === 'Cash').reduce((s, b) => s + b.amount, 0);
        const onlineTotal = bookings.filter(b => b.paymentMethod !== 'Cash').reduce((s, b) => s + b.amount, 0);

        res.json({ success: true, hoursWorked: rec.hoursWorked, checkIn: rec.checkIn, checkOut: rec.checkOut, shiftSummary: { totalTickets: bookings.length, cashCollected: cashTotal, onlineCollected: onlineTotal, totalRevenue: cashTotal + onlineTotal } });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══ 4. ATTENDANCE (View Only) ════════════════════════════════════════════════
router.get('/my-attendance', verifyToken, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.json({ attendance: [] });
    try {
        const { month } = req.query;
        const userId = await resolveUserId(req.user);
        const query = { employee: userId };
        if (month) query.date = { $regex: `^${month}` };
        const records = await Attendance.find(query).populate('bus', 'busNumber name').sort({ date: -1 });
        res.json({ attendance: records });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══ 5. LIVE LOCATION ═════════════════════════════════════════════════════════
router.post('/location', async (req, res) => {
    const { busNumber, lat, lng, source } = req.body;
    const io = req.app.get('io');
    if (io) io.to(`bus:${busNumber}`).emit('bus:location', { lat, lng, busNumber, source, timestamp: new Date() });
    if (mongoose.connection.readyState !== 1) return res.json({ success: true, mode: 'demo' });
    try {
        await Bus.findOneAndUpdate({ busNumber }, { 'liveLocation.lat': lat, 'liveLocation.lng': lng, 'liveLocation.source': source, 'liveLocation.updatedAt': new Date() });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══ 6 & 7. CASH/UPI TICKET BOOKING ══════════════════════════════════════════
router.post('/cash-passenger', verifyToken, async (req, res) => {
    const { busNumber, seatNumber, from, to, amount, paymentMethod, passengerName } = req.body;
    if (mongoose.connection.readyState !== 1) {
        return res.json({ success: true, mode: 'demo', pnr: generatePNR(), booking: { passengerName, seatNumber, from, to, amount, paymentMethod } });
    }
    try {
        const bus = await Bus.findOne({ busNumber: busNumber.toUpperCase() });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        const userId = await resolveUserId(req.user);
        const pnr = generatePNR();
        const booking = new Booking({ pnr, user: userId, bus: bus._id, amount: Number(amount) || 0, passengers: [{ name: passengerName || 'Walk-in Passenger', seatNumber: String(seatNumber) }], date: new Date(), status: 'Confirmed', paymentStatus: 'Completed', bookingSource: 'Employee', paymentMethod: paymentMethod || 'Cash' });
        await booking.save();
        const seat = bus.seats.find(s => s.number === Number(seatNumber));
        if (seat) { seat.status = 'Cash'; seat.passenger = passengerName || 'Walk-in'; await bus.save(); }
        const io = req.app.get('io');
        if (io) io.to(`bus:${busNumber}`).emit('bus:seat-update', { seatNumber: Number(seatNumber), status: 'Cash' });
        res.json({ success: true, pnr, booking });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══ 8. PASSENGER MANAGEMENT ══════════════════════════════════════════════════
router.get('/passengers', verifyToken, async (req, res) => {
    const { busNumber } = req.query;
    if (!busNumber) return res.status(400).json({ message: 'busNumber required' });
    if (mongoose.connection.readyState !== 1) {
        return res.json({ passengers: [{ pnr: 'YSPNR001', name: 'Rahul Sharma', seat: '5', status: 'Upcoming', paymentMethod: 'Online', amount: 120, boarded: false }, { pnr: 'YSPNR002', name: 'Priya Singh', seat: '8', status: 'Confirmed', paymentMethod: 'Cash', amount: 80, boarded: false }] });
    }
    try {
        const bus = await Bus.findOne({ busNumber: busNumber.toUpperCase() });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
        const bookings = await Booking.find({ bus: bus._id, date: { $gte: startOfDay, $lte: endOfDay } }).populate('user', 'name email phone');
        const passengers = bookings.flatMap(b => b.passengers.map(p => ({ pnr: b.pnr, bookingId: b._id, name: p.name || b.user?.name || 'Passenger', seat: p.seatNumber, status: b.status, paymentMethod: b.paymentMethod, amount: b.amount, boarded: b.status === 'Boarded', userId: b.user?._id })));
        res.json({ passengers });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/passengers/:pnr/board', verifyToken, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.json({ success: true, mode: 'demo' });
    try {
        const booking = await Booking.findOne({ pnr: req.params.pnr });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        booking.status = 'Boarded'; await booking.save();
        res.json({ success: true, booking });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/passengers/:pnr/drop', verifyToken, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.json({ success: true, mode: 'demo' });
    try {
        const booking = await Booking.findOne({ pnr: req.params.pnr });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        booking.status = 'Completed'; await booking.save();
        res.json({ success: true, booking });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/scan-qr', async (req, res) => {
    const { pnr } = req.body;
    if (mongoose.connection.readyState !== 1) return res.json({ valid: true, booking: { pnr, status: 'Boarded', passengers: [{ name: 'Demo User' }] } });
    try {
        const booking = await Booking.findOne({ pnr }).populate('user', 'name email');
        if (!booking) return res.status(404).json({ valid: false, message: 'Booking not found' });
        booking.status = 'Boarded'; await booking.save();
        res.json({ valid: true, booking });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══ 9. DAILY REPORT ══════════════════════════════════════════════════════════
router.get('/daily-report', verifyToken, async (req, res) => {
    const { busNumber } = req.query;
    if (mongoose.connection.readyState !== 1) return res.json({ totalTickets: 12, cashTickets: 8, onlineTickets: 4, cashAmount: 960, onlineAmount: 520, totalRevenue: 1480 });
    try {
        const bus = await Bus.findOne({ busNumber: busNumber?.toUpperCase() });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
        const bookings = await Booking.find({ bus: bus._id, date: { $gte: startOfDay, $lte: endOfDay } });
        const cashB = bookings.filter(b => b.paymentMethod === 'Cash');
        const onlineB = bookings.filter(b => b.paymentMethod !== 'Cash');
        res.json({ totalTickets: bookings.length, cashTickets: cashB.length, onlineTickets: onlineB.length, cashAmount: cashB.reduce((s, b) => s + b.amount, 0), onlineAmount: onlineB.reduce((s, b) => s + b.amount, 0), totalRevenue: bookings.reduce((s, b) => s + b.amount, 0) });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══ 10. EXPENSE MANAGEMENT ═══════════════════════════════════════════════════
router.post('/expenses', verifyToken, async (req, res) => {
    const { busNumber, amount, category, description } = req.body;
    if (!amount || !category) return res.status(400).json({ message: 'Amount and category are required' });
    if (mongoose.connection.readyState !== 1) return res.json({ success: true, mode: 'demo', expense: { amount, category, description, date: new Date() } });
    try {
        const userId = await resolveUserId(req.user);
        const bus = busNumber ? await Bus.findOne({ busNumber: busNumber.toUpperCase() }) : null;
        const expense = new Expense({ owner: bus?.owner || userId, bus: bus?._id, amount: Number(amount), category, description, date: new Date(), meta: { addedBy: userId, addedByRole: req.user.role } });
        await expense.save();
        if (bus?.owner) {
            const user = await User.findById(userId);
            await Notification.create({ userId: bus.owner, type: 'warning', title: `Expense Added by ${user?.name || 'Employee'}`, message: `${category}: ₹${amount} — ${description || 'No reason given'} (Bus: ${busNumber})` });
        }
        res.json({ success: true, expense });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/expenses', verifyToken, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.json({ expenses: [{ category: 'Fuel', amount: 500, description: 'Morning fuel fill', date: new Date(), createdAt: new Date() }, { category: 'Toll', amount: 120, description: 'Highway toll', date: new Date(), createdAt: new Date() }] });
    try {
        const { month } = req.query;
        const userId = await resolveUserId(req.user);
        const query = { 'meta.addedBy': new mongoose.Types.ObjectId(userId) };
        if (month) { const start = new Date(`${month}-01`); const end = new Date(start); end.setMonth(end.getMonth() + 1); query.date = { $gte: start, $lt: end }; }
        const expenses = await Expense.find(query).populate('bus', 'busNumber').sort({ date: -1 });
        res.json({ expenses });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══ INVITATIONS ══════════════════════════════════════════════════════════════
router.get('/invitations', verifyToken, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.json([]);
    try {
        const userId = await resolveUserId(req.user);
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const buses = await Bus.find({ 'employees.email': user.email.toLowerCase() }).select('busNumber name orgName state district isPrivate employees employeeCode owner').populate('owner', 'name email');
        res.json(buses.map(bus => { const emp = bus.employees.find(e => e.email === user.email.toLowerCase()); return { busId: bus._id, busNumber: bus.busNumber, busName: bus.name, orgName: bus.orgName, state: bus.state, district: bus.district, isPrivate: bus.isPrivate, status: emp?.status, employeeCode: emp?.status === 'Active' ? bus.employeeCode : null, ownerName: bus.owner?.name, ownerEmail: bus.owner?.email }; }));
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/invitations/:busId/accept', verifyToken, async (req, res) => {
    try {
        const userId = await resolveUserId(req.user);
        const user = await User.findById(userId);
        const bus = await Bus.findById(req.params.busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        const emp = bus.employees.find(e => e.email === user.email.toLowerCase());
        if (!emp) return res.status(404).json({ message: 'No invitation found' });
        emp.status = 'Active'; emp.userId = user._id;
        if (user.role === 'Passenger') { user.role = 'Employee'; user.assignedBus = bus._id; await user.save(); }
        await bus.save();
        await Notification.create({ userId: bus.owner, type: 'success', title: 'Offer Accepted', message: `${user.name} has accepted your offer to drive bus ${bus.busNumber}.` });
        res.json({ success: true, employeeCode: bus.employeeCode, bus });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/invitations/:busId/reject', verifyToken, async (req, res) => {
    try {
        const userId = await resolveUserId(req.user);
        const user = await User.findById(userId);
        const bus = await Bus.findById(req.params.busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        const emp = bus.employees.find(e => e.email === user.email.toLowerCase());
        if (!emp) return res.status(404).json({ message: 'No invitation found' });
        emp.status = 'Rejected'; await bus.save();
        await Notification.create({ userId: bus.owner, type: 'warning', title: 'Offer Rejected', message: `${user.name} rejected your offer for bus ${bus.busNumber}.` });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══ ADDITIONAL DRIVER FEATURES ═══════════════════════════════════════════════
router.post('/emergency', verifyToken, async (req, res) => {
    const { busNumber, type, description, location } = req.body;
    try {
        const bus = await Bus.findOne({ busNumber: busNumber?.toUpperCase() });
        const userId = await resolveUserId(req.user);
        const user = await User.findById(userId);

        if (bus?.owner) {
            await Notification.create({
                userId: bus.owner,
                type: 'danger',
                title: `EMERGENCY: ${type}`,
                message: `Driver ${user?.name} reported ${description} for Bus ${busNumber}. Location: ${location?.lat}, ${location?.lng}`
            });
        }
        res.json({ success: true, message: 'Emergency reported successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/set-origin', verifyToken, async (req, res) => {
    const { busId, location } = req.body;
    try {
        await Bus.findByIdAndUpdate(busId, { originLocation: location });
        res.json({ success: true, message: 'Origin location set' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/stop-poll', verifyToken, async (req, res) => {
    const { busId, stopIndex, status } = req.body;
    const io = req.app.get('io');
    if (io) {
        const bus = await Bus.findById(busId);
        if (bus) {
            io.to(`bus:${bus.busNumber}`).emit('stop:update', { stopIndex, status, busNumber: bus.busNumber });
        }
    }
    res.json({ success: true });
});

module.exports = router;
