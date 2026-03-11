const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Bus = require('../models/Bus');

const premiumBuses = [
    {
        busNumber: "KA-01-F-5678",
        operator: "KSRTC - Airavat Club Class",
        busType: "Volvo Multi-Axle AC",
        type: "Volvo",
        route: {
            from: "Mysuru",
            to: "Bengaluru",
            stops: [
                { name: "Mysuru Central", lat: 12.2958, lng: 76.6394, arrivalTime: "07:00 AM", sequence: 0 },
                { name: "Mandya", lat: 12.5221, lng: 76.8967, arrivalTime: "08:15 AM", sequence: 1 },
                { name: "Bengaluru Satellite", lat: 12.9716, lng: 77.5946, arrivalTime: "09:45 AM", sequence: 2 }
            ]
        },
        departureTime: "07:00 AM",
        arrivalTime: "09:45 AM",
        status: "Active",
        totalSeats: 42,
        availableSeats: 12,
        price: 450,
        rentalPricePerDay: 18500,
        rentalCapacity: 40,
        mileage: 3.8,
        rating: 4.8,
        isRentalEnabled: true,
        amenities: ["WiFi", "AC", "Charging Port", "Water Bottle", "Blanket", "Movies"],
        km: 145
    },
    {
        busNumber: "KA-01-F-9012",
        operator: "Yatra Setu Elite",
        busType: "Mercedes-Benz Glider",
        type: "Volvo",
        route: {
            from: "Bengaluru",
            to: "Mangaluru",
            stops: [
                { name: "Majestic", lat: 12.9716, lng: 77.5946, arrivalTime: "10:00 PM", sequence: 0 },
                { name: "Hassan", lat: 13.0072, lng: 76.1029, arrivalTime: "02:30 AM", sequence: 1 },
                { name: "Mangaluru Central", lat: 12.9141, lng: 74.8560, arrivalTime: "05:30 AM", sequence: 2 }
            ]
        },
        departureTime: "10:00 PM",
        arrivalTime: "05:30 AM",
        status: "Active",
        totalSeats: 52,
        availableSeats: 28,
        price: 1250,
        rentalPricePerDay: 24000,
        rentalCapacity: 50,
        mileage: 4.2,
        rating: 4.9,
        isRentalEnabled: true,
        amenities: ["Premium Seats", "AC", "WiFi", "Emergency Toilet", "Live Tracking"],
        km: 352
    },
    {
        busNumber: "KA-01-F-1234",
        operator: "KSRTC - Ashvamedha",
        busType: "Point-to-Point Express",
        type: "Express",
        route: {
            from: "Bengaluru",
            to: "Mysuru",
            stops: [
                { name: "Bengaluru", lat: 12.9716, lng: 77.5946, arrivalTime: "06:30 AM", sequence: 0 },
                { name: "Mysuru", lat: 12.2958, lng: 76.6394, arrivalTime: "09:15 AM", sequence: 1 }
            ]
        },
        departureTime: "06:30 AM",
        arrivalTime: "09:15 AM",
        status: "Active",
        totalSeats: 48,
        availableSeats: 5,
        price: 240,
        rentalPricePerDay: 12000,
        rentalCapacity: 45,
        mileage: 5.5,
        rating: 4.2,
        isRentalEnabled: true,
        amenities: ["Limited Stops", "Pushback Seats"],
        km: 145
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // Upsert by busNumber to avoid duplicates but update info
        for (const bus of premiumBuses) {
            await Bus.findOneAndUpdate(
                { busNumber: bus.busNumber },
                bus,
                { upsert: true, new: true }
            );
            console.log(`🚌 Synced Bus: ${bus.busNumber} (${bus.operator})`);
        }

        console.log('✨ Premium Fleet Sync Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Sync failed:', err.message);
        process.exit(1);
    }
}

seed();
