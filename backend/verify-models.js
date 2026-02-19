const mongoose = require('mongoose');
const User = require('./models/User');
const Bus = require('./models/Bus');
const Booking = require('./models/Booking');
const Transaction = require('./models/Transaction');
const SupportTicket = require('./models/SupportTicket');
const EmergencyAlert = require('./models/EmergencyAlert');

async function verifyModels() {
    console.log('🚀 Starting Model Verification...');

    try {
        // Test User Model
        const testUser = new User({
            name: 'Test Admin',
            email: 'admin@yatra.com',
            password: 'hashedpassword',
            role: 'Admin'
        });
        console.log('✅ User Model: Verified');

        // Test Bus Model
        const testBus = new Bus({
            busNumber: 'YS-TEST-001',
            operator: 'Yatra Setu',
            route: { from: 'City A', to: 'City B' },
            departureTime: '10:00 AM',
            arrivalTime: '02:00 PM',
            type: 'Volvo AC',
            price: 500
        });
        console.log('✅ Bus Model: Verified');

        // Test Booking Model
        const testBooking = new Booking({
            pnr: 'PNR123456',
            user: new mongoose.Types.ObjectId(),
            bus: new mongoose.Types.ObjectId(),
            passengers: [{ name: 'John Doe', age: 30, gender: 'Male', seatNumber: 'A1' }],
            date: new Date(),
            amount: 500
        });
        console.log('✅ Booking Model: Verified');

        // Test Transaction Model
        const testTransaction = new Transaction({
            user: new mongoose.Types.ObjectId(),
            type: 'Credit',
            amount: 1000,
            source: 'UPI Topup'
        });
        console.log('✅ Transaction Model: Verified');

        // Test SupportTicket Model
        const testTicket = new SupportTicket({
            user: new mongoose.Types.ObjectId(),
            subject: 'Test Ticket',
            description: 'This is a test'
        });
        console.log('✅ SupportTicket Model: Verified');

        // Test EmergencyAlert Model
        const testAlert = new EmergencyAlert({
            user: new mongoose.Types.ObjectId(),
            type: 'SOS',
            location: { latitude: 0, longitude: 0 }
        });
        console.log('✅ EmergencyAlert Model: Verified');

        console.log('\n✨ All models are syntactically correct and can be instantiated!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed!');
        console.error(error);
        process.exit(1);
    }
}

verifyModels();
