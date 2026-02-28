# Yatra Connect 🚌

**Yatra Connect** is a comprehensive, real-time Transit Management System designed to bridge the gap between Passengers, Bus Owners/Organizations, and On-field Employees (Drivers/Conductors). Built with a modern tech stack, Yatra Connect offers dynamic real-time tracking, seamless ticket booking, and a powerful suite of management tools tailored for each specific role in the transit ecosystem.

---

## 🌟 Core Modules & Features

The platform is divided into three primary portals, each finely tuned for its respective user base:

### 1. 🧍 Passenger Portal
Designed for everyday commuters and specialized organization tracking (schools, offices, colleges).

- **Smart Search & Booking:**
  - Search available routes with Daily and Specific Days schedules.
  - Interactive Seat Map layout for precise seat selection.
  - Transparent pricing and real-time availability.
- **Organization Tracking (Secure Commute):**
  - Dedicated portal to find and track official organization buses (School, College, Corporate).
  - Secure **Access Code System**: Passengers request tracking access using a code (e.g., `YS-123456`) provided by the institution.
  - End-to-end **Approval Workflow**: Owners approve requests before tracking is enabled.
- **Bus Rentals:**
  - Submit rental inquiries directly to bus owners.
  - Interactive **Chat System** with owners to negotiate quotations.
  - Review customized quotations and make **Advance Payments** via the portal to secure bookings.
  - "Track Rental" functionality for confirmed trips.
- **Profile & History:**
  - View past and upcoming ticket bookings with dynamic PNR/QR Codes.
  - Manage secure tracking authorizations and pending requests.

### 2. 👑 Owner / Organization Panel
A powerful command center for fleet owners, transit agencies, and institutional transport managers.

- **Live Dashboard & Analytics:**
  - Real-time revenue tracking, total bookings, and active buses.
  - **Live Activity Feed**: Monitor buses currently "ON AIR" with pulsing indicators.
- **Fleet Registration & Management:**
  - Add, edit, and manage comprehensive bus profiles.
  - Configure Total Seats, Fare per Km, and Rental Settings (Return charge %, Hourly rate).
  - Secure control over **Bus Activation Codes** necessary for employees to start a bus session.
  - Toggle Bus Status (Active, Temp-Offline, Inactive) and Rental Availability.
- **Route & Schedule Control:**
  - Visual route builder with unlimited stops and custom stop coordinates via Maps.
  - Easy duplication/cloning of existing routes and trips.
- **Employee & Driver Oversight:**
  - View real-time ongoing employee sessions (Location, Check-in time, Duty Hours).
  - Review **Daily Duty Logs & Attendance**, including Check-in/out times, hours worked, and overtime.
  - Approve generated Salary estimates and logged Expenses (Fuel, Tolls, Maintenance).
- **Rental & Tracking Management:**
  - Dedicated Inbox to chat with passengers regarding rental inquiries.
  - Generate customized quotations and track advance payments.
  - **Tracking Requests Tab**: Approve or Reject requests from passengers attempting to track organization buses.

### 3. 🚌 Employee Panel (Driver / Conductor)
A streamlined, mobile-first interface optimized for on-the-go operations.

- **Secure Login & Duty Assignment:**
  - Two-step check-in: Select the Bus and enter the **Owner’s Activation Code** securely.
  - Provide a personal **Driver Code** to automatically start Attendance and log duty hours.
- **Live Dashboard:**
  - View total available vs. occupied seats in real-time.
  - Access a read-only live seat map visualizing the current bus load.
- **Ticketing Operations:**
  - **Cash Tickets**: Quickly generate tickets for walk-in passengers directly assigning seat, fare, and route.
  - **UPI Tickets**: Dynamic UPI **QR Code Generation** displaying the exact fare amount, allowing passengers to scan and pay instantly.
  - **QR/PNR Scanner**: Integrated barcode scanner using the device camera to verify pre-booked digital tickets.
- **Passenger Manifest:**
  - Live list of expected passengers for the current route.
  - **Boarding & Drop Management**: Mark passengers as 'Boarded' or 'Completed' individually as they get on or off.
- **Safety & Live Tracking Details:**
  - Toggle **Live Location Sharing** on/off.
  - Select GPS data source priority (Device Mobile GPS vs. On-board Vehicle GPS).
  - Built-in map to view current broadcasted location.
  - **Emergency SOS Button**: One-tap alert that sends immediate notifications to the Owner/Authorities.
- **Shift Reports & Expenses:**
  - Sub-dashboard outlining the day's revenue breakdown (Cash vs. Online).
  - Log shift **Expenses** immediately (Fuel, Maintenance, Toll).
  - View estimated end-of-day salary and calculated overtime based on check-in duration.

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB (Mongoose ORM).
- **Real-Time Communication:** Socket.io (for Live Tracking, Chat, and instant Analytics updates).
- **Mapping Services:** integration with map SDKs (Mappls/MapmyIndia).
- **Styling:** Highly aesthetic, modern glassmorphic and dynamic UI design prioritizing mobile responsiveness.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Relevant API Keys (Maps, Geocoding)

### Installation
1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd yatra-setu-connect
   ```

2. **Install Dependencies:**
   - Root (Frontend):
     ```bash
     npm install
     ```
   - Backend:
     ```bash
     cd backend
     npm install
     ```

3. **Environment Setup:**
   - Create a `.env` file in the `backend` directory:
     ```env
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     SOCKET_CORS_ORIGIN=http://localhost:5173
     ```
   - Create a `.env` file in the root (frontend) directory:
     ```env
     VITE_API_URL=http://localhost:5000/api
     VITE_SOCKET_URL=http://localhost:5000
     ```

4. **Database Seeding (Optional):**
   ```bash
   npm run seed
   ```

5. **Run the Application Locally:**
   - In the `backend` directory:
     ```bash
     npm start
     ```
   - In the root directory (Frontend):
     ```bash
     npm run dev
     ```

The application will launch on `http://localhost:5173`.

---

## 🎨 UI/UX Philosophy
The application strongly emphasizes **vibrant colors, clean layouts, and dynamic micro-animations**. It automatically scales from expansive desktop command centers (Owner Panel) to concise, large-touch-target interfaces for mobile (Employee Panel). Constant feedback loops via visual Badges, Notifications (Toasts), and pulsating status dots assure users of system state seamlessly without interference.

---
_Developed by Team Transify_
