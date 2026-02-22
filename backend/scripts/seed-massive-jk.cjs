const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Bus = require('../models/Bus');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedMassiveJaipurKota = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const startDate = new Date();
        const buses = [];
        const times = [
            '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
            '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
            '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
            '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM', '01:00 AM'
        ];

        for (let day = 0; day < 5; day++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + day);
            const dateStr = date.toISOString().split('T')[0];

            for (let b = 0; b < 20; b++) {
                const busIndex = (day * 20) + b;
                const departureTime = times[b] || '08:00 AM';

                buses.push({
                    busNumber: `JK-MASS-${busIndex + 1000}`,
                    name: 'Jaipur-Kota Express (H-Freq)',
                    operator: 'Yatra Setu Royals',
                    type: b % 2 === 0 ? 'Volvo' : 'AC',
                    status: 'Active',
                    totalSeats: 40,
                    pricePerKm: 1.5,
                    km: 250,
                    departureTime: departureTime,
                    arrivalTime: '05:00 PM', // Simplified
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
        }

        console.log(`🚀 Seeding ${buses.length} buses (20 per day for 5 days)...`);
        await Bus.insertMany(buses);
        console.log('✨ Massive seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedMassiveJaipurKota();
