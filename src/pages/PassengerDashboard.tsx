import { MapPin, Bus, Route, History, Leaf, User, CreditCard, BarChart2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const sidebarItems = [
  { href: "/passenger", label: "Overview", icon: <User className="w-4 h-4" /> },
  { href: "/booking", label: "Book Ticket", icon: <Bus className="w-4 h-4" /> },
  { href: "/verify", label: "My Tickets", icon: <CreditCard className="w-4 h-4" /> },
  { href: "#history", label: "Travel History", icon: <History className="w-4 h-4" /> },
  { href: "#eco", label: "Green Stats", icon: <Leaf className="w-4 h-4" /> },
];

const history = [
  { date: "17 Dec 2024", from: "Bengaluru", to: "Mysuru", km: 145, fare: "₹180", pnr: "YS20241217001" },
  { date: "12 Dec 2024", from: "Mysuru", to: "Bengaluru", km: 145, fare: "₹180", pnr: "YS20241212001" },
  { date: "05 Dec 2024", from: "Bengaluru", to: "Mangaluru", km: 352, fare: "₹450", pnr: "YS20241205001" },
  { date: "28 Nov 2024", from: "Bengaluru", to: "Tumkur", km: 77, fare: "₹90", pnr: "YS20241128001" },
];

const totalKm = history.reduce((acc, h) => acc + h.km, 0);
const carKmEmission = 0.185; // kg CO2 per km for car
const busKmEmission = 0.035; // kg CO2 per km for bus
const co2Saved = ((carKmEmission - busKmEmission) * totalKm).toFixed(1);
const fuelSaved = (totalKm * 0.08).toFixed(1); // avg 12km/L car, 8% savings approx

export default function PassengerDashboard() {
  return (
    <DashboardLayout
      title="Passenger Dashboard"
      subtitle="Manage your travel profile & bookings"
      sidebarItems={sidebarItems}>
      <div className="space-y-6 animate-slide-up">
        {/* Profile card */}
        <div className="portal-card p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
            RK
          </div>
          <div>
            <h2 className="font-bold text-base" style={{ color: "hsl(var(--foreground))" }}>Rajesh Kumar</h2>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>+91 98765 43210 • rajesh@email.com</p>
            <span className="stat-badge bg-success-light text-success mt-1">Verified Passenger</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Distance", value: `${totalKm} km`, icon: Route, color: "primary" },
            { label: "Trips Completed", value: `${history.length}`, icon: Bus, color: "info" },
            { label: "CO₂ Saved", value: `${co2Saved} kg`, icon: Leaf, color: "success" },
            { label: "Fuel Saved (equiv.)", value: `${fuelSaved} L`, icon: BarChart2, color: "warning" },
          ].map(stat => (
            <div key={stat.label} className="portal-card p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{stat.label}</p>
                <stat.icon className="w-4 h-4" style={{ color: `hsl(var(--${stat.color}))` }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: `hsl(var(--${stat.color}))` }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Green contribution */}
        <div className="portal-card p-5"
          style={{ borderLeft: "4px solid hsl(var(--success))" }}>
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-success" />
            <h3 className="font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>Your Green Contribution</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-success">{co2Saved} kg</p>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>CO₂ Not Emitted</p>
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "hsl(var(--info))" }}>{fuelSaved} L</p>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Fuel Equivalent Saved</p>
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "hsl(var(--warning))" }}>{Math.round(Number(co2Saved) / 0.022)}</p>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Trees' Daily Work</p>
            </div>
          </div>
        </div>

        {/* Travel History */}
        <div className="portal-card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>Travel History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "hsl(var(--muted))" }}>
                  {["Date", "Route", "Distance", "Fare", "PNR"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "hsl(var(--muted-foreground))" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((trip, i) => (
                  <tr key={trip.pnr} className="border-b hover:bg-muted/30 transition-colors"
                    style={{ borderColor: "hsl(var(--border))" }}>
                    <td className="px-4 py-3 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{trip.date}</td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />
                        {trip.from} → {trip.to}
                      </div>
                    </td>
                    <td className="px-4 py-3">{trip.km} km</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "hsl(var(--primary))" }}>{trip.fare}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{trip.pnr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
