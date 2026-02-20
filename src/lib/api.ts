const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export default API_BASE_URL;

export const api = {
    // Buses
    getBuses: async () => {
        const res = await fetch(`${API_BASE_URL}/buses`);
        return res.json();
    },
    getBusById: async (id: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/by-id/${id}`);
        return res.json();
    },
    searchBuses: async (from: string, to: string, date: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/search?from=${from}&to=${to}&date=${date}`);
        return res.json();
    },
    lockSeat: async (busId: string, seatNumber: number, lockerId: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/${busId}/lock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seatNumber, lockerId })
        });
        return res.json();
    },
    unlockSeat: async (busId: string, seatNumber: number, lockerId: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/${busId}/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seatNumber, lockerId })
        });
        return res.json();
    },
    getCities: async () => {
        const res = await fetch(`${API_BASE_URL}/buses/cities`);
        return res.json();
    },

    // User Profile
    getProfile: async () => {
        const res = await fetch(`${API_BASE_URL}/users/profile`);
        return res.json();
    },
    getTransactions: async () => {
        const res = await fetch(`${API_BASE_URL}/users/transactions`);
        return res.json();
    },
    topupWallet: async (amount: number, source: string) => {
        const res = await fetch(`${API_BASE_URL}/users/wallet/topup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, source })
        });
        return res.json();
    },

    // Bookings
    getBookings: async () => {
        const res = await fetch(`${API_BASE_URL}/bookings`);
        return res.json();
    },
    createBooking: async (bookingData: any) => {
        const res = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        return res.json();
    },
    verifyTicket: async (pnr: string) => {
        const res = await fetch(`${API_BASE_URL}/bookings/verify/${pnr}`);
        return res.json();
    },

    // Misc
    createSupportTicket: async (ticketData: any) => {
        const res = await fetch(`${API_BASE_URL}/support`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData)
        });
        return res.json();
    },
    createEmergencyAlert: async (alertData: any) => {
        const res = await fetch(`${API_BASE_URL}/emergency`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alertData)
        });
        return res.json();
    },
    getStats: async () => {
        const res = await fetch(`${API_BASE_URL}/stats`);
        return res.json();
    }
};
