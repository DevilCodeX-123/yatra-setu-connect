const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models
const User = require('./models/User');
const Bus = require('./models/Bus');
const Transaction = require('./models/Transaction');
const Booking = require('./models/Booking');

dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── DATA TO SEED ──────────────────────────────────────────────────────────────

const busData = [
    {
        busNumber: "KA-01-F-1234",
        operator: "KSRTC",
        route: { from: "Bengaluru", to: "Mysuru", stops: ["Ramnagara", "Mandya"] },
        departureTime: "06:30",
        arrivalTime: "09:15",
        type: "Express",
        totalSeats: 42,
        availableSeats: 12,
        km: 145,
        status: "On Time",
        price: 180,
        amenities: ["Water Bottle", "First Aid"]
    },
    {
        busNumber: "KA-01-F-5678",
        operator: "KSRTC",
        route: { from: "Mysuru", to: "Bengaluru", stops: ["Ramnagara"] },
        departureTime: "07:00",
        arrivalTime: "09:45",
        type: "Ordinary",
        totalSeats: 42,
        availableSeats: 3,
        km: 145,
        status: "Delayed 10 min",
        price: 120,
        amenities: []
    },
    {
        busNumber: "KA-01-F-9012",
        operator: "KSRTC",
        route: { from: "Bengaluru", to: "Mangaluru", stops: ["Hassan", "Sakleshpur", "Shiradi"] },
        departureTime: "07:30",
        arrivalTime: "13:00",
        type: "Volvo AC",
        totalSeats: 52,
        availableSeats: 28,
        km: 352,
        status: "On Time",
        price: 750,
        amenities: ["AC", "WiFi", "Charging Point", "Refreshments"]
    },
    {
        busNumber: "KA-01-F-3456",
        operator: "KSRTC",
        route: { from: "Hubballi", to: "Belgaum", stops: ["Dharwad"] },
        departureTime: "08:00",
        arrivalTime: "10:30",
        type: "Express",
        totalSeats: 40,
        availableSeats: 0,
        km: 98,
        status: "Full",
        price: 150,
        amenities: []
    },
    {
        busNumber: "KA-01-F-7890",
        operator: "KSRTC",
        route: { from: "Bengaluru", to: "Tumkur", stops: ["Nelamangala"] },
        departureTime: "08:15",
        arrivalTime: "09:45",
        type: "Ordinary",
        totalSeats: 42,
        availableSeats: 19,
        km: 77,
        status: "On Time",
        price: 80,
        amenities: []
    },
    {
        busNumber: "KA-05-AB-1111",
        operator: "KSRTC",
        route: { from: "Bengaluru", to: "Pune", stops: ["Tumkur", "Hubli", "Kolhapur"] },
        departureTime: "18:00",
        arrivalTime: "06:00",
        type: "Volvo AC",
        totalSeats: 36,
        availableSeats: 14,
        km: 840,
        status: "On Time",
        price: 1200,
        amenities: ["AC", "Sleeper", "USB Charging", "Blanket"]
    },
    {
        busNumber: "KA-09-CD-2222",
        operator: "KSRTC",
        route: { from: "Mangaluru", to: "Bengaluru", stops: ["Sakleshpur", "Hassan"] },
        departureTime: "05:30",
        arrivalTime: "11:30",
        type: "Express",
        totalSeats: 48,
        availableSeats: 22,
        km: 352,
        status: "On Time",
        price: 380,
        amenities: ["Water Bottle"]
    }
];

const userData = [
    {
        name: 'John Doe',
        email: 'john.doe@government.in',
        password: 'password123',
        phone: '+91 98765 43210',
        role: 'Passenger',
        walletBalance: 1350,
        identityVerified: true,
        address: { city: 'Bengaluru', state: 'Karnataka' },
        savedPassengers: [
            { name: 'Anita Doe', age: 32, gender: 'Female', relation: 'Spouse', status: 'Verified' },
            { name: 'Ravi Doe', age: 58, gender: 'Male', relation: 'Father', status: 'Verified' }
        ]
    },
    { name: 'Ravi Kumar', email: 'driver.ravi@ksrtc.gov.in', password: 'driver123', role: 'Driver', phone: '+91 90000 11111' },
    { name: 'Suresh Admin', email: 'admin@yatra.gov.in', password: 'admin123', role: 'Admin', phone: '+91 80000 22222' },
    { name: 'Anand Operator', email: 'owner@ksrtc.in', password: 'owner123', role: 'Owner', phone: '+91 70000 33333' }
];

const transactionData = [
    { type: 'Credit', amount: 500, source: 'Added via UPI', date: new Date('2024-02-18'), status: 'Success' },
    { type: 'Debit', amount: 180, source: 'Bus Ticket - Mysuru', date: new Date('2024-02-17'), status: 'Success' },
    { type: 'Debit', amount: 450, source: 'Bus Ticket - Mangaluru', date: new Date('2024-02-15'), status: 'Success' },
    { type: 'Credit', amount: 1000, source: 'Added via Net Banking', date: new Date('2024-02-10'), status: 'Success' },
    { type: 'Debit', amount: 80, source: 'Bus Ticket - Tumkur', date: new Date('2024-02-08'), status: 'Success' },
    { type: 'Credit', amount: 200, source: 'Refund - Cancelled Trip', date: new Date('2024-02-05'), status: 'Success' },
];

// ─── SEED FUNCTION ─────────────────────────────────────────────────────────────

async function seed() {
    console.log('\n🌱 Yatra Setu — Database Seeder');
    console.log('================================');

    try {
        console.log('🔗 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to yatra_setu database!\n');

        // ── Clear collections ──
        console.log('🗑️  Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Bus.deleteMany({}),
            Transaction.deleteMany({}),
            Booking.deleteMany({})
        ]);
        console.log('   ✓ Cleared: users, buses, transactions, bookings\n');

        // ── Seed Buses ──
        const buses = await Bus.insertMany(busData);
        console.log(`🚌 Seeded ${buses.length} buses`);

        // ── Seed Users ──
        const users = await User.insertMany(userData);
        console.log(`👤 Seeded ${users.length} users`);

        // ── Seed Transactions for John Doe ──
        const john = users[0];
        const txWithUser = transactionData.map(t => ({ ...t, user: john._id }));
        const transactions = await Transaction.insertMany(txWithUser);
        console.log(`💳 Seeded ${transactions.length} transactions for ${john.name}`);

        // ── Seed Sample Booking ──
        const sampleBus = buses[0]; // Bengaluru → Mysuru Express
        const sampleBooking = await Booking.create({
            pnr: 'YS' + Date.now().toString().slice(-10),
            user: john._id,
            bus: sampleBus._id,
            passengers: [{ name: 'John Doe', age: 35, gender: 'Male', seatNumber: '14' }],
            date: new Date('2024-02-18'),
            status: 'Completed',
            paymentStatus: 'Completed',
            amount: 180
        });
        // Link PNR to user history
        await User.findByIdAndUpdate(john._id, { $push: { pnrHistory: sampleBooking.pnr } });
        console.log(`🎫 Seeded 1 sample booking (PNR: ${sampleBooking.pnr})`);

        // ── Summary ──
        console.log('\n==============================');
        console.log('✨ Seeding Complete!');
        console.log('📊 Database Summary:');
        console.log(`   • Buses:        ${await Bus.countDocuments()}`);
        console.log(`   • Users:        ${await User.countDocuments()}`);
        console.log(`   • Transactions: ${await Transaction.countDocuments()}`);
        console.log(`   • Bookings:     ${await Booking.countDocuments()}`);
        console.log('==============================\n');

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Seeding failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

seed();
