const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Adjust path to .env
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

const Bus = require('./models/Bus');

async function seed() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error('❌ MONGODB_URI not found in environment');
            process.exit(1);
        }

        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ Connected.');

        const rtuBus = {
            busNumber: 'RJ-20-C-7007',
            name: 'RTU Kota Shuttle',
            orgCategory: 'College',
            orgName: 'RTU Kota',
            state: 'Rajasthan',
            district: 'Kota',
            town: 'Kota',
            pinCode: '324010',
            activationCode: '123456',
            status: 'Active',
            liveLocation: { lat: 25.1311, lng: 75.8034, source: 'gps' },
            route: { from: 'Nayapura', to: 'RTU Campus' },
            type: 'Volvo',
            totalSeats: 40,
            pricePerKm: 1.5,
            date: new Date().toISOString().split('T')[0],
            seats: Array.from({ length: 40 }, (_, i) => ({
                number: i + 1,
                status: 'Available',
                reservedFor: 'general'
            }))
        };

        const doc = await Bus.findOneAndUpdate(
            { busNumber: rtuBus.busNumber },
            { $set: rtuBus },
            { upsert: true, new: true }
        );

        console.log('✨ RTU Kota Bus synced successfully:', doc.busNumber);
        process.exit(0);
    } catch (err) {
        console.error('🔥 Error during seeding:', err);
        process.exit(1);
    }
}

seed();
