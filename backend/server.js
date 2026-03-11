const express = require('express'); // Restarted at: 2026-03-07T11:55:00
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const dns = require('dns');

// Bypass Windows DNS cache/ISP filters to fix MongoDB ENOTFOUND resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('📝 Loaded environment variables from .env file');
} else {
    console.log('🌐 No .env file found, using system environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET || 'yatra-setu-secret-key-2024';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(express.json());

// Attach io instance to app for use in route handlers
app.set('io', io);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ FATAL ERROR: MONGODB_URI is not defined.');
    process.exit(1);
}

// ─── Socket.io Real-Time ──────────────────────────────────────────────────────
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
        try {
            socket.user = jwt.verify(token, JWT_SECRET);
        } catch {
            // anonymous socket ok for tracking
            socket.user = null;
        }
    }
    next();
});

io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a bus room for live tracking
    socket.on('join:bus', (busNumber) => {
        socket.join(`bus:${busNumber}`);
        console.log(`📍 Socket ${socket.id} joined bus:${busNumber}`);
    });

    // Employee sends location
    socket.on('bus:location', ({ busNumber, lat, lng, source }) => {
        io.to(`bus:${busNumber}`).emit('bus:location', { busNumber, lat, lng, source, time: Date.now() });
    });

    // SOS panic alert
    socket.on('bus:sos', ({ busNumber, lat, lng, userId }) => {
        io.emit('bus:sos', { busNumber, lat, lng, userId, time: Date.now() });
        console.log(`🚨 SOS triggered on bus ${busNumber}`);
    });

    // Seat update
    socket.on('bus:seat-update', ({ busNumber, seatNumber, status }) => {
        io.to(`bus:${busNumber}`).emit('bus:seat-update', { seatNumber, status });
    });

    // Notification
    socket.on('join:user', (userId) => {
        socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
});

// ─── DB & Server Start ────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is missing!');
        }
        console.log('🔗 Connection Target:', MONGODB_URI.substring(0, 20) + '...');

        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 20000,
            connectTimeoutMS: 30000,
            family: 4 // Force IPv4 to fix getaddrinfo ENOTFOUND
        });
        console.log('✅ Connected to MongoDB Atlas');
    } catch (err) {
        console.error('❌ Database connection failed Error Details:', err.message);
        console.log('🚀 Starting in OFFLINE DEMO MODE (Server will run without Database)');
    } finally {
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
            console.log(`🔌 Socket.io ready`);
            console.log(`📊 DB STATUS: ${mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'}`);
        });
    }
};

mongoose.connection.on('error', err => console.error('🔥 Mongoose error:', err.message));
mongoose.connection.on('disconnected', () => console.warn('🔌 Mongoose disconnected'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Yatra Setu Backend is running',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        realtime: 'Socket.io active'
    });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const busRoutes = require('./routes/busRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const miscRoutes = require('./routes/miscRoutes');
const mapRoutes = require('./routes/mapRoutes');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const ownerRouteRoutes = require('./routes/ownerRouteRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

app.use('/api/buses', busRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api', miscRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/owner-routes', ownerRouteRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/complaints', complaintRoutes);

app.get('/api/ping', (req, res) => res.send('pong'));

startServer();
