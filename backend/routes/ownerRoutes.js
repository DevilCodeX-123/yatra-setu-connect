const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const { verifyToken, requireRole, resolveUserId } = require('../middleware/auth');






router.use(verifyToken, requireRole('Owner', 'Owner+Employee', 'Admin'));

const genCode = (prefix, len = 6) =>
    `${prefix}-${crypto.randomBytes(len).toString('hex').toUpperCase().slice(0, len)}`;


// ─── GET /api/owner/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database not connected. Only live data is shown.' });
    }
    try {
        const ownerId = await resolveUserId(req.user);
        const ownerUser = await User.findById(ownerId).select('upiId');
        const buses = await Bus.find({ owner: ownerId });
        const busIds = buses.map(b => b._id);
        const bookings = await Booking.find({ bus: { $in: busIds } }).populate('bus');
        res.json({
            activeBuses: buses.filter(b => b.status === 'Active').length,
            totalBuses: buses.length,
            totalRevenue: bookings.reduce((s, b) => s + (b.amount || 0), 0),
            totalBookings: bookings.length,
            buses,
            upiId: ownerUser?.upiId || ''
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── PATCH /api/owner/upi ───────────────────────────────────────────────────
router.patch('/upi', async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const { upiId } = req.body;
        await User.findByIdAndUpdate(ownerId, { upiId });
        res.json({ success: true, upiId });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/owner/routes-history ───────────────────────────────────────────
router.get('/routes-history', async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const buses = await Bus.find({ owner: ownerId }, 'route');

        const routes = buses
            .map(b => b.route)
            .filter(r => r && r.from && r.to);

        const uniqueRoutes = [];
        const seen = new Set();

        for (const r of routes) {
            const key = `${r.from}-${r.to}-${(r.stops || []).map(s => s.name).join(',')}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueRoutes.push(r);
            }
        }

        res.json({ success: true, routes: uniqueRoutes });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/owner/expenses ──────────────────────────────────────────────────
router.get('/expenses', async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const expenses = await Expense.find({ owner: ownerId }).populate('bus', 'busNumber route').sort({ date: -1, createdAt: -1 });
        res.json({ success: true, expenses });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST /api/owner/expenses ──────────────────────────────────────────────────
router.post('/expenses', async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const { bus, amount, category, date, description } = req.body;
        const newExpense = new Expense({
            owner: ownerId,
            bus: bus || null,
            amount: Number(amount),
            category,
            date: date ? new Date(date) : new Date(),
            description
        });
        await newExpense.save();
        res.status(201).json({ success: true, expense: newExpense });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/owner/bookings ──────────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database not connected.' });
    }
    try {
        const ownerId = await resolveUserId(req.user);
        const buses = await Bus.find({ owner: ownerId });
        const busIds = buses.map(b => b._id);

        // Find bookings and populate bus and user details
        const bookings = await Booking.find({ bus: { $in: busIds } })
            .populate('bus', 'busNumber route')
            .populate('user', 'name email phone')
            .sort({ date: -1, createdAt: -1 });

        res.json({ success: true, bookings });
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ message: err.message });
    }
});

// ─── PATCH /api/owner/buses/:busId ── Update basic bus info ────────────────
router.patch('/buses/:busId', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database not connected' });
    try {
        const ownerId = await resolveUserId(req.user);
        const { name, totalSeats, pricePerKm, status, isRentalEnabled, schedule } = req.body;
        const bus = await Bus.findOne({ _id: req.params.busId, owner: ownerId });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        if (name !== undefined) bus.name = name;
        if (totalSeats !== undefined) bus.totalSeats = Number(totalSeats);
        if (pricePerKm !== undefined) bus.pricePerKm = Number(pricePerKm);
        if (status !== undefined) bus.status = status;
        if (isRentalEnabled !== undefined) bus.isRentalEnabled = Boolean(isRentalEnabled);
        if (schedule !== undefined) {
            bus.schedule = { ...bus.schedule?.toObject?.() || {}, ...schedule };
        }
        await bus.save();
        res.json({ success: true, bus });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── PATCH /api/owner/buses/:busId/status ── Quick status toggle ────────────
router.patch('/buses/:busId/status', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database not connected' });
    const { status } = req.body;
    const allowed = ['Active', 'Inactive', 'Temp-Offline'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    try {
        const ownerId = await resolveUserId(req.user);
        const bus = await Bus.findOneAndUpdate(
            { _id: req.params.busId, owner: ownerId },
            { $set: { status } },
            { new: true }
        );
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        res.json({ success: true, status: bus.status });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── PATCH /api/owner/buses/:busId/schedule ── Set timed loop route ──────
router.patch('/buses/:busId/schedule', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database not connected' });
    try {
        const ownerId = await resolveUserId(req.user);
        const bus = await Bus.findOne({ _id: req.params.busId, owner: ownerId });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        bus.schedule = { ...bus.schedule?.toObject?.() || {}, ...req.body };
        await bus.save();
        res.json({ success: true, schedule: bus.schedule });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST /api/owner/buses/seed-test ── Insert 4 test buses for current owner ──
router.post('/buses/seed-test', async (req, res) => {
    console.log("🚀 POST /api/owner/buses/seed-test called");
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database not connected — please check your MongoDB connection' });
    try {
        const owner = await resolveUserId(req.user);
        console.log(`🌱 Seeding test buses for owner: ${owner}`);
        const makeSeat = (count) => Array.from({ length: count }, (_, i) => ({
            number: i + 1, status: 'Available',
            reservedFor: i < 3 ? 'women' : i < 5 ? 'elderly' : 'general'
        }));
        const testBuses = [
            {
                busNumber: 'MH-12-AB-1234', name: 'Shivneri Express', type: 'Volvo',
                status: 'Active', totalSeats: 40, pricePerKm: 2.5, mileage: 5.5,
                route: {
                    from: 'Pune', to: 'Mumbai', stops: [
                        { name: 'Pune Bus Stand', lat: 18.5196, lng: 73.8553, price: 0, sequence: 1 },
                        { name: 'Khopoli', lat: 18.7862, lng: 73.3401, price: 150, sequence: 2 },
                        { name: 'Panvel', lat: 18.9894, lng: 73.1175, price: 280, sequence: 3 },
                        { name: 'Mumbai CST', lat: 18.9398, lng: 72.8354, price: 350, sequence: 4 },
                    ]
                },
                departureTime: '06:00', arrivalTime: '09:30',
                isRentalEnabled: true, rentalPricePerHour: 800,
                rating: 4.5, isPrivate: false, owner,
                seats: makeSeat(40),
            },
            {
                busNumber: 'RJ-14-CD-5678', name: 'Rajputana Travels', type: 'AC',
                status: 'Inactive', totalSeats: 36, pricePerKm: 1.8, mileage: 6,
                route: {
                    from: 'Jaipur', to: 'Ajmer', stops: [
                        { name: 'Sindhi Camp Jaipur', lat: 26.9124, lng: 75.7873, price: 0, sequence: 1 },
                        { name: 'Dudu', lat: 26.7272, lng: 75.3934, price: 80, sequence: 2 },
                        { name: 'Ajmer Bus Stand', lat: 26.4499, lng: 74.6399, price: 180, sequence: 3 },
                    ]
                },
                departureTime: '09:00', arrivalTime: '11:30',
                isRentalEnabled: false, rentalPricePerHour: 600,
                rating: 4.2, isPrivate: false, owner,
                seats: makeSeat(36),
            },
            {
                busNumber: 'KA-01-EF-9012', name: 'Cauvery Deluxe', type: 'Express',
                status: 'Active', totalSeats: 44, pricePerKm: 1.5, mileage: 5,
                route: {
                    from: 'Bengaluru', to: 'Mysuru', stops: [
                        { name: 'Majestic KSRTC', lat: 12.9784, lng: 77.5682, price: 0, sequence: 1 },
                        { name: 'Bidadi', lat: 12.7965, lng: 77.3844, price: 60, sequence: 2 },
                        { name: 'Mandya', lat: 12.5218, lng: 76.8951, price: 120, sequence: 3 },
                        { name: 'Mysuru KSRTC', lat: 12.3050, lng: 76.6551, price: 180, sequence: 4 },
                    ]
                },
                departureTime: '07:30', arrivalTime: '10:00',
                isRentalEnabled: true, rentalPricePerHour: 700,
                rating: 4.7, isPrivate: false, owner,
                seats: makeSeat(44),
                schedule: {
                    isScheduleActive: true, startTime: '07:30', endTime: '22:00',
                    loopEnabled: true, loopIntervalMinutes: 60,
                    activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    notes: 'Runs every hour between Bengaluru and Mysuru'
                }
            },
            {
                busNumber: 'DL-01-GH-3456', name: 'Delhi Agra Liner', type: 'Sleeper',
                status: 'Temp-Offline', totalSeats: 32, pricePerKm: 3.0, mileage: 4.5,
                route: {
                    from: 'Delhi', to: 'Agra', stops: [
                        { name: 'Kashmere Gate ISBT', lat: 28.6676, lng: 77.2270, price: 0, sequence: 1 },
                        { name: 'Faridabad', lat: 28.4089, lng: 77.3178, price: 150, sequence: 2 },
                        { name: 'Mathura', lat: 27.4924, lng: 77.6737, price: 400, sequence: 3 },
                        { name: 'Agra Fort', lat: 27.1767, lng: 78.0081, price: 550, sequence: 4 },
                    ]
                },
                departureTime: '22:00', arrivalTime: '03:00',
                isRentalEnabled: true, rentalPricePerHour: 1200,
                rating: 4.3, isPrivate: false, owner,
                seats: makeSeat(32),
            },
        ];

        let added = 0;
        for (const b of testBuses) {
            try {
                const exists = await Bus.findOne({ busNumber: b.busNumber });
                if (!exists) {
                    console.log(`📡 Creating bus: ${b.busNumber}`);
                    await Bus.create(b);
                    added++;
                } else {
                    console.log(`⏩ Bus ${b.busNumber} already exists`);
                }
            } catch (busErr) {
                console.error(`❌ Failed to create bus ${b.busNumber}:`, busErr.message);
                throw busErr; // Re-throw to be caught by outer catch
            }
        }
        res.json({ success: true, message: `Seeded ${added} test bus(es). ${testBuses.length - added} already existed.` });
    } catch (err) {
        console.error('🔥 Seed failed:', err);
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /api/owner/buses ─────────────────────────────────────────────────────
router.post('/buses', async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Database not connected' });
    try {
        const ownerId = await resolveUserId(req.user);
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

        // Extract schedule from the first route if provided
        let busDate = new Date().toISOString().split('T')[0];
        let busSchedule = {
            isScheduleActive: false,
            startTime: departureTime || '',
            endTime: arrivalTime || '',
            loopEnabled: false,
            loopIntervalMinutes: 60,
            activeDays: [],
            notes: ''
        };

        if (Array.isArray(routes) && routes.length > 0 && routes[0].schedule) {
            const sched = routes[0].schedule;
            if (sched.type === 'daily' || sched.type === 'days') {
                busSchedule = {
                    isScheduleActive: true,
                    startTime: sched.startTime || departureTime || '',
                    endTime: sched.endTime || arrivalTime || '',
                    loopEnabled: Boolean(sched.loopEnabled),
                    loopIntervalMinutes: Number(sched.loopIntervalMinutes) || 60,
                    activeDays: sched.type === 'daily' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : (sched.days || []),
                    notes: ''
                };
            } else if (sched.type === 'specific' && Array.isArray(sched.specificDates) && sched.specificDates.length > 0) {
                // If specific dates are provided, we use the first one as the primary date.
                // Advanced implementations could create multiple bus records or use an array.
                busDate = sched.specificDates[0];
            }
        }

        const busData = {
            busNumber, name, type,
            totalSeats: seats.length,
            seats,
            schedule: busSchedule,
            mileage: Number(mileage) || 4.0,
            departureTime: busSchedule.startTime || departureTime,
            arrivalTime: busSchedule.endTime || arrivalTime,
            date: busDate,
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
            owner: ownerId,
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
        const ownerId = await resolveUserId(req.user);
        const bus = await Bus.findOne({ _id: req.params.busId, owner: ownerId });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        res.json({ employees: bus.employees || [], employeeCode: bus.employeeCode });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST /api/owner/buses/:busId/employees ── Add a new driver ───────────────
router.post('/buses/:busId/employees', async (req, res) => {
    const { name, email, phone, perDaySalary } = req.body;
    if (!name) return res.status(400).json({ message: 'Driver name is required' });
    try {
        const ownerId = await resolveUserId(req.user);
        const bus = await Bus.findOne({ _id: req.params.busId, owner: ownerId });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        const user = email ? await User.findOne({ email: email.toLowerCase().trim() }) : null;
        if (email) {
            const alreadyAdded = bus.employees.some(e => e.email === email.toLowerCase().trim());
            if (alreadyAdded) return res.status(409).json({ message: 'Driver already added' });
        }

        const isLinkedToUser = !!user;
        const initialStatus = isLinkedToUser ? 'Pending' : 'Active';

        bus.employees.push({
            name: name.trim(),
            email: email ? email.toLowerCase().trim() : undefined,
            phone: phone || undefined,
            userId: user?._id || null,
            status: initialStatus,
            driverCode,
            perDaySalary: Number(perDaySalary) || 0,
            joinedAt: new Date(),
        });
        await bus.save();

        if (isLinkedToUser && user.role === 'Passenger') {
            const notif = new Notification({
                userId: user._id,
                type: 'info',
                title: 'Driving Offer Received',
                message: `${req.user.name || 'An owner'} has invited you to drive bus ${bus.busNumber}. Check your dashboard to accept.`
            });
            await notif.save();
        }

        const added = bus.employees[bus.employees.length - 1];
        res.status(201).json({ success: true, employee: added, driverCode, employees: bus.employees });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── PATCH /api/owner/buses/:busId/employees/:empId ── Update per-day salary ──
router.patch('/buses/:busId/employees/:empId', async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const bus = await Bus.findOne({ _id: req.params.busId, owner: ownerId });
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
        const ownerId = await resolveUserId(req.user);
        const bus = await Bus.findOne({ _id: req.params.busId, owner: ownerId });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        bus.employees = bus.employees.filter(e => e._id.toString() !== req.params.empId);
        await bus.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/owner/employees/all ─── All employees across all buses ──────────
router.get('/employees/all', async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const buses = await Bus.find({ owner: ownerId });
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
        const ownerId = await resolveUserId(req.user);
        const query = { owner: ownerId, employee: req.params.empId };
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
        const ownerId = await resolveUserId(req.user);
        const bus = await Bus.findOne({ owner: ownerId, 'employees._id': req.params.empId });
        if (!bus) return res.status(404).json({ message: 'Employee not found' });
        const emp = bus.employees.id(req.params.empId);

        const attendance = await Attendance.find({
            owner: ownerId,
            employee: emp.userId,
            date: { $regex: `^${month}` }
        }).sort({ date: 1 });

        const presentDays = attendance.filter(a => a.present).length;
        const baseSalary = presentDays * (emp.perDaySalary || 0);
        const totalHours = attendance.reduce((s, a) => s + (a.hoursWorked || 0), 0);

        // Overtime Calculation: Total hours - (Present days * 8 hours)
        const standardHours = presentDays * 8;
        const overtimeHours = Math.max(totalHours - standardHours, 0);
        const hourlyRate = (emp.perDaySalary || 0) / 8;
        const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5); // 1.5x for OT

        // Check if already paid
        const existingExpense = await Expense.findOne({
            owner: ownerId,
            category: 'Salary',
            'meta.empId': emp._id,
            'meta.monthYear': month
        });

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
                overtimeHours: record?.hoursWorked > 8 ? record.hoursWorked - 8 : 0
            };
        });

        res.json({
            employee: { id: emp._id, name: emp.name, email: emp.email, perDaySalary: emp.perDaySalary, driverCode: emp.driverCode },
            bus: { id: bus._id, busNumber: bus.busNumber, name: bus.name },
            month,
            presentDays,
            baseSalary,
            totalHours,
            overtimeHours,
            overtimePay,
            totalDue: baseSalary + overtimePay,
            isPaid: !!existingExpense,
            paymentDetails: existingExpense,
            days,
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST /api/owner/buses/:busId/employees/:empId/pay ── Pay Salary ──────────
router.post('/buses/:busId/employees/:empId/pay', async (req, res) => {
    try {
        const ownerId = await resolveUserId(req.user);
        const { monthYear, amount, hours, description } = req.body; // e.g {"monthYear": "2023-10", "amount": 15000}

        const bus = await Bus.findOne({ _id: req.params.busId, owner: ownerId });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        const employeeRecord = bus.employees.find(e => e._id.toString() === req.params.empId);
        if (!employeeRecord) return res.status(404).json({ message: 'Employee not found' });

        // Record it as an expense
        const newExpense = new Expense({
            owner: ownerId,
            bus: bus._id,
            amount: Number(amount),
            category: 'Salary',
            date: new Date(),
            description: `Salary for ${employeeRecord.name} (${monthYear}) - ${hours} hrs`,
            meta: { empId: employeeRecord._id, monthYear }
        });
        await newExpense.save();

        // Send notification to the driver if they have a userId
        if (employeeRecord.userId) {
            const notif = new Notification({
                userId: employeeRecord.userId,
                type: 'payment_received',
                title: 'Salary Paid',
                message: `Your salary for ${monthYear} (₹${amount}) has been paid by the owner.`
            });
            await notif.save();
        }

        res.json({ success: true, message: 'Salary marked as paid and expense recorded.', expense: newExpense });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST /api/owner/attendance/mark ── Manual attendance mark ────────────────
router.post('/attendance/mark', async (req, res) => {
    const { employeeId, busId, date, present, notes } = req.body;
    if (!employeeId || !busId || !date) return res.status(400).json({ message: 'employeeId, busId, date required' });
    try {
        const ownerId = await resolveUserId(req.user);
        const bus = await Bus.findOne({ _id: busId, owner: ownerId });
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        const emp = bus.employees.id(employeeId);
        if (!emp) return res.status(404).json({ message: 'Employee not found' });

        const rec = await Attendance.findOneAndUpdate(
            { employee: emp.userId, bus: busId, date },
            { $set: { owner: ownerId, present: present !== false, notes } },
            { upsert: true, new: true }
        );
        res.json({ success: true, record: rec });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
