import { useState } from "react";
import {
  Bus, DollarSign, BarChart2, Users, Edit, Eye, Plus, Calendar, TrendingUp, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";

const sidebarItems = [
  { href: "/owner", label: "Fleet Overview", icon: <Bus className="w-4 h-4" /> },
  { href: "#bookings", label: "Booking Records", icon: <Calendar className="w-4 h-4" /> },
  { href: "#earnings", label: "Earnings", icon: <DollarSign className="w-4 h-4" /> },
  { href: "#rent", label: "Rent for Event", icon: <Package className="w-4 h-4" /> },
];

const buses = [
  { id: "KA-01-F-1234", type: "Express", route: "Bengaluru → Mysuru", seats: 42, fare: 180, status: "Active", earnings: 12600 },
  { id: "KA-01-F-5678", type: "Ordinary", route: "Mysuru → Bengaluru", seats: 40, fare: 130, status: "Active", earnings: 9880 },
  { id: "KA-01-F-9012", type: "Volvo AC", route: "Bengaluru → Mangaluru", seats: 52, fare: 450, status: "Maintenance", earnings: 18450 },
];

const earningsData = [
  { month: "Sep", amount: 38400 },
  { month: "Oct", amount: 42200 },
  { month: "Nov", amount: 39800 },
  { month: "Dec", amount: 40930 },
];

const maxEarning = Math.max(...earningsData.map(e => e.amount));

export default function OwnerPanel() {
  const [editFare, setEditFare] = useState<string | null>(null);
  const [fareVal, setFareVal] = useState("");

  const totalEarnings = buses.reduce((a, b) => a + b.earnings, 0);

  return (
    <DashboardLayout
      title="Bus Owner Panel"
      subtitle="Manage your fleet, fares and earnings"
      sidebarItems={sidebarItems}>
      <div className="space-y-5 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Buses", value: buses.length, icon: Bus, color: "primary" },
            { label: "Active Buses", value: buses.filter(b => b.status === "Active").length, icon: TrendingUp, color: "success" },
            { label: "Total Earnings", value: `₹${(totalEarnings / 1000).toFixed(1)}k`, icon: DollarSign, color: "info" },
            { label: "Total Capacity", value: buses.reduce((a, b) => a + b.seats, 0), icon: Users, color: "warning" },
          ].map(s => (
            <div key={s.label} className="portal-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
                <s.icon className="w-4 h-4" style={{ color: `hsl(var(--${s.color}))` }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: `hsl(var(--${s.color}))` }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Fleet */}
        <div className="portal-card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>Registered Fleet</h3>
            <Button size="sm"
              style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Bus
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "hsl(var(--muted))" }}>
                  {["Bus Number", "Type", "Route", "Seats", "Fare (₹)", "Status", "Monthly Earnings", "Actions"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "hsl(var(--muted-foreground))" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buses.map(bus => (
                  <tr key={bus.id} className="border-b hover:bg-muted/20 transition-colors"
                    style={{ borderColor: "hsl(var(--border))" }}>
                    <td className="px-4 py-3 font-mono font-semibold text-xs" style={{ color: "hsl(var(--primary))" }}>{bus.id}</td>
                    <td className="px-4 py-3">{bus.type}</td>
                    <td className="px-4 py-3 text-xs">{bus.route}</td>
                    <td className="px-4 py-3">{bus.seats}</td>
                    <td className="px-4 py-3">
                      {editFare === bus.id ? (
                        <div className="flex gap-1">
                          <Input className="w-20 h-7 text-xs" value={fareVal} onChange={e => setFareVal(e.target.value)} />
                          <Button size="sm" className="h-7 text-xs px-2"
                            style={{ backgroundColor: "hsl(var(--success))", color: "white" }}
                            onClick={() => setEditFare(null)}>Save</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          ₹{bus.fare}
                          <button onClick={() => { setEditFare(bus.id); setFareVal(String(bus.fare)); }}
                            className="p-0.5 rounded hover:bg-primary-muted transition-colors">
                            <Edit className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`stat-badge ${bus.status === "Active" ? "bg-success-light text-success" : "bg-warning-light text-warning"}`}>
                        {bus.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "hsl(var(--primary))" }}>
                      ₹{bus.earnings.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-accent border-accent">
                          Rent
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Earnings chart */}
        <div className="portal-card p-5">
          <h3 className="font-bold text-sm mb-4" style={{ color: "hsl(var(--primary))" }}>
            <BarChart2 className="w-4 h-4 inline mr-2" />Monthly Earnings Overview
          </h3>
          <div className="flex items-end gap-3 h-32">
            {earningsData.map(e => (
              <div key={e.month} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>
                  ₹{(e.amount / 1000).toFixed(1)}k
                </p>
                <div className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${(e.amount / maxEarning) * 88}px`,
                    backgroundColor: "hsl(var(--primary))",
                    opacity: e.month === "Dec" ? 1 : 0.5
                  }} />
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{e.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rent for Event */}
        <div className="portal-card p-5"
          style={{ borderLeft: "4px solid hsl(var(--accent))" }}>
          <h3 className="font-bold text-sm mb-2" style={{ color: "hsl(var(--primary))" }}>
            <Package className="w-4 h-4 inline mr-2" style={{ color: "hsl(var(--accent))" }} />
            Mark Bus for Event Rent
          </h3>
          <p className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
            Make your bus available for school trips, corporate outings, or special events.
          </p>
          <div className="flex gap-2">
            <Button size="sm"
              style={{ backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
              Mark KA-01-F-9012 for Rent
            </Button>
            <Button size="sm" variant="outline">View Rent Requests</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
