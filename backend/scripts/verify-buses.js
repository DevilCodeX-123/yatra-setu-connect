const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Bus = require('../models/Bus');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verifyBuses() {
    console.log('🔍 Verifying Seeded Buses...');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await Bus.countDocuments();
        console.log(`📊 Total buses in database: ${count}`);

        const latestBuses = await Bus.find().sort({ createdAt: -1 }).limit(15);
        console.log('\n🚍 15 Latest Added Buses:');
        latestBuses.forEach(bus => {
            console.log(`- ${bus.busNumber} (${bus.operator}) - ${bus.route.from} to ${bus.route.to} [Status: ${bus.status}]`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Verification failed:', err.message);
        process.exit(1);
    }
}

verifyBuses();
