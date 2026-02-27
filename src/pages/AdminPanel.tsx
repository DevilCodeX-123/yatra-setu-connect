import { useState, useEffect } from "react";
import {
  Bus, Users, Route, Radio, Shield, School,
  TrendingUp, AlertTriangle, Map, Settings, Eye, RefreshCw, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const sidebarItems = [
  { href: "/admin", label: "Overview", icon: <TrendingUp className="w-4 h-4" /> },
  { href: "#buses", label: "All Buses", icon: <Bus className="w-4 h-4" /> },
  { href: "#drivers", label: "Drivers & Owners", icon: <Users className="w-4 h-4" /> },
  { href: "#routes", label: "Routes", icon: <Route className="w-4 h-4" /> },
];

interface AdminStats {
  totalBuses: number;
  totalUsers: number;
  totalEmployees: number;
  totalBookings: number;
  totalAlerts: number;
  activeRoutes: number;
  totalRevenue: number;
  allBuses: {
    _id: string; busNumber: string; status: string;
    from?: string; to?: string;
    ownerName?: string; ownerEmail?: string;
    lat?: number; lng?: number;
    employeeCount: number;
  }[];
}

export default function AdminPanel() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); }, [token]);

  const statCards = stats ? [
    { label: "Total Buses", value: String(stats.totalBuses), icon: Bus, color: "primary" },
    { label: "Active Routes", value: String(stats.activeRoutes), icon: Route, color: "info" },
    { label: "Registered Employees", value: String(stats.totalEmployees), icon: Users, color: "success" },
    { label: "Total Bookings", value: String(stats.totalBookings), icon: Shield, color: "warning" },
    { label: "Total Users", value: String(stats.totalUsers), icon: Users, color: "primary" },
    { label: "Emergency Alerts", value: String(stats.totalAlerts), icon: AlertTriangle, color: "destructive" },
  ] : [];

  return (
    <DashboardLayout
      title="Admin Control Panel"
      subtitle="System-level management dashboard"
      sidebarItems={sidebarItems}>
      <div className="space-y-5 animate-slide-up">

        {/* Stats */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Live System Stats</h2>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statCards.map(s => (
              <div key={s.label} className="portal-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  <s.icon className="w-4 h-4" style={{ color: `hsl(var(--${s.color}))` }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--${s.color}))` }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Revenue */}
        {stats && (
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Platform Revenue</p>
              <p className="text-2xl font-black text-emerald-500">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500/30" />
          </div>
        )}

        {/* All buses table — Real data */}
        <div className="portal-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              All Registered Buses
            </h3>
            {stats && <span className="text-xs text-muted-foreground">{stats.totalBuses} total</span>}
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
            ) : !stats || stats.allBuses.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <Bus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No buses registered yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "hsl(var(--muted))" }}>
                    {["Bus ID", "Route", "Owner", "Status", "Location", "Staff", "Actions"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.allBuses.map(bus => (
                    <tr key={bus._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-xs text-primary">{bus.busNumber}</td>
                      <td className="px-4 py-3 text-xs">
                        {bus.from && bus.to ? `${bus.from} → ${bus.to}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-bold">{bus.ownerName || "—"}</p>
                        <p className="text-muted-foreground text-[10px]">{bus.ownerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`stat-badge ${bus.status === "Active" ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                          {bus.status === "Active" && <Radio className="w-2.5 h-2.5 mr-1 live-pulse inline" />}
                          {bus.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        {bus.lat && bus.lng ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary" />
                            {bus.lat.toFixed(2)}°N, {bus.lng.toFixed(2)}°E
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">{bus.employeeCount}</td>
                      <td className="px-4 py-3">
                        <Link to={`/tracking/${bus.busNumber}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                            <Eye className="w-3 h-3 mr-1" />Track
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
