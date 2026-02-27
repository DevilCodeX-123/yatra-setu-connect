const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Bus = require('../models/Bus');

const { verifyToken, requireAuth, resolveUserId } = require('../middleware/auth');

// Get all bookings for the user
router.get('/', verifyToken, requireAuth, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json([
            {
                pnr: 'YS1234567890',
                user: req.user.id,
                bus: {
                    busNumber: 'KA-01-F-1234',
                    operator: 'KSRTC',
                    departureTime: '06:30',
                    arrivalTime: '09:15',
                    route: { from: 'Bengaluru', to: 'Mysuru' }
                },
                passengers: [{ name: 'Demo User', seatNumber: 5 }],
                date: new Date().toISOString().split('T')[0],
                amount: 180,
                status: 'Confirmed',
                createdAt: new Date()
            }
        ]);
    }
    try {
        const userId = await resolveUserId(req.user);
        const bookings = await Booking.find({ user: userId }).populate('bus').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new booking
router.post('/', verifyToken, requireAuth, async (req, res) => {
    const { busId, passengers, date, amount, fromStop, toStop } = req.body;

    if (mongoose.connection.readyState !== 1) {
        const pnr = 'YS' + Date.now().toString().slice(-10);
        return res.status(201).json({
            pnr,
            user: req.user.id,
            bus: busId,
            passengers,
            date,
            amount,
            fromStop,
            toStop,
            paymentStatus: 'Completed',
            status: 'Confirmed',
            createdAt: new Date()
        });
    }

    try {
        const bus = await Bus.findById(busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        // Check if dates are already booked for rental
        if (bus.bookedDates && bus.bookedDates.includes(date)) {
            return res.status(400).json({ message: 'Bus is booked for rental on this date' });
        }

        const userId = await resolveUserId(req.user);
        const pnr = 'YS' + Date.now().toString().slice(-10);
        const booking = new Booking({
            pnr,
            user: userId,
            bus: bus._id,
            passengers,
            date,
            amount,
            fromStop,
            toStop,
            paymentStatus: 'Completed'
        });

        await booking.save();

        if (!bus.bookedSeats) bus.bookedSeats = [];
        passengers.forEach(p => {
            if (p.seatNumber) bus.bookedSeats.push(Number(p.seatNumber));
        });
        await bus.save();

        res.status(201).json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify ticket by PNR
router.get('/verify/:pnr', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.json({
            pnr: req.params.pnr,
            user: 'demo-user',
            bus: {
                busNumber: 'KA-01-F-1234',
                operator: 'KSRTC',
                route: { from: 'Bengaluru', to: 'Mysuru' }
            },
            passengers: [{ name: 'Demo User', seatNumber: 5 }],
            status: 'Confirmed'
        });
    }
    try {
        const booking = await Booking.findOne({ pnr: req.params.pnr }).populate('bus');
        if (!booking) return res.status(404).json({ message: 'Ticket not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a rental request
router.post('/rental-request', verifyToken, requireAuth, async (req, res) => {
    const {
        busId,
        startDate,
        endDate,
        startTime,
        isRoundTrip,
        fromLocation,
        destination,
        purpose,
        estimatedKm,
        hoursRequested
    } = req.body;

    const FUEL_PRICE = 100;

    if (mongoose.connection.readyState !== 1) {
        // Mock for demo
        const mockMileage = 4.0;
        const mockHourlyRate = 500;

        const totalFuelKm = isRoundTrip ? (Number(estimatedKm) * 2) : (Number(estimatedKm) * 1.5); // Default 50% for one-way in mock

        const baseRent = (hoursRequested || 24) * mockHourlyRate;
        const fuelCost = (totalFuelKm / mockMileage) * FUEL_PRICE;
        const totalAmount = baseRent + fuelCost;

        return res.status(201).json({
            pnr: 'RN' + Date.now().toString().slice(-10),
            user: req.user.id,
            bus: busId,
            bookingType: 'FullBus',
            rentalDetails: {
                startDate,
                endDate,
                startTime,
                isRoundTrip,
                fromLocation,
                destination,
                purpose,
                estimatedKm,
                hoursRequested,
                fuelPrice: FUEL_PRICE,
                calculatedFuelCost: fuelCost,
                totalFuelKm
            },
            date: new Date(),
            status: 'PendingOwner',
            amount: totalAmount,
            depositAmount: totalAmount * 0.5
        });
    }

    try {
        const bus = await Bus.findById(busId);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        const returnChargePercentage = bus.oneWayReturnChargePercentage || 50;
        const totalFuelKm = isRoundTrip ? (Number(estimatedKm) * 2) : (Number(estimatedKm) * (1 + (returnChargePercentage / 100)));

        const baseRent = (hoursRequested || 24) * (bus.rentalPricePerHour || 500);
        const fuelCost = (totalFuelKm / (bus.mileage || 4.0)) * FUEL_PRICE;
        const totalAmount = baseRent + fuelCost;

        const userId = await resolveUserId(req.user);
        const pnr = 'RN' + Date.now().toString().slice(-10);
        const booking = new Booking({
            pnr,
            user: userId,
            bus: bus._id,
            bookingType: 'FullBus',
            rentalDetails: {
                startDate,
                endDate,
                startTime,
                isRoundTrip,
                fromLocation,
                destination,
                purpose,
                estimatedKm,
                hoursRequested,
                totalFuelKm,
                fuelPrice: FUEL_PRICE,
                calculatedFuelCost: fuelCost,
                returnChargePercentage
            },
            date: new Date(),
            amount: totalAmount,
            depositAmount: totalAmount * 0.5,
            status: 'PendingOwner'
        });

        await booking.save();
        res.status(201).json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get rental requests for owner
router.get('/owner/requests', verifyToken, requireAuth, async (req, res) => {
    try {
        const userId = await resolveUserId(req.user);
        const myBuses = await Bus.find({ owner: userId }).select('_id');
        const busIds = myBuses.map(b => b._id);

        const requests = await Booking.find({
            bus: { $in: busIds },
            bookingType: 'FullBus'
        }).populate('user').populate('bus');

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Owner Accept/Reject Request
router.patch('/owner/request/:id', verifyToken, requireAuth, async (req, res) => {
    const { status } = req.body; // 'Accepted' or 'Rejected'
    try {
        const booking = await Booking.findById(req.params.id).populate('bus');
        if (!booking) return res.status(404).json({ message: 'Request not found' });

        // Verify owner
        const userId = await resolveUserId(req.user);
        if (booking.bus.owner.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        booking.status = status;
        if (status === 'Accepted' && req.body.advanceAmount) {
            booking.advanceAmount = req.body.advanceAmount;
        }
        await booking.save();

        // Notify user
        try {
            const Notification = require('../models/Notification');
            const bus = booking.bus;
            await Notification.create({
                userId: booking.user,
                type: status === 'Accepted' ? 'success' : 'warning',
                title: status === 'Accepted' ? 'Rental Request Accepted!' : 'Rental Request Rejected',
                message: status === 'Accepted'
                    ? `Your rental for bus ${bus.busNumber} to ${booking.rentalDetails.destination} is accepted. Please pay ₹${booking.advanceAmount || 0} as advance.`
                    : `Sorry, your rental request for ${bus.busNumber} was rejected.`
            });
        } catch (notifyErr) {
            console.error("Notification failed", notifyErr);
        }

        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Pay Deposit
router.post('/:id/pay-deposit', verifyToken, requireAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        const userId = await resolveUserId(req.user);
        if (booking.user.toString() !== userId.toString()) return res.status(403).json({ message: 'Unauthorized' });

        booking.paymentStatus = 'DepositPaid';
        booking.isDepositPaid = true;
        booking.status = 'Confirmed';

        await booking.save();

        // Mark dates as booked in Bus model to cancel regular routes
        const bus = await Bus.findById(booking.bus);
        if (bus) {
            const dateStr = new Date(booking.rentalDetails.startDate).toISOString().split('T')[0];
            if (!bus.bookedDates) bus.bookedDates = [];
            bus.bookedDates.push(dateStr);
            await bus.save();
        }

        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update bus settings (Owner only)
router.patch('/owner/bus/:id/settings', verifyToken, requireAuth, async (req, res) => {
    const { oneWayReturnChargePercentage, rentalPricePerHour } = req.body;
    try {
        const bus = await Bus.findById(req.params.id);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        const userId = await resolveUserId(req.user);
        if (bus.owner.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (oneWayReturnChargePercentage !== undefined) bus.oneWayReturnChargePercentage = oneWayReturnChargePercentage;
        if (rentalPricePerHour !== undefined) bus.rentalPricePerHour = rentalPricePerHour;

        await bus.save();
        res.json(bus);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get chat history for a booking
router.get('/:id/chat', verifyToken, requireAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).select('chatHistory');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking.chatHistory);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send a message in booking chat
router.post('/:id/chat', verifyToken, requireAuth, async (req, res) => {
    const { message } = req.body;
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const userId = await resolveUserId(req.user);
        const sender = booking.user.toString() === userId.toString() ? 'User' : 'Owner';

        booking.chatHistory.push({
            sender,
            message,
            timestamp: new Date()
        });

        await booking.save();
        res.status(201).json(booking.chatHistory[booking.chatHistory.length - 1]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

