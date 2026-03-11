import { useState, useEffect } from "react";
import {
  Bus, Users, Route, Radio, Shield, School,
  TrendingUp, AlertTriangle, Map, Settings, Eye, RefreshCw, MapPin, Zap, Activity, Database, Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  { href: "/admin", label: "System Overview", icon: <TrendingUp className="size-4" /> },
  { href: "#buses", label: "Fleet Management", icon: <Bus className="size-4" /> },
  { href: "#drivers", label: "User Directory", icon: <Users className="size-4" /> },
  { href: "#routes", label: "Network Routes", icon: <Route className="size-4" /> },
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

  const load = async () => {
    setLoading(true);
    try {
      // In a real app, we'd have api.getAdminStats
      const r = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setStats(d);
    } catch (err) {
      console.error(err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const mainStats = stats ? [
    { label: "Total Fleet", value: stats.totalBuses, icon: Bus, color: "text-primary", bg: "bg-primary/5" },
    { label: "Active Routes", value: stats.activeRoutes, icon: Route, color: "text-blue-500", bg: "bg-blue-500/5" },
    { label: "Network Staff", value: stats.totalEmployees, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/5" },
    { label: "Direct Bookings", value: stats.totalBookings, icon: Shield, color: "text-indigo-500", bg: "bg-indigo-500/5" },
  ] : [];

  return (
    <DashboardLayout
      title="System Command Center"
      subtitle="Global Platform Administration & Real-time Monitoring"
      sidebarItems={sidebarItems}>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

        {/* System Health / Real-time Gauges (Premium Look) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-6 text-white shadow-2xl overflow-hidden relative border border-white/5">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Activity className="size-32" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Platform Status: Healthy</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-4">Core Infrastructure</h3>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase opacity-40">
                    <span>Server Load</span>
                    <span>12%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[12%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase opacity-40">
                    <span>Active Sockets</span>
                    <span>1.2k</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[65%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[32px] p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="size-5" />
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-0 font-black text-[9px] uppercase tracking-widest">+12.4%</Badge>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Revenue Flow</p>
              <p className="text-2xl font-black">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[32px] p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-600">
                <AlertTriangle className="size-5" />
              </div>
              <Badge className="bg-red-500/10 text-red-600 border-0 font-black text-[9px] uppercase tracking-widest">Urgent</Badge>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Active Alerts</p>
              <p className="text-2xl font-black text-red-500">{stats?.totalAlerts || 0}</p>
            </div>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mainStats.map(s => (
            <div key={s.label} className="bg-card border border-border p-5 rounded-3xl hover:bg-secondary/50 transition-all group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                  <s.icon className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 tracking-tighter">{s.label}</p>
                  <p className="text-xl font-black">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fleet Management Table */}
        <div className="bg-card border border-border overflow-hidden rounded-[32px] shadow-sm">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-emerald-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-widest text-primary">Fleet Command Directory</h3>
            </div>
            <Button size="sm" variant="ghost" onClick={load} disabled={loading} className="h-8 rounded-xl gap-2 font-black uppercase text-[10px]">
              <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} /> Sync Fleet
            </Button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-16 text-center">
                <RefreshCw className="size-8 animate-spin mx-auto text-primary opacity-20" />
              </div>
            ) : !stats || stats.allBuses.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <Bus className="size-12 mx-auto text-muted-foreground opacity-10" />
                <p className="text-sm font-bold text-muted-foreground opacity-50 uppercase tracking-widest">No deployed vehicles</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30">
                    {["Bus Identity", "Route Segment", "Ownership", "Core Status", "Telemetry", "Admin"].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {stats.allBuses.map(bus => (
                    <tr key={bus._id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center font-black text-[10px] text-primary">
                            <Bus className="size-4" />
                          </div>
                          <span className="font-mono font-black text-sm tracking-tighter">{bus.busNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span>{bus.from || "Unset"}</span>
                          <ArrowRight className="size-3 text-muted-foreground opacity-30" />
                          <span>{bus.to || "Unset"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-black text-foreground">{bus.ownerName || "—"}</p>
                        <p className="text-[10px] font-bold text-muted-foreground opacity-60">{bus.ownerEmail}</p>
                      </td>
                      <td className="px-6 py-5">
                        <Badge className={`rounded-xl text-[9px] font-black uppercase tracking-widest px-2.5 py-1 ${bus.status === "Active" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                          }`}>
                          {bus.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        {bus.lat && bus.lng ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            GPS Lock: {bus.lat.toFixed(2)}, {bus.lng.toFixed(2)}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground opacity-40 italic">Offline</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <Link to={`/tracking/${bus.busNumber}`}>
                          <Button variant="secondary" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase bg-secondary hover:bg-primary hover:text-white transition-all">
                            Manage
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
