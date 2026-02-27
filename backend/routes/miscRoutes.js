const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const SupportTicket = require('../models/SupportTicket');
const EmergencyAlert = require('../models/EmergencyAlert');
const User = require('../models/User');

const { MOCK_BUSES } = require('../data/mockData');
const { verifyToken, requireAuth, requireRole, resolveUserId } = require('../middleware/auth');

// Get Real-Time Statistics
router.get('/stats', async (req, res) => {
    const getLocalDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const queryDate = req.query.date || getLocalDate();

    if (mongoose.connection.readyState !== 1) {
        const busesOnDate = MOCK_BUSES.filter(b => b.date === queryDate);
        const totalPassengers = busesOnDate.length * 12; // Static estimation for demo
        const totalBusKm = busesOnDate.reduce((sum, b) => sum + (b.km || 250), 0);
        const totalPassengerKm = totalPassengers * (totalBusKm / (busesOnDate.length || 1));
        const co2SavedKg = (totalPassengerKm * 0.12) - (totalBusKm * 0.8);
        const activeRoutes = new Set(busesOnDate.map(b => `${b.route.from}-${b.route.to}`));

        return res.json({
            busesRunningToday: busesOnDate.length,
            passengersServed: totalPassengers,
            routesActive: activeRoutes.size,
            co2Saved: Math.max(0, Math.round(co2SavedKg))
        });
    }

    try {
        // 1. Fetch all buses for this specific date
        const busesOnDate = await Bus.find({ date: queryDate, status: 'Active' });

        // 2. Calculation: Passengers Served (Online + Offline)
        let totalPassengers = 0;
        let totalPassengerKm = 0;
        let totalBusKm = 0;
        const activeRoutes = new Set();

        for (const bus of busesOnDate) {
            // Count Offline (Cash) passengers from the current seat state
            const offlinePassengers = bus.seats.filter(s => s.status === 'Cash' || s.status === 'Booked').length;

            // Count Online passengers from Bookings for this specific bus
            const onlineBookings = await Booking.find({ bus: bus._id, status: { $ne: 'Cancelled' } });
            const onlinePassengers = onlineBookings.reduce((sum, b) => sum + (b.passengers ? b.passengers.length : 0), 0);

            const busTotalPass = Math.max(offlinePassengers, onlinePassengers); // Avoid double counting if sync is messy
            totalPassengers += busTotalPass;

            // CO2 Calculation Logic:
            // Passenger-Km: If these people used individual cars (avg 0.12kg CO2/km per person)
            // Bus-Km: The actual emission of the bus (avg 0.8kg CO2/km total)
            const busDistance = bus.km || 200; // Fallback to 200km if not set
            totalBusKm += busDistance;
            totalPassengerKm += (busTotalPass * busDistance);

            activeRoutes.add(`${bus.route.from}-${bus.route.to}`);
        }

        // CO2 Saved = (CO2 Car would emit) - (CO2 Bus emitted)
        // 0.12kg/km is per PRV (Passenger Vehicle), 0.8kg/km is for a heavy Bus.
        const co2SavedKg = (totalPassengerKm * 0.12) - (totalBusKm * 0.8);

        res.json({
            busesRunningToday: busesOnDate.length || 0,
            passengersServed: totalPassengers || 0,
            routesActive: activeRoutes.size || 0,
            co2Saved: Math.max(0, Math.round(co2SavedKg)) // Ensure no negative savings shown
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Create Support Ticket
router.post('/support', verifyToken, requireAuth, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(201).json({ id: 'demo-support-' + Date.now(), ...req.body });
    }
    try {
        const ticket = new SupportTicket({
            user: await resolveUserId(req.user),
            ...req.body
        });
        await ticket.save();
        res.status(201).json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Emergency Alert
router.post('/emergency', verifyToken, requireAuth, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(201).json({ id: 'demo-sos-' + Date.now(), ...req.body });
    }
    try {
        const alert = new EmergencyAlert({
            user: req.user.id,
            ...req.body
        });
        await alert.save();
        res.status(201).json(alert);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── Admin Stats (Admin only) ──────────────────────────────────────────────────
router.get('/admin/stats', verifyToken, requireAuth, requireRole('Admin'), async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json({ totalBuses: 0, totalUsers: 0, totalEmployees: 0, totalBookings: 0, totalAlerts: 0, activeRoutes: 0, totalRevenue: 0, allBuses: [] });
    }
    try {
        const [totalBuses, totalUsers, totalEmployees, totalBookings, totalAlerts, allBuses, revenueAgg] = await Promise.all([
            Bus.countDocuments(),
            User.countDocuments(),
            User.countDocuments({ role: 'Employee' }),
            require('../models/Booking').countDocuments(),
            EmergencyAlert.countDocuments(),
            Bus.find().select('busNumber status route liveLocation owner employees').populate('owner', 'name email').limit(50),
            require('../models/Booking').aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
        ]);
        const activeRoutes = new Set(allBuses.filter(b => b.status === 'Active').map(b => `${b.route?.from}-${b.route?.to}`)).size;
        res.json({
            totalBuses, totalUsers, totalEmployees, totalBookings, totalAlerts,
            activeRoutes,
            totalRevenue: revenueAgg[0]?.total || 0,
            allBuses: allBuses.map(b => ({
                _id: b._id, busNumber: b.busNumber, status: b.status,
                from: b.route?.from, to: b.route?.to,
                ownerName: b.owner?.name, ownerEmail: b.owner?.email,
                lat: b.liveLocation?.lat, lng: b.liveLocation?.lng,
                employeeCount: b.employees?.length || 0
            }))
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
