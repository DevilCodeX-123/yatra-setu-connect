const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export default API_BASE_URL;

const getAuthHeaders = () => {
    const token = localStorage.getItem('ys_token');
    if (!token) return { 'Content-Type': 'application/json' };
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
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
    updateProfile: async (userData: any) => {
        const res = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
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
    getStats: async (date?: string) => {
        const url = date ? `${API_BASE_URL}/stats?date=${date}` : `${API_BASE_URL}/stats`;
        const res = await fetch(url, { headers: getAuthHeaders() });
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
    },

    // Rental
    createRentalRequest: async (rentalData: any) => {
        const res = await fetch(`${API_BASE_URL}/bookings/rental-request`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(rentalData)
        });
        return res.json();
    },
    getOwnerRequests: async () => {
        const res = await fetch(`${API_BASE_URL}/bookings/owner/requests`, { headers: getAuthHeaders() });
        return res.json();
    },
    getOwnerTrackingRequests: async () => {
        const res = await fetch(`${API_BASE_URL}/tracking/owner/requests`, { headers: getAuthHeaders() });
        return res.json();
    },
    updateTrackingRequestStatus: async (requestId: string, status: string) => {
        const res = await fetch(`${API_BASE_URL}/tracking/owner/requests/${requestId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        return res.json();
    },
    updateRequestStatus: async (requestId: string, status: string) => {
        const res = await fetch(`${API_BASE_URL}/bookings/owner/request/${requestId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        return res.json();
    },
    updateBusSettings: async (busId: string, settings: any) => {
        const res = await fetch(`${API_BASE_URL}/bookings/owner/bus/${busId}/settings`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(settings)
        });
        return res.json();
    },
    payDeposit: async (bookingId: string) => {
        const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/pay-deposit`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return res.json();
    },
    addPassenger: async (passengerData: any) => {
        const res = await fetch(`${API_BASE_URL}/users/passengers`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(passengerData)
        });
        return res.json();
    },
    deletePassenger: async (id: string) => {
        const res = await fetch(`${API_BASE_URL}/users/passengers/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return res.json();
    },
    requestTrackingAccess: async (busId: string, activationCode: string, nickname?: string) => {
        const res = await fetch(`${API_BASE_URL}/tracking/request`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ busId, activationCode, nickname })
        });
        return res.json();
    },
    getAuthorizedBuses: async () => {
        const res = await fetch(`${API_BASE_URL}/tracking/authorized`, { headers: getAuthHeaders() });
        return res.json();
    },
    getMyTrackingRequests: async () => {
        const res = await fetch(`${API_BASE_URL}/tracking/my-requests`, { headers: getAuthHeaders() });
        return res.json();
    },
    getOfficialLocations: async () => {
        const res = await fetch(`${API_BASE_URL}/buses/official/locations`, { headers: getAuthHeaders() });
        return res.json();
    },
    getOfficialDistricts: async (state: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/official/districts?state=${encodeURIComponent(state)}`, { headers: getAuthHeaders() });
        return res.json();
    },
    getOfficialNames: async (state: string, district: string, category: string) => {
        const params = new URLSearchParams({ state, district, orgCategory: category });
        const res = await fetch(`${API_BASE_URL}/buses/official/names?${params.toString()}`, { headers: getAuthHeaders() });
        return res.json();
    },
    searchOfficialBuses: async (params: { state: string, district: string, pinCode?: string, orgCategory: string, orgName: string }) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value) searchParams.append(key, value);
        });
        const res = await fetch(`${API_BASE_URL}/buses/official?${searchParams.toString()}`, { headers: getAuthHeaders() });
        return res.json();
    }
};

