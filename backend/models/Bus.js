const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema({
    number: { type: Number, required: true },
    status: { type: String, enum: ['Available', 'Booked', 'Cash', 'Locked'], default: 'Available' },
    reservedFor: { type: String, enum: ['general', 'women', 'elderly', 'disabled'], default: 'general' },
    passenger: { type: String },
}, { _id: false });

const StopSchema = new mongoose.Schema({
    name: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    price: { type: Number, default: 0 },
    sequence: { type: Number },
}, { _id: false });

const BusSchema = new mongoose.Schema({
    busNumber: { type: String, required: true, unique: true },
    name: { type: String },
    operator: { type: String },
    type: { type: String, enum: ['AC', 'Non-AC', 'Express', 'Volvo', 'Ordinary', 'Sleeper'], default: 'Ordinary' },

    // ─── Status ───────────────────────────────────────────────────────────────
    // Active = Live on road | Temp-Offline = temporarily paused | Inactive = fully off
    status: { type: String, enum: ['Active', 'Inactive', 'Temp-Offline', 'Maintenance'], default: 'Inactive' },

    totalSeats: { type: Number, default: 40 },
    seats: [SeatSchema],
    pricePerKm: { type: Number, default: 1.2 },
    activationCode: { type: String },
    km: { type: Number, default: 0 },
    rating: { type: Number, default: 4.0 },
    departureTime: { type: String },
    arrivalTime: { type: String },
    date: { type: String },

    route: {
        from: { type: String },
        to: { type: String },
        stops: [StopSchema],
    },

    liveLocation: {
        lat: { type: Number },
        lng: { type: Number },
        source: { type: String, enum: ['gps', 'driver', 'conductor', 'manual', 'mobile', 'vehicle', 'GPS'] },
        updatedAt: { type: Date },
    },

    mileage: { type: Number, default: 4.0 },

    // ─── Rental ───────────────────────────────────────────────────────────────
    isRentalEnabled: { type: Boolean, default: true },
    rentalPricePerDay: { type: Number, default: 5000 },
    rentalPricePerHour: { type: Number, default: 500 },
    returnChargePerKm: { type: Number, default: 15 },
    oneWayReturnChargePercentage: { type: Number, default: 50 },
    rentalCapacity: { type: Number, default: 40 },
    bookedDates: [{ type: String }],

    // ─── Schedule / Timed Loop Routes ─────────────────────────────────────────
    // When isScheduleActive=true, bus shows at route.stops[0] until startTime,
    // then runs the route, loops every loopIntervalMinutes until endTime.
    schedule: {
        isScheduleActive: { type: Boolean, default: false },
        type: { type: String, enum: ['daily', 'days', 'specific'], default: 'daily' },
        specificDates: { type: [String], default: [] },
        startTime: { type: String, default: '' },           // "08:00"
        endTime: { type: String, default: '' },             // "20:00"
        loopEnabled: { type: Boolean, default: false },
        loopIntervalMinutes: { type: Number, default: 60 },
        activeDays: { type: [String], default: [] },        // ['Mon','Tue','Wed',...]
        notes: { type: String, default: '' },
    },

    // ─── Official Bus Tracking ─────────────────────────────────────────────────
    orgCategory: { type: String, enum: ['School', 'College', 'Office', 'Other'] },
    orgName: { type: String },
    state: { type: String },
    district: { type: String },
    town: { type: String },
    pinCode: { type: String },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ─── Private Bus / Employees ───────────────────────────────────────────────
    isPrivate: { type: Boolean, default: false },
    accessCode: { type: String },
    employeeCode: { type: String },
    employees: [{
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Pending', 'Active', 'Rejected'], default: 'Active' },
        driverCode: { type: String },
        perDaySalary: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now }
    }],

    // ─── Loop & Return Logic ──────────────────────────────────────────────────
    lastReturnTime: { type: Date },
    originLocation: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Bus', BusSchema);
