import { MapPin, Bus, Route, History, Leaf, User, CreditCard, BarChart2, ArrowRight } from "lucide-react";
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
      <div className="space-y-6 animate-slide-up pb-10 md:pb-0">
        {/* Profile card */}
        <div className="bg-card border border-border p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 rounded-3xl shadow-card">
          <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
            RK
          </div>
          <div>
            <h2 className="text-lg sm:text-base text-foreground font-black leading-tight">Rajesh Kumar</h2>
            <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground mt-1 opacity-60">+91 98765 43210 • rajesh@email.com</p>
            <div className="flex justify-center sm:justify-start">
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full mt-2 font-black text-[9px] ">Verified Passenger</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Distance", value: `${totalKm} km`, icon: Route, color: "primary" },
            { label: "Trips Completed", value: `${history.length}`, icon: Bus, color: "info" },
            { label: "CO₂ Saved", value: `${co2Saved} kg`, icon: Leaf, color: "success" },
            { label: "Fuel Saved (equiv.)", value: `${fuelSaved} L`, icon: BarChart2, color: "warning" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border p-4 group hover:bg-secondary transition-all cursor-pointer rounded-2xl shadow-card">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[9px] font-black text-muted-foreground opacity-40">{stat.label}</p>
                <stat.icon className="w-4 h-4 text-muted-foreground opacity-20 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-2xl font-black text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Green contribution */}
        <div className="bg-card border border-border p-5 border-l-4 rounded-2xl"
          style={{ borderLeftColor: "hsl(var(--success))" }}>
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm sm:text-base font-black text-foreground">Your Green Contribution</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">{co2Saved}kg</p>
              <p className="text-[9px] font-black text-muted-foreground opacity-40">CO₂ Not Emitted</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-info leading-tight">{fuelSaved}L</p>
              <p className="text-[9px] font-black text-muted-foreground opacity-40">Fuel Equivalent Saved</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-warning leading-tight">{Math.round(Number(co2Saved) / 0.022)}</p>
              <p className="text-[9px] font-black text-muted-foreground opacity-40">Trees' Daily Work</p>
            </div>
          </div>
        </div>

        {/* Travel History */}
        <div className="bg-card border border-border overflow-hidden rounded-2xl shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-xs font-black text-foreground">Travel History</h3>
          </div>
          <div className="overflow-x-auto scrollbar-none">
            <div className="min-w-[600px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary">
                    {["Date", "Route", "Distance", "Fare", "PNR"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[9px] font-black text-muted-foreground opacity-50 ">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((trip, i) => (
                    <tr key={trip.pnr} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-5 py-4 text-[11px] font-bold text-muted-foreground opacity-80">{trip.date}</td>
                      <td className="px-5 py-4 font-bold">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-primary opacity-40" />
                          <span className="text-foreground ">{trip.from}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground opacity-20" />
                          <span className="text-foreground ">{trip.to}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-xs text-foreground">{trip.km} km</td>
                      <td className="px-5 py-4 font-black text-primary ">₹{trip.fare.replace('₹', '')}</td>
                      <td className="px-5 py-4 font-mono text-[10px] font-black text-muted-foreground opacity-40">{trip.pnr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
