const generateMassiveMockBuses = () => {
    const startDate = new Date();
    const getLocalDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const basic = [
        {
            _id: "demo-bus-1",
            busNumber: "KA-01-F-1234",
            operator: "KSRTC",
            route: { from: "Bengaluru", to: "Mysuru", stops: [{ name: "Bengaluru Central", lat: 12.9716, lng: 77.5946 }, { name: "Mandya", lat: 12.5221, lng: 76.8967 }, { name: "Mysuru", lat: 12.2958, lng: 76.6394 }] },
            departureTime: "06:30", arrivalTime: "09:15", type: "Express", totalSeats: 42, availableSeats: 12, km: 145, status: "On Time", price: 180, bookedSeats: [5, 6, 12, 14], activeLocks: [], date: getLocalDate(startDate),
            rating: "4.2", reviewCount: 128, avgDelay: 8
        },
        {
            _id: "demo-bus-2",
            busNumber: "DL-01-A-4122",
            operator: "Yatra Setu Pro",
            route: { from: "Delhi", to: "Jaipur", stops: [{ name: "ISBT Kashmere Gate", lat: 28.6675, lng: 77.2282 }, { name: "Gurugram", lat: 28.4595, lng: 77.0266 }, { name: "Jaipur", lat: 26.9124, lng: 75.7873 }] },
            departureTime: "10:00", arrivalTime: "15:30", type: "Volvo AC", totalSeats: 52, availableSeats: 28, km: 270, status: "Delayed 15m", price: 850, bookedSeats: [1, 2, 10], activeLocks: [], date: getLocalDate(startDate),
            rating: "4.8", reviewCount: 420, avgDelay: 2
        }
    ];

    const extra = [];
    const times = ['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM', '01:00 AM'];

    for (let day = -1; day < 5; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + day);
        const dateStr = getLocalDate(date);
        for (let i = 0; i < 20; i++) {
            extra.push({
                _id: `demo-massive-jk-${day}-${i}`,
                busNumber: `JK-${1000 + (day * 20) + i}`,
                operator: "Yatra Setu Royals",
                route: { from: "Jaipur", to: "Kota", stops: [{ name: "Jaipur", sequence: 0, price: 0 }, { name: "Tonk", sequence: 1, price: 150 }, { name: "Kota", sequence: 2, price: 450 }] },
                departureTime: times[i],
                arrivalTime: "05:00 PM",
                type: i % 2 === 0 ? "Volvo" : "AC",
                totalSeats: 40,
                availableSeats: 40,
                km: 250,
                status: "On Time",
                price: 450,
                bookedSeats: [],
                activeLocks: [],
                date: dateStr,
                rating: (Math.random() * (4.9 - 4.1) + 4.1).toFixed(1),
                reviewCount: Math.floor(Math.random() * 450) + 50,
                avgDelay: Math.floor(Math.random() * 12),
                seats: Array.from({ length: 40 }, (_, idx) => ({ number: idx + 1, status: 'Available', reservedFor: 'general' }))
            });
        }
    }
    return [...basic, ...extra];
};

const MOCK_OFFICIAL_BUSES = [
    {
        _id: 'off001', busNumber: 'DL-01-S-1001', orgCategory: 'School', orgName: 'Delhi Public School, Noida',
        state: 'Delhi', district: 'New Delhi', town: 'Noida', pinCode: '201301',
        status: 'Active', liveLocation: { lat: 28.5355, lng: 77.3910 }, route: { from: 'Noida Sec 62', to: 'DPS Noida' }
    },
    {
        _id: 'off002', busNumber: 'KA-01-C-2002', orgCategory: 'College', orgName: 'BMS College of Engineering',
        state: 'Karnataka', district: 'Bengaluru Urban (Bangalore)', town: 'Bengaluru (Bangalore)', pinCode: '560019',
        status: 'Active', liveLocation: { lat: 12.9351, lng: 77.6101 }, route: { from: 'Koramangala', to: 'BMS College' }
    },
    {
        _id: 'off003', busNumber: 'MH-12-B-3003', orgCategory: 'Office', orgName: 'Infosys Pune Campus',
        state: 'Maharashtra', district: 'Pune', town: 'Pune', pinCode: '411057',
        status: 'Active', liveLocation: { lat: 18.5679, lng: 73.9143 }, route: { from: 'Kothrud', to: 'Infosys Campus' }
    },
    {
        _id: 'off004', busNumber: 'KA-01-S-4004', orgCategory: 'School', orgName: 'Kendriya Vidyalaya, HSR Layout',
        state: 'Karnataka', district: 'Bengaluru Urban (Bangalore)', town: 'Bengaluru (Bangalore)', pinCode: '560102',
        status: 'Active', liveLocation: { lat: 12.9121, lng: 77.6446 }, route: { from: 'HSR Layout', to: 'KV School' }
    },
    {
        _id: 'off005', busNumber: 'RJ-14-O-5005', orgCategory: 'Office', orgName: 'HCL Technologies Jaipur',
        state: 'Rajasthan', district: 'Jaipur', town: 'Jaipur', pinCode: '302022',
        status: 'Active', liveLocation: { lat: 26.9124, lng: 75.7873 }, route: { from: 'Mansarovar', to: 'HCL Campus' }
    },
    {
        _id: 'off006', busNumber: 'KA-01-C-6677', orgCategory: 'College', orgName: 'IIT Campus Bengaluru',
        state: 'Karnataka', district: 'Bengaluru Urban (Bangalore)', town: 'Bengaluru (Bangalore)', pinCode: '560001',
        status: 'Active', liveLocation: { lat: 12.9716, lng: 77.5946 }, route: { from: 'Majestic', to: 'IIT Campus' }
    },
    {
        _id: 'off007', busNumber: 'RJ-20-C-7007', orgCategory: 'College', orgName: 'RTU Kota',
        state: 'Rajasthan', district: 'Kota', town: 'Kota', pinCode: '324010', activationCode: '123456',
        status: 'Active', liveLocation: { lat: 25.1311, lng: 75.8034 }, route: { from: 'Nayapura', to: 'RTU Campus' }
    }
];

module.exports = {
    MOCK_BUSES: generateMassiveMockBuses(),
    MOCK_OFFICIAL_BUSES
};
