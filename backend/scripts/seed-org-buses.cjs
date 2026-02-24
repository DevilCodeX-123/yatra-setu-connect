const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Bus = require('../models/Bus');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedOrgBuses = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const orgBuses = [
            {
                busNumber: 'DL-01-S-1001',
                name: 'DPS Noida School Bus',
                operator: 'Delhi Public School',
                type: 'Ordinary',
                status: 'Active',
                totalSeats: 50,
                orgCategory: 'School',
                orgName: 'Delhi Public School, Noida',
                state: 'Delhi',
                district: 'New Delhi',
                town: 'Noida',
                pinCode: '201301',
                liveLocation: { lat: 28.5355, lng: 77.3910, updatedAt: new Date(), source: 'gps' },
                route: { from: 'Noida Sec 62', to: 'DPS Noida' },
                activationCode: '123456',
                seats: Array.from({ length: 50 }, (_, i) => ({ number: i + 1, status: 'Available' }))
            },
            {
                busNumber: 'KA-01-C-2002',
                name: 'BMS College Shuttle',
                operator: 'BMS College of Engineering',
                type: 'Ordinary',
                status: 'Active',
                totalSeats: 40,
                orgCategory: 'College',
                orgName: 'BMS College of Engineering',
                state: 'Karnataka',
                district: 'Bengaluru Urban',
                town: 'Bengaluru',
                pinCode: '560019',
                liveLocation: { lat: 12.9351, lng: 77.6101, updatedAt: new Date(), source: 'gps' },
                route: { from: 'Koramangala', to: 'BMS College' },
                activationCode: '123456',
                seats: Array.from({ length: 40 }, (_, i) => ({ number: i + 1, status: 'Available' }))
            },
            {
                busNumber: 'MH-12-B-3003',
                name: 'Infosys Pune Office Bus',
                operator: 'Infosys IT Services',
                type: 'AC',
                status: 'Active',
                totalSeats: 35,
                orgCategory: 'Office',
                orgName: 'Infosys Pune Campus',
                state: 'Maharashtra',
                district: 'Pune',
                town: 'Pune',
                pinCode: '411057',
                liveLocation: { lat: 18.5679, lng: 73.9143, updatedAt: new Date(), source: 'gps' },
                route: { from: 'Kothrud', to: 'Infosys Campus' },
                activationCode: '123456',
                seats: Array.from({ length: 35 }, (_, i) => ({ number: i + 1, status: 'Available' }))
            },
            {
                busNumber: 'KA-01-S-4004',
                name: 'KV HSR School Bus',
                operator: 'Kendriya Vidyalaya',
                type: 'Ordinary',
                status: 'Active',
                totalSeats: 45,
                orgCategory: 'School',
                orgName: 'Kendriya Vidyalaya, HSR Layout',
                state: 'Karnataka',
                district: 'Bengaluru Urban',
                town: 'Bengaluru',
                pinCode: '560102',
                liveLocation: { lat: 12.9121, lng: 77.6446, updatedAt: new Date(), source: 'gps' },
                route: { from: 'HSR Layout', to: 'KV School' },
                activationCode: '123456',
                seats: Array.from({ length: 45 }, (_, i) => ({ number: i + 1, status: 'Available' }))
            },
            {
                busNumber: 'RJ-14-O-5005',
                name: 'HCL Jaipur Employee Bus',
                operator: 'HCL Technologies',
                type: 'Ordinary',
                status: 'Active',
                totalSeats: 40,
                orgCategory: 'Office',
                orgName: 'HCL Technologies Jaipur',
                state: 'Rajasthan',
                district: 'Jaipur',
                town: 'Jaipur',
                pinCode: '302022',
                liveLocation: { lat: 26.9124, lng: 75.7873, updatedAt: new Date(), source: 'gps' },
                route: { from: 'Mansarovar', to: 'HCL Campus' },
                activationCode: '123456',
                seats: Array.from({ length: 40 }, (_, i) => ({ number: i + 1, status: 'Available' }))
            }
        ];

        console.log(`🚀 Seeding ${orgBuses.length} organization buses...`);
        for (const bus of orgBuses) {
            await Bus.findOneAndUpdate({ busNumber: bus.busNumber }, bus, { upsert: true, new: true });
        }
        console.log('✨ Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedOrgBuses();
