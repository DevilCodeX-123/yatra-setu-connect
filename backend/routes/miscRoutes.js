const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const SupportTicket = require('../models/SupportTicket');
const EmergencyAlert = require('../models/EmergencyAlert');
const User = require('../models/User');

// Get Real-Time Statistics
router.get('/stats', async (req, res) => {
    try {
        const todayStr = "2026-02-20"; // Hardcoded for current testing date context

        // 1. Buses Running Today (Real count from DB)
        const busesTodayCount = await Bus.countDocuments({ date: todayStr });

        // 2. Total Passengers Served (Real sum from all bookings)
        const allBookings = await Booking.find({});
        const totalPassengers = allBookings.reduce((sum, b) => sum + (b.passengers ? b.passengers.length : 0), 0);

        // 3. Active Routes (Unique from-to pairs)
        const distinctRoutes = await Bus.aggregate([
            { $group: { _id: { from: "$route.from", to: "$route.to" } } },
            { $count: "count" }
        ]);
        const routesActive = distinctRoutes[0]?.count || 0;

        // 4. CO2 Savings (KG) - Purely Driven by KM data and Passenger count
        // We aggregate bookings, lookup bus KM, and multiply by 0.133 (Saving per passenger-km)
        const co2Aggregation = await Booking.aggregate([
            {
                $lookup: {
                    from: 'buses',
                    localField: 'bus',
                    foreignField: '_id',
                    as: 'bus'
                }
            },
            { $unwind: '$bus' },
            {
                $project: {
                    passengerCount: { $size: { $ifNull: ["$passengers", []] } },
                    km: { $ifNull: ["$bus.km", 0] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalPassengerKm: { $sum: { $multiply: ["$passengerCount", "$km"] } }
                }
            }
        ]);

        const totalPassengerKm = co2Aggregation[0]?.totalPassengerKm || 0;
        const co2Saved = Math.round(totalPassengerKm * 0.133);

        res.json({
            busesRunningToday: busesTodayCount,
            passengersServed: totalPassengers,
            routesActive: routesActive,
            co2Saved: co2Saved
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ message: err.message });
    }
});

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
