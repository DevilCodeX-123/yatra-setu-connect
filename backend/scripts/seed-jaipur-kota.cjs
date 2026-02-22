const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Bus = require('../models/Bus');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedJaipurKota = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const startDate = new Date();
        const buses = [];

        for (let i = 0; i < 20; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            buses.push({
                busNumber: `JK-${1000 + i}`,
                name: 'Jaipur-Kota Express',
                operator: 'Yatra Setu Royals',
                type: 'Volvo',
                status: 'Active',
                totalSeats: 40,
                pricePerKm: 1.5,
                km: 250,
                departureTime: '08:00 AM',
                arrivalTime: '01:00 PM',
                date: dateStr,
                route: {
                    from: 'Jaipur',
                    to: 'Kota',
                    stops: [
                        { name: 'Jaipur', sequence: 0, price: 0 },
                        { name: 'Tonk', sequence: 1, price: 150 },
                        { name: 'Kota', sequence: 2, price: 450 }
                    ]
                },
                seats: Array.from({ length: 40 }, (_, index) => ({
                    number: index + 1,
                    status: 'Available',
                    reservedFor: 'general'
                }))
            });
        }

        console.log(`🚀 Seeding ${buses.length} buses for the next 20 days...`);
        // Delete existing Jaipur-Kota buses for cleanup if needed, but the user asked to ADD.
        // I'll just insert. If they exist, unique constraint on busNumber will fail if I reuse numbers.
        // I'll use unique enough numbers or check first.

        await Bus.insertMany(buses);
        console.log('✨ Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedJaipurKota();
