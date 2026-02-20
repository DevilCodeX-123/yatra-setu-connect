const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Bus = require('../models/Bus');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const busData = [
    {
        busNumber: "DL-01-B-5566",
        operator: "DTC",
        route: {
            from: "Delhi", to: "Jaipur",
            stops: [
                { name: "Gurugram", lat: 28.4595, lng: 77.0266 },
                { name: "Rewari", lat: 28.1833, lng: 76.6167 },
                { name: "Alwar", lat: 27.5530, lng: 76.6346 }
            ]
        },
        departureTime: "08:00",
        arrivalTime: "13:30",
        type: "Volvo AC",
        price: 850,
        totalSeats: 45,
        availableSeats: 20,
        amenities: ["AC", "WiFi", "Charging Port"],
        status: "On Time",
        liveLocation: { latitude: 28.4595, longitude: 77.0266, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 280
    },
    {
        busNumber: "MH-12-PQ-9988",
        operator: "MSRTC",
        route: {
            from: "Mumbai", to: "Pune",
            stops: [
                { name: "Navi Mumbai", lat: 19.0330, lng: 73.0297 },
                { name: "Lonavala", lat: 18.7500, lng: 73.4000 }
            ]
        },
        departureTime: "09:15",
        arrivalTime: "12:45",
        type: "Express",
        price: 450,
        totalSeats: 50,
        availableSeats: 15,
        amenities: ["Pushback Seats"],
        status: "Delayed 15 min",
        liveLocation: { latitude: 19.0330, longitude: 73.0297, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 150
    },
    {
        busNumber: "KA-51-AA-1212",
        operator: "KSRTC",
        route: {
            from: "Bengaluru", to: "Chennai",
            stops: [
                { name: "Hosur", lat: 12.7409, lng: 77.8253 },
                { name: "Vellore", lat: 12.9165, lng: 79.1325 }
            ]
        },
        departureTime: "06:30",
        arrivalTime: "13:00",
        type: "Volvo Multi-Axle",
        price: 1100,
        totalSeats: 48,
        availableSeats: 10,
        amenities: ["AC", "WiFi", "USB Charging", "Blanket"],
        status: "On Time",
        liveLocation: { latitude: 12.7409, longitude: 77.8253, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 350
    },
    {
        busNumber: "TN-01-AN-4545",
        operator: "SETC",
        route: {
            from: "Chennai", to: "Madurai",
            stops: [
                { name: "Vilppuram", lat: 11.9401, lng: 79.4861 },
                { name: "Trichy", lat: 10.7905, lng: 78.7047 }
            ]
        },
        departureTime: "21:00",
        arrivalTime: "05:30",
        type: "AC Sleeper",
        price: 950,
        totalSeats: 30,
        availableSeats: 5,
        amenities: ["AC", "Sleeper", "Reading Light"],
        status: "On Time",
        liveLocation: { latitude: 11.9401, longitude: 79.4861, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 450
    },
    {
        busNumber: "GJ-01-ZZ-9090",
        operator: "GSRTC",
        route: {
            from: "Ahmedabad", to: "Surat",
            stops: [
                { name: "Nadiad", lat: 22.6916, lng: 72.8634 },
                { name: "Vadodara", lat: 22.3072, lng: 73.1812 },
                { name: "Bharuch", lat: 21.7051, lng: 72.9959 }
            ]
        },
        departureTime: "07:45",
        arrivalTime: "12:15",
        type: "Non-AC Express",
        price: 320,
        totalSeats: 55,
        availableSeats: 40,
        amenities: ["Emergency Exit"],
        status: "On Time",
        liveLocation: { latitude: 22.6916, longitude: 72.8634, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 260
    },
    {
        busNumber: "UP-32-BT-1122",
        operator: "UPSRTC",
        route: {
            from: "Lucknow", to: "Varanasi",
            stops: [
                { name: "Raebareli", lat: 26.2255, lng: 81.2403 },
                { name: "Prayagraj", lat: 25.4358, lng: 81.8463 }
            ]
        },
        departureTime: "10:00",
        arrivalTime: "16:00",
        type: "Janrath AC",
        price: 550,
        totalSeats: 42,
        availableSeats: 25,
        amenities: ["AC", "Water Bottle"],
        status: "On Time",
        liveLocation: { latitude: 26.2255, longitude: 81.2403, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 320
    },
    {
        busNumber: "WB-23-CC-3344",
        operator: "WBTC",
        route: {
            from: "Kolkata", to: "Durgapur",
            stops: [
                { name: "Burdwan", lat: 23.2324, lng: 87.8615 }
            ]
        },
        departureTime: "14:30",
        arrivalTime: "18:00",
        type: "AC Chair Car",
        price: 400,
        totalSeats: 40,
        availableSeats: 12,
        amenities: ["AC", "WiFi"],
        status: "Delayed 30 min",
        liveLocation: { latitude: 23.2324, longitude: 87.8615, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 170
    },
    {
        busNumber: "HR-55-DD-5566",
        operator: "Haryana Roadways",
        route: {
            from: "Chandigarh", to: "Shimla",
            stops: [
                { name: "Kalka", lat: 30.8333, lng: 76.9333 },
                { name: "Solan", lat: 30.9033, lng: 77.0967 }
            ]
        },
        departureTime: "05:00",
        arrivalTime: "09:00",
        type: "Himgauge",
        price: 250,
        totalSeats: 35,
        availableSeats: 8,
        amenities: ["Mountain View"],
        status: "On Time",
        liveLocation: { latitude: 30.8333, longitude: 76.9333, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 110
    },
    {
        busNumber: "TS-09-UB-7788",
        operator: "TSRTC",
        route: {
            from: "Hyderabad", to: "Warangal",
            stops: [
                { name: "Bhongir", lat: 17.5115, lng: 78.8889 },
                { name: "Jangaon", lat: 17.7214, lng: 79.1633 }
            ]
        },
        departureTime: "11:00",
        arrivalTime: "14:30",
        type: "Super Luxury",
        price: 280,
        totalSeats: 48,
        availableSeats: 20,
        amenities: ["Pushback Seats", "CCTV"],
        status: "On Time",
        liveLocation: { latitude: 17.5115, longitude: 78.8889, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 150
    },
    {
        busNumber: "RJ-14-GH-1234",
        operator: "RSRTC",
        route: {
            from: "Jaipur", to: "Udaipur",
            stops: [
                { name: "Ajmer", lat: 26.4499, lng: 74.6399 },
                { name: "Bhilwara", lat: 25.3407, lng: 74.6313 }
            ]
        },
        departureTime: "22:00",
        arrivalTime: "06:30",
        type: "Gold Line AC",
        price: 780,
        totalSeats: 42,
        availableSeats: 18,
        amenities: ["AC", "WiFi", "Water Bottle"],
        status: "On Time",
        liveLocation: { latitude: 26.4499, longitude: 74.6399, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 400
    },
    {
        busNumber: "MP-04-HE-5678",
        operator: "MPTC",
        route: {
            from: "Bhopal", to: "Indore",
            stops: [
                { name: "Sehore", lat: 23.2031, lng: 77.0844 },
                { name: "Dewas", lat: 22.9624, lng: 76.0508 }
            ]
        },
        departureTime: "13:00",
        arrivalTime: "16:45",
        type: "Intercity Express",
        price: 350,
        totalSeats: 50,
        availableSeats: 30,
        amenities: ["USB Charging"],
        status: "On Time",
        liveLocation: { latitude: 23.2031, longitude: 77.0844, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 190
    },
    {
        busNumber: "KL-01-ZZ-1122",
        operator: "KSRTC Kerala",
        route: {
            from: "Kochi", to: "Trivandrum",
            stops: [
                { name: "Alappuzha", lat: 9.4981, lng: 76.3388 },
                { name: "Kollam", lat: 8.8932, lng: 76.6141 }
            ]
        },
        departureTime: "06:00",
        arrivalTime: "10:30",
        type: "Minnal",
        price: 450,
        totalSeats: 40,
        availableSeats: 12,
        amenities: ["Fast Travel"],
        status: "On Time",
        liveLocation: { latitude: 9.4981, longitude: 76.3388, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 210
    },
    {
        busNumber: "AP-01-XY-3344",
        operator: "APSRTC",
        route: {
            from: "Vijayawada", to: "Visakhapatnam",
            stops: [
                { name: "Eluru", lat: 16.7107, lng: 81.1035 },
                { name: "Rajahmundry", lat: 17.0005, lng: 81.7729 }
            ]
        },
        departureTime: "23:00",
        arrivalTime: "06:00",
        type: "Amaravati AC",
        price: 880,
        totalSeats: 45,
        availableSeats: 15,
        amenities: ["AC", "WiFi", "Blanket"],
        status: "On Time",
        liveLocation: { latitude: 16.7107, longitude: 81.1035, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 350
    },
    {
        busNumber: "BR-01-PB-5566",
        operator: "BSRTC",
        route: {
            from: "Patna", to: "Gaya",
            stops: [
                { name: "Jehanabad", lat: 25.2154, lng: 84.9924 }
            ]
        },
        departureTime: "08:30",
        arrivalTime: "11:30",
        type: "Ordinary",
        price: 150,
        totalSeats: 52,
        availableSeats: 22,
        amenities: ["Emergency Exit"],
        status: "On Time",
        liveLocation: { latitude: 25.2154, longitude: 84.9924, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 100
    },
    {
        busNumber: "OD-02-RR-7788",
        operator: "OSRTC",
        route: {
            from: "Bhubaneswar", to: "Puri",
            stops: [
                { name: "Pipili", lat: 20.1082, lng: 85.8340 }
            ]
        },
        departureTime: "15:00",
        arrivalTime: "16:30",
        type: "Non-AC Deluxe",
        price: 120,
        totalSeats: 50,
        availableSeats: 35,
        amenities: ["Pushback Seats"],
        status: "On Time",
        liveLocation: { latitude: 20.1082, longitude: 85.8340, lastUpdated: new Date() },
        date: "2026-02-20",
        km: 60
    }
];

const User = require('../models/User');
const Booking = require('../models/Booking');

async function seedBuses() {
    console.log('🌱 Seeding 15 Live Buses & Mock Bookings...');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Bus.deleteMany({});
        await Booking.deleteMany({});
        // Keep users or recreate a test user
        let user = await User.findOne({ email: 'test@yatrasetu.com' });
        if (!user) {
            user = await User.create({
                name: "Test User",
                email: "test@yatrasetu.com",
                phone: "9876543210",
                password: "password123",
                role: "Passenger",
                walletBalance: 2000
            });
        }

        const seededBuses = await Bus.insertMany(busData);
        console.log(`✅ Successfully seeded ${seededBuses.length} buses!`);

        // Create some mock bookings to populate "Passengers Served" and "CO2 Saved"
        const mockBookings = [
            {
                pnr: "PNR" + Math.random().toString(36).substr(2, 6).toUpperCase(),
                user: user._id,
                bus: seededBuses[0]._id,
                passengers: [
                    { name: "Passenger 1", age: 25, gender: "Male", seatNumber: "1A" },
                    { name: "Passenger 2", age: 28, gender: "Female", seatNumber: "1B" }
                ],
                date: new Date(),
                status: "Completed",
                paymentStatus: "Completed",
                amount: 1700
            },
            {
                pnr: "PNR" + Math.random().toString(36).substr(2, 6).toUpperCase(),
                user: user._id,
                bus: seededBuses[1]._id,
                passengers: [
                    { name: "Passenger 3", age: 32, gender: "Male", seatNumber: "2C" }
                ],
                date: new Date(),
                status: "Upcoming",
                paymentStatus: "Completed",
                amount: 450
            },
            {
                pnr: "PNR" + Math.random().toString(36).substr(2, 6).toUpperCase(),
                user: user._id,
                bus: seededBuses[2]._id,
                passengers: [
                    { name: "Passenger 4", age: 45, gender: "Female", seatNumber: "5D" },
                    { name: "Passenger 5", age: 10, gender: "Male", seatNumber: "5E" },
                    { name: "Passenger 6", age: 70, gender: "Female", seatNumber: "5F" }
                ],
                date: new Date(),
                status: "Completed",
                paymentStatus: "Completed",
                amount: 3300
            }
        ];

        await Booking.insertMany(mockBookings);
        console.log('✅ Successfully seeded mock bookings!');

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
}

seedBuses();
