const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('Owner', 'Owner+Employee', 'Admin'));

const genCode = (prefix, len = 6) =>
    `${prefix}-${crypto.randomBytes(len).toString('hex').toUpperCase().slice(0, len)}`;

// ─── GET /api/owner/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json({
            activeBuses: 3, totalBuses: 5, totalRevenue: 45200, totalBookings: 124,
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
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST /api/owner/buses ─────────────────────────────────────────────────────
router.post('/buses', async (req, res) => {
    try {
        const {
            busNumber, name, type, totalSeats, seats: seatsInput, mileage,
            departureTime, arrivalTime, stops, routes,
            isPrivate, state, district, town, pinCode, orgCategory, orgName,
            rentalPricePerDay, rentalPricePerHour,
        } = req.body;

        if (!busNumber) return res.status(400).json({ message: 'Bus number is required' });
        const existing = await Bus.findOne({ busNumber });
        if (existing) return res.status(409).json({ message: 'Bus with this number already exists' });

        const stopsArr = Array.isArray(stops) ? stops : [];
        const routeFrom = stopsArr[0]?.name || '';
        const routeTo = stopsArr[stopsArr.length - 1]?.name || '';
        const totalFare = stopsArr.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

        // Use provided seat layout or auto-generate
        const seatCount = Number(totalSeats) || 40;
        const seats = Array.isArray(seatsInput) && seatsInput.length > 0
            ? seatsInput
            : Array.from({ length: seatCount }, (_, i) => ({
                number: i + 1, status: 'Available',
                reservedFor: i < 3 ? 'women' : i < 5 ? 'elderly' : 'general'
            }));

        const busData = {
            busNumber, name, type,
            totalSeats: seats.length,
            seats,
            mileage: Number(mileage) || 4.0,
            departureTime, arrivalTime,
            date: new Date().toISOString().split('T')[0],
            route: {
                from: routeFrom, to: routeTo,
                stops: stopsArr.map((s, i) => ({
                    name: s.name, lat: s.lat || 0, lng: s.lng || 0,
                    price: Number(s.price) || 0,
                    distance: Number(s.distance) || 0,
                    arrivalTime: s.arrivalTime || '',
                    sequence: i
                }))
            },
            pricePerKm: totalFare > 0 ? totalFare / Math.max(stopsArr.length * 10, 1) : 1.5,
            isPrivate: Boolean(isPrivate),
            status: 'Active',
            owner: req.user.id,
            rentalPricePerDay: Number(rentalPricePerDay) || 5000,
            rentalPricePerHour: Number(rentalPricePerHour) || 500,
        };

        if (isPrivate) {
            Object.assign(busData, { state, district, town, pinCode, orgCategory, orgName });
            busData.accessCode = genCode('YS-ACCESS');
            busData.employeeCode = genCode('YS-EMP');
        } else {
            busData.activationCode = genCode('YS');
        }

        const bus = new Bus(busData);
        await bus.save();
        res.status(201).json({ success: true, bus });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/owner/buses/:busId/employees ────────────────────────────────────
router.get('/buses/:busId/employees', async (req, res) => {
    try {
        const bus = await Bus.findOne({ _id: req.params.busId, owner: req.user.id });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        res.json({ employees: bus.employees || [], employeeCode: bus.employeeCode });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST /api/owner/buses/:busId/employees ── Add a new driver ───────────────
router.post('/buses/:busId/employees', async (req, res) => {
    const { name, email, phone, perDaySalary } = req.body;
    if (!name) return res.status(400).json({ message: 'Driver name is required' });
    try {
        const bus = await Bus.findOne({ _id: req.params.busId, owner: req.user.id });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        const user = email ? await User.findOne({ email: email.toLowerCase().trim() }) : null;
        if (email) {
            const alreadyAdded = bus.employees.some(e => e.email === email.toLowerCase().trim());
            if (alreadyAdded) return res.status(409).json({ message: 'Driver already added' });
        }

        const driverCode = genCode('DRV'); // unique driver on-air code

        bus.employees.push({
            name: name.trim(),
            email: email ? email.toLowerCase().trim() : undefined,
            phone: phone || undefined,
            userId: user?._id || null,
            status: 'Active',
            driverCode,
            perDaySalary: Number(perDaySalary) || 0,
            joinedAt: new Date(),
        });
        await bus.save();

        const added = bus.employees[bus.employees.length - 1];
        res.status(201).json({ success: true, employee: added, driverCode, employees: bus.employees });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── PATCH /api/owner/buses/:busId/employees/:empId ── Update per-day salary ──
router.patch('/buses/:busId/employees/:empId', async (req, res) => {
    try {
        const bus = await Bus.findOne({ _id: req.params.busId, owner: req.user.id });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        const emp = bus.employees.id(req.params.empId);
        if (!emp) return res.status(404).json({ message: 'Employee not found' });
        if (req.body.perDaySalary !== undefined) emp.perDaySalary = Number(req.body.perDaySalary);
        if (req.body.name) emp.name = req.body.name;
        if (req.body.phone) emp.phone = req.body.phone;
        await bus.save();
        res.json({ success: true, employee: emp });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── DELETE /api/owner/buses/:busId/employees/:empId ─────────────────────────
router.delete('/buses/:busId/employees/:empId', async (req, res) => {
    try {
        const bus = await Bus.findOne({ _id: req.params.busId, owner: req.user.id });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        bus.employees = bus.employees.filter(e => e._id.toString() !== req.params.empId);
        await bus.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/owner/employees/all ─── All employees across all buses ──────────
router.get('/employees/all', async (req, res) => {
    try {
        const buses = await Bus.find({ owner: req.user.id });
        const result = [];
        for (const bus of buses) {
            for (const emp of (bus.employees || [])) {
                result.push({
                    ...emp.toObject(),
                    busId: bus._id,
                    busNumber: bus.busNumber,
                    busName: bus.name,
                });
            }
        }
        res.json({ employees: result });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/owner/employees/:empId/attendance?month=YYYY-MM ─────────────────
router.get('/employees/:empId/attendance', async (req, res) => {
    try {
        const { month } = req.query; // 'YYYY-MM'
        const query = { owner: req.user.id, employee: req.params.empId };
        if (month) query.date = { $regex: `^${month}` };
        const records = await Attendance.find(query).sort({ date: -1 });
        res.json({ attendance: records });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/owner/employees/:empId/salary-report?month=YYYY-MM ─────────────
router.get('/employees/:empId/salary-report', async (req, res) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ message: 'month (YYYY-MM) is required' });

        // Find which bus this employee belongs to
        const bus = await Bus.findOne({ owner: req.user.id, 'employees._id': req.params.empId });
        if (!bus) return res.status(404).json({ message: 'Employee not found' });
        const emp = bus.employees.id(req.params.empId);

        const attendance = await Attendance.find({
            owner: req.user.id,
            employee: emp.userId,
            date: { $regex: `^${month}` }
        }).sort({ date: 1 });

        const presentDays = attendance.filter(a => a.present).length;
        const totalSalary = presentDays * (emp.perDaySalary || 0);
        const totalHours = attendance.reduce((s, a) => s + (a.hoursWorked || 0), 0);

        // Day-by-day breakdown for the month
        const [year, mon] = month.split('-').map(Number);
        const daysInMonth = new Date(year, mon, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const dateStr = `${month}-${String(i + 1).padStart(2, '0')}`;
            const record = attendance.find(a => a.date === dateStr);
            return {
                date: dateStr,
                present: record ? record.present : false,
                checkIn: record?.checkIn || null,
                checkOut: record?.checkOut || null,
                hoursWorked: record?.hoursWorked || 0,
                daySalary: record?.present ? (emp.perDaySalary || 0) : 0,
            };
        });

        res.json({
            employee: { id: emp._id, name: emp.name, email: emp.email, perDaySalary: emp.perDaySalary, driverCode: emp.driverCode },
            bus: { id: bus._id, busNumber: bus.busNumber, name: bus.name },
            month, presentDays, totalSalary, totalHours, days,
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST /api/owner/attendance/mark ── Manual attendance mark ────────────────
router.post('/attendance/mark', async (req, res) => {
    const { employeeId, busId, date, present, notes } = req.body;
    if (!employeeId || !busId || !date) return res.status(400).json({ message: 'employeeId, busId, date required' });
    try {
        const bus = await Bus.findOne({ _id: busId, owner: req.user.id });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        const emp = bus.employees.id(employeeId);
        if (!emp) return res.status(404).json({ message: 'Employee not found' });

        const rec = await Attendance.findOneAndUpdate(
            { employee: emp.userId, bus: busId, date },
            { $set: { owner: req.user.id, present: present !== false, notes } },
            { upsert: true, new: true }
        );
        res.json({ success: true, record: rec });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
