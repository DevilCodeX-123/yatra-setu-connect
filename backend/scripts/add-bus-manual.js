const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Bus = require('../models/Bus');
const User = require('../models/User');

const addBus = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI not found in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB...');

        // 1. Find or Create an Owner
        let owner = await User.findOne({ role: { $in: ['Owner', 'Admin', 'Owner+Employee'] } });
        if (!owner) {
            console.log('👤 No owner found, creating a test owner...');
            owner = new User({
                name: 'Test Owner',
                email: 'testowner@yatrasetu.com',
                password: 'password123', // Not ideal but okay for seeding
                role: 'Owner',
                upiId: '8302391227@ybl'
            });
            await owner.save();
        }
        console.log(`👤 Using Owner: ${owner.email} (${owner._id})`);

        // 2. Add the Test Bus
        const busNumber = 'YS-101';
        const activationCode = '123456';

        await Bus.deleteMany({ busNumber }); // Clear existing test bus if any

        const newBus = new Bus({
            busNumber,
            activationCode,
            name: 'Yatra Setu Test Express',
            operator: 'Yatra Setu Official',
            type: 'Volvo',
            status: 'Active',
            totalSeats: 40,
            pricePerKm: 2.0,
            owner: owner._id,
            route: {
                from: 'Jaipur',
                to: 'Kota',
                stops: [
                    { name: 'Jaipur Junction', lat: 26.9197, lng: 75.7878, price: 0, sequence: 0 },
                    { name: 'Kota Terminal', lat: 25.1761, lng: 75.8362, price: 250, sequence: 1 }
                ]
            },
            seats: Array.from({ length: 40 }, (_, i) => ({
                number: i + 1,
                status: 'Available',
                reservedFor: 'general'
            }))
        });

        await newBus.save();
        console.log(`🎉 Bus Added Successfully!`);
        console.log(`-------------------------`);
        console.log(`🚌 Bus Number: ${busNumber}`);
        console.log(`🔑 Activation Code: ${activationCode}`);
        console.log(`-------------------------`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to add bus:', err);
        process.exit(1);
    }
};

addBus();
