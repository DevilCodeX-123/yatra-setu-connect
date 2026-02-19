const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Bus = require('../models/Bus');
const Transaction = require('../models/Transaction');
const SupportTicket = require('../models/SupportTicket');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Bus.deleteMany({});
        await Transaction.deleteMany({});
        await SupportTicket.deleteMany({});
        console.log('🗑️ Cleared existing data.');

        // Seed Users
        const hashedPassword = await bcrypt.hash('password123', 10);
        const users = await User.insertMany([
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: hashedPassword,
                phone: '9876543210',
                role: 'Passenger',
                walletBalance: 500,
                age: 28,
                gender: 'male',
                isPhysicallyAbled: false
            },
            {
                name: 'Admin User',
                email: 'admin@yatrasetu.com',
                password: hashedPassword,
                phone: '1122334455',
                role: 'Admin',
                age: 35,
                gender: 'male'
            },
            {
                name: 'Robert Driver',
                email: 'robert@driver.com',
                password: hashedPassword,
                phone: '9988776655',
                role: 'Driver',
                age: 42,
                gender: 'male'
            }
        ]);
        console.log('👤 Seeded Users.');

        // Seed Buses
        const buses = await Bus.insertMany([
            {
                busNumber: 'KA-01-F-1234',
                operator: 'KSRTC - Airavat',
                route: {
                    from: 'Bengaluru',
                    to: 'Mysuru',
                    stops: ['Kengeri', 'Mandya']
                },
                departureTime: '06:00 AM',
                arrivalTime: '09:00 AM',
                type: 'Volvo AC',
                price: 350,
                totalSeats: 42,
                availableSeats: 35,
                amenities: ['WiFi', 'AC', 'Charging', 'Water'],
                km: 145,
                status: 'On Time'
            },
            {
                busNumber: 'KA-05-G-5678',
                operator: 'Yatra Setu Express',
                route: {
                    from: 'Bengaluru',
                    to: 'Chennai',
                    stops: ['Hosur', 'Vellore']
                },
                departureTime: '10:30 PM',
                arrivalTime: '05:30 AM',
                type: 'Sleeper AC',
                price: 850,
                totalSeats: 30,
                availableSeats: 12,
                amenities: ['AC', 'Charging', 'Blanket'],
                km: 350,
                status: 'On Time'
            },
            {
                busNumber: 'KA-19-M-9999',
                operator: 'KSRTC - Sarige',
                route: {
                    from: 'Mangaluru',
                    to: 'Bengaluru',
                    stops: ['Sakleshpur', 'Hassan']
                },
                departureTime: '08:00 AM',
                arrivalTime: '04:00 PM',
                type: 'Ordinary',
                price: 280,
                totalSeats: 55,
                availableSeats: 40,
                amenities: ['Charging'],
                km: 360,
                status: 'Delayed'
            }
        ]);
        console.log('🚌 Seeded Buses.');

        // Seed Transactions for John Doe
        await Transaction.insertMany([
            {
                user: users[0]._id,
                type: 'Credit',
                amount: 500,
                source: 'Added via UPI',
                status: 'Success'
            },
            {
                user: users[0]._id,
                type: 'Debit',
                amount: 350,
                source: 'Bus Ticket - Mysuru',
                status: 'Success'
            }
        ]);
        console.log('💸 Seeded Transactions.');

        // Seed Support Ticket for John Doe
        await SupportTicket.insertMany([
            {
                user: users[0]._id,
                subject: 'Refund Query',
                description: 'I cancelled my ticket but didn\'t get a refund yet.',
                category: 'Payment',
                priority: 'Medium',
                status: 'Open'
            }
        ]);
        console.log('📩 Seeded Support Tickets.');

        console.log('✨ Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedData();
