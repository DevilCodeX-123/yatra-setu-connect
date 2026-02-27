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
    getBusById: async (id: string, date?: string) => {
        const url = date ? `${API_BASE_URL}/buses/by-id/${id}?date=${date}` : `${API_BASE_URL}/buses/by-id/${id}`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        return res.json();
    },
    searchBuses: async (from: string, to: string, date: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/search?from=${from}&to=${to}&date=${date}`, { headers: getAuthHeaders() });
        return res.json();
    },
    repeatBusRoute: async (busId: string) => {
        const res = await fetch(`${API_BASE_URL}/buses/${busId}/repeat`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
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
    updateOwnerUPI: async (upiId: string) => {
        const res = await fetch(`${API_BASE_URL}/owner/upi`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ upiId })
        });
        return res.json();
    },
    getOwnerBookings: async () => {
        const res = await fetch(`${API_BASE_URL}/owner/bookings`, { headers: getAuthHeaders() });
        return res.json();
    },
    getRoutesHistory: async () => {
        const res = await fetch(`${API_BASE_URL}/owner/routes-history`, { headers: getAuthHeaders() });
        return res.json();
    },
    getOwnerExpenses: async () => {
        const res = await fetch(`${API_BASE_URL}/owner/expenses`, { headers: getAuthHeaders() });
        return res.json();
    },
    addOwnerExpense: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/owner/expenses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
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
    updateBusInfo: async (busId: string, data: { name?: string; totalSeats?: number; pricePerKm?: number; status?: string; isRentalEnabled?: boolean }) => {
        const res = await fetch(`${API_BASE_URL}/owner/buses/${busId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    },
    updateBusStatus: async (busId: string, status: 'Active' | 'Inactive' | 'Temp-Offline') => {
        const res = await fetch(`${API_BASE_URL}/owner/buses/${busId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        return res.json();
    },
    updateBusSchedule: async (busId: string, schedule: {
        isScheduleActive?: boolean;
        type?: 'daily' | 'days' | 'specific';
        specificDates?: string[];
        startTime?: string;
        endTime?: string;
        loopEnabled?: boolean;
        loopIntervalMinutes?: number;
        activeDays?: string[];
        notes?: string;
    }) => {
        const res = await fetch(`${API_BASE_URL}/owner/buses/${busId}/schedule`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(schedule)
        });
        return res.json();
    },
    updateBusRoute: async (busId: string, routeData: { from: string; to: string; stops: any[] }) => {
        const res = await fetch(`${API_BASE_URL}/buses/${busId}/route`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(routeData)
        });
        return res.json();
    },
    toggleRental: async (busId: string, isRentalEnabled: boolean) => {
        const res = await fetch(`${API_BASE_URL}/owner/buses/${busId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ isRentalEnabled })
        });
        return res.json();
    },


    updateBusActivationCode: async (busId: string, activationCode: string) => {
        const res = await fetch(`${API_BASE_URL}/owner/buses/${busId}/activation-code`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ activationCode })
        });
        return res.json();
    },
    getBusEmployees: async (busId: string) => {
        const res = await fetch(`${API_BASE_URL}/owner/buses/${busId}/employees`, { headers: getAuthHeaders() });
        return res.json();
    },
    addDriver: async (busId: string, driverData: { name: string; email?: string; phone?: string; perDaySalary?: number; driverCode?: string }) => {
        const res = await fetch(`${API_BASE_URL}/owner/buses/${busId}/employees`, {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(driverData)
        });
        return res.json();
    },
    removeDriver: async (busId: string, empId: string) => {
        const res = await fetch(`${API_BASE_URL}/owner/buses/${busId}/employees/${empId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return res.json();
    },
    payDriverSalary: async (busId: string, empId: string, data: { monthYear: string; amount: number; hours: number; description?: string }) => {
        const res = await fetch(`${API_BASE_URL}/owner/buses/${busId}/employees/${empId}/pay`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    },
    getSalaryReport: async (empId: string, month: string) => {
        const res = await fetch(`${API_BASE_URL}/owner/employees/${empId}/salary-report?month=${month}`, {
            headers: getAuthHeaders()
        });
        return res.json();
    },
    updateDriver: async (busId: string, empId: string, data: any) => {
        const res = await fetch(`${API_BASE_URL}/owner/buses/${busId}/employees/${empId}`, {
            method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(data)
        });
        return res.json();
    },
    getAllEmployees: async () => {
        const res = await fetch(`${API_BASE_URL}/owner/employees/all`, { headers: getAuthHeaders() });
        return res.json();
    },
    getEmployeeAttendance: async (empId: string, month?: string) => {
        const url = `${API_BASE_URL}/owner/employees/${empId}/attendance${month ? `?month=${month}` : ''}`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        return res.json();
    },
    markAttendance: async (data: { employeeId: string; busId: string; date: string; present?: boolean; notes?: string }) => {
        const res = await fetch(`${API_BASE_URL}/owner/attendance/mark`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
        return res.json();
    },
    // Employee side
    getEmployeeInvitations: async () => {
        const res = await fetch(`${API_BASE_URL}/employee/invitations`, { headers: getAuthHeaders() });
        return res.json();
    },
    acceptInvitation: async (busId: string) => {
        const res = await fetch(`${API_BASE_URL}/employee/invitations/${busId}/accept`, { method: 'POST', headers: getAuthHeaders() });
        return res.json();
    },
    rejectInvitation: async (busId: string) => {
        const res = await fetch(`${API_BASE_URL}/employee/invitations/${busId}/reject`, { method: 'POST', headers: getAuthHeaders() });
        return res.json();
    },
    goOnAir: async (driverCode: string) => {
        const res = await fetch(`${API_BASE_URL}/employee/go-onair`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ driverCode }) });
        return res.json();
    },
    checkOut: async (busId: string) => {
        const res = await fetch(`${API_BASE_URL}/employee/check-out`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ busId }) });
        return res.json();
    },
    getMyAttendance: async (month?: string) => {
        const url = `${API_BASE_URL}/employee/my-attendance${month ? `?month=${month}` : ''}`;
        const res = await fetch(url, { headers: getAuthHeaders() });
        return res.json();
    },
    updateBusLocation: async (busNumber: string, lat: number, lng: number, source: string = 'GPS') => {
        const res = await fetch(`${API_BASE_URL}/employee/location`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ busNumber, lat, lng, source })
        });
        return res.json();
    },
    reportEmergency: async (busNumber: string, type: string, description: string, location: any) => {
        const res = await fetch(`${API_BASE_URL}/employee/emergency`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ busNumber, type, description, location })
        });
        return res.json();
    },
    submitStopPoll: async (busId: string, stopIndex: number, status: string) => {
        const res = await fetch(`${API_BASE_URL}/employee/stop-poll`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ busId, stopIndex, status })
        });
        return res.json();
    },
    setOriginLocation: async (busId: string, location: { lat: number, lng: number }) => {
        const res = await fetch(`${API_BASE_URL}/employee/set-origin`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ busId, location })
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
    payAdvance: async (bookingId: string) => {
        const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/pay-advance`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return res.json();
    },
    sendBookingMessage: async (bookingId: string, message: string) => {
        const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/chat`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message })
        });
        return res.json();
    },
    getBookingChat: async (bookingId: string) => {
        const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/chat`, { headers: getAuthHeaders() });
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
    },
    // Complaints
    getOwnerComplaints: async () => {
        const res = await fetch(`${API_BASE_URL}/complaints/owner`, { headers: getAuthHeaders() });
        return res.json();
    },
    updateComplaintStatus: async (id: string, data: { status: string, response?: string }) => {
        const res = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    },
    submitComplaint: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/complaints`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    }
};

