const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export default API_BASE_URL;

const getAuthHeaders = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return { 'Content-Type': 'application/json' };
    try {
        const { token } = JSON.parse(userStr);
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    } catch {
        return { 'Content-Type': 'application/json' };
    }
};

export const api = {
    // Buses
    getBuses: async () => {
        const res = await fetch(`${API_BASE_URL}/buses`, { headers: getAuthHeaders() });
        return res.json();
    },
    getBusById: async (id: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/by-id/${id}`, { headers: getAuthHeaders() });
        return res.json();
    },
    searchBuses: async (from: string, to: string, date: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/search?from=${from}&to=${to}&date=${date}`, { headers: getAuthHeaders() });
        return res.json();
    },
    lockSeat: async (busId: string, seatNumber: number, lockerId: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/${busId}/lock`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ seatNumber, lockerId })
        });
        return res.json();
    },
    unlockSeat: async (busId: string, seatNumber: number, lockerId: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/${busId}/unlock`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ seatNumber, lockerId })
        });
        return res.json();
    },
    getCities: async () => {
        const res = await fetch(`${API_BASE_URL}/buses/cities`, { headers: getAuthHeaders() });
        return res.json();
    },

    // User Profile
    getProfile: async () => {
        const res = await fetch(`${API_BASE_URL}/users/profile`, { headers: getAuthHeaders() });
        return res.json();
    },
    getTransactions: async () => {
        const res = await fetch(`${API_BASE_URL}/users/transactions`, { headers: getAuthHeaders() });
        return res.json();
    },
    topupWallet: async (amount: number, source: string) => {
        const res = await fetch(`${API_BASE_URL}/users/wallet/topup`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ amount, source })
        });
        return res.json();
    },

    // Bookings
    getBookings: async () => {
        const res = await fetch(`${API_BASE_URL}/bookings`, { headers: getAuthHeaders() });
        return res.json();
    },
    createBooking: async (bookingData: any) => {
        const res = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(bookingData)
        });
        return res.json();
    },
    verifyTicket: async (pnr: string) => {
        const res = await fetch(`${API_BASE_URL}/bookings/verify/${pnr}`, { headers: getAuthHeaders() });
        return res.json();
    },

    // Misc
    createSupportTicket: async (ticketData: any) => {
        const res = await fetch(`${API_BASE_URL}/support`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(ticketData)
        });
        return res.json();
    },
    createEmergencyAlert: async (alertData: any) => {
        const res = await fetch(`${API_BASE_URL}/emergency`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(alertData)
        });
        return res.json();
    },
    getStats: async () => {
        const res = await fetch(`${API_BASE_URL}/stats`, { headers: getAuthHeaders() });
        return res.json();
    },

    // Owner
    getOwnerDashboard: async () => {
        const res = await fetch(`${API_BASE_URL}/owner/dashboard`, { headers: getAuthHeaders() });
        return res.json();
    },
    getOwnerRevenue: async () => {
        const res = await fetch(`${API_BASE_URL}/owner/revenue`, { headers: getAuthHeaders() });
        return res.json();
    },
    addBus: async (busData: any) => {
        const res = await fetch(`${API_BASE_URL}/owner/buses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(busData)
        });
        return res.json();
    }
};
