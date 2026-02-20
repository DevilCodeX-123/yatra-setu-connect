const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('📝 Loaded environment variables from .env file');
} else {
    console.log('🌐 No .env file found, using system environment variables');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ FATAL ERROR: MONGODB_URI is not defined.');
    console.error('👉 Please set MONGODB_URI in your Render / Vercel Environment Variables.');
    process.exit(1);
}

const startServer = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB Atlas');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        if (err.message.includes('ReplicaSetNoPrimary')) {
            console.warn('⚠️ Tip: Check if your IP is whitelisted in MongoDB Atlas.');
        }
        process.exit(1);
    }
};

// Monitor connection events
mongoose.connection.on('error', err => {
    console.error('🔥 Mongoose error event:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('🔌 Mongoose disconnected');
});

// Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Yatra Setu Backend is running',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Import Routes
const busRoutes = require('./routes/busRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const miscRoutes = require('./routes/miscRoutes');
const mapRoutes = require('./routes/mapRoutes');

// Use Routes
app.use('/api/buses', busRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api', miscRoutes);

startServer();
