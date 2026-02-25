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
    status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' },
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
        source: { type: String, enum: ['gps', 'driver', 'conductor', 'manual'] },
        updatedAt: { type: Date },
    },
    mileage: { type: Number, default: 4.0 }, // km/l
    // Official Bus Tracking fields
    orgCategory: { type: String, enum: ['School', 'College', 'Office', 'Other'] },
    orgName: { type: String },
    state: { type: String },
    district: { type: String },
    town: { type: String },
    pinCode: { type: String },
    rentalPricePerDay: { type: Number, default: 5000 },
    rentalPricePerHour: { type: Number, default: 500 },
    returnChargePerKm: { type: Number, default: 15 }, // Deprecated or for specific extra costs
    oneWayReturnChargePercentage: { type: Number, default: 50 }, // Percentage of distance charged for return on one-way
    rentalCapacity: { type: Number, default: 40 },
    bookedDates: [{ type: String }], // ISO dates string
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Private Bus Mode
    isPrivate: { type: Boolean, default: false },
    accessCode: { type: String }, // For owner & authorized users to track location
    employeeCode: { type: String }, // Separate code for drivers to activate & push location
    employees: [{
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Pending', 'Active', 'Rejected'], default: 'Active' },
        driverCode: { type: String }, // unique code for driver to go "on-air"
        perDaySalary: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });


module.exports = mongoose.model('Bus', BusSchema);


