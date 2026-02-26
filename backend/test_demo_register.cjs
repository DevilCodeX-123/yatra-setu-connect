const jwt = require('jsonwebtoken');
const API_URL = 'http://127.0.0.1:5000/api';
const JWT_SECRET = 'yatra-setu-secret-key-2024';

async function test() {
    console.log('Generating demo token...');
    // Create a demo token directly
    const demoUser = {
        id: 'demo-' + Date.now(),
        name: 'Demo Owner',
        email: 'demo-owner@yatrasetu.in',
        role: 'Owner'
    };
    const token = jwt.sign(demoUser, JWT_SECRET);
    console.log('Demo token generated.');

    console.log('Registering bus as demo user...');
    const busNumber = 'DEMO-' + Date.now().toString().slice(-4);
    const payload = {
        busNumber,
        name: 'Demo Bus',
        type: 'Ordinary',
        totalSeats: 30,
        seats: Array.from({ length: 30 }, (_, i) => ({ number: i + 1, status: 'Available', reservedFor: 'general' })),
        stops: [
            { name: 'Start', arrivalTime: '09:00', price: 0, sequence: 0 },
            { name: 'End', arrivalTime: '11:00', price: 100, sequence: 1 }
        ],
        departureTime: '09:00',
        arrivalTime: '11:00',
        isPrivate: false,
        mileage: 4.5
    };

    try {
        const res = await fetch(`${API_URL}/owner/buses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response Body:', text);
    } catch (err) {
        console.error('Test failed with exception:', err);
    }
}

test();
