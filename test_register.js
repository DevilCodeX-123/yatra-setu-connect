const API_URL = 'http://127.0.0.1:5000/api';

async function test() {
    console.log('Signing up...');
    try {
        const email = 'test-owner-' + Date.now() + '@example.com';
        const signupRes = await fetch(`${API_URL}/users/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Owner',
                email,
                password: 'password123',
                role: 'Owner',
                age: 30,
                gender: 'male'
            })
        });

        const signupData = await signupRes.json();
        if (!signupRes.ok) {
            console.error('Signup failed:', signupRes.status, signupData);
            return;
        }

        const token = signupData.token;
        console.log('Signup successful, token retrieved.');

        console.log('Registering bus...');
        const busNumber = 'TEST-' + Date.now().toString().slice(-4);
        const payload = {
            busNumber,
            name: 'Test Bus',
            type: 'AC',
            totalSeats: 40,
            seats: Array.from({ length: 40 }, (_, i) => ({ number: i + 1, status: 'Available', reservedFor: 'general' })),
            stops: [
                { name: 'Stop A', arrivalTime: '08:00', price: 0, sequence: 0 },
                { name: 'Stop B', arrivalTime: '10:00', price: 200, sequence: 1 }
            ],
            departureTime: '08:00',
            arrivalTime: '10:00',
            isPrivate: false,
            rentalPricePerDay: 5000,
            rentalPricePerHour: 500,
            mileage: 4.0,
            routes: [
                {
                    label: 'Default Route',
                    stops: [
                        { name: 'Stop A', arrivalTime: '08:00', price: 0, sequence: 0 },
                        { name: 'Stop B', arrivalTime: '10:00', price: 200, sequence: 1 }
                    ],
                    schedule: { type: 'daily', days: [], specificDates: [] }
                }
            ]
        };

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
