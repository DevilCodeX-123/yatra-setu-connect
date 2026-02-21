import {
  Bus, Users, Navigation, Route, Plus, Radio, Shield, School,
  TrendingUp, AlertTriangle, Map, Settings, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";

const sidebarItems = [
  { href: "/admin", label: "Overview", icon: <TrendingUp className="w-4 h-4" /> },
  { href: "#buses", label: "All Buses", icon: <Bus className="w-4 h-4" /> },
  { href: "#drivers", label: "Drivers & Owners", icon: <Users className="w-4 h-4" /> },
  { href: "#routes", label: "Routes", icon: <Route className="w-4 h-4" /> },
  { href: "#school", label: "School Buses", icon: <School className="w-4 h-4" /> },
  { href: "#events", label: "Event Buses", icon: <Shield className="w-4 h-4" /> },
];

const allBuses = [
  { id: "KA-01-F-1234", route: "Bengaluru → Mysuru", driver: "Suresh K.", owner: "Ravi Motors", status: "Running", lat: "12.9°N", lng: "77.5°E" },
  { id: "KA-01-F-5678", route: "Mysuru → Bengaluru", driver: "Mohan P.", owner: "Jayalakshmi Transports", status: "Running", lat: "12.5°N", lng: "77.1°E" },
  { id: "KA-01-F-9012", route: "Bengaluru → Mangaluru", driver: "Venkat R.", owner: "Ravi Motors", status: "Maintenance", lat: "—", lng: "—" },
  { id: "KA-01-F-3456", route: "Hubballi → Belgaum", driver: "Prakash D.", owner: "North Star Bus", status: "Running", lat: "15.3°N", lng: "75.1°E" },
  { id: "SCH-001", route: "Indiranagar → Delhi Public School", driver: "Ramesh V.", owner: "School Fleet", status: "Running", lat: "12.9°N", lng: "77.6°E" },
];

const adminStats = [
  { label: "Total Buses", value: "4,218", icon: Bus, color: "primary" },
  { label: "Active Routes", value: "892", icon: Route, color: "info" },
  { label: "Registered Drivers", value: "3,841", icon: Users, color: "success" },
  { label: "Alerts Today", value: "12", icon: AlertTriangle, color: "warning" },
];

export default function AdminPanel() {
  return (
    <DashboardLayout
      title="Admin Control Panel"
      subtitle="Organisation-level management dashboard"
      sidebarItems={sidebarItems}>
      <div className="space-y-5 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {adminStats.map(s => (
            <div key={s.label} className="portal-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
                <s.icon className="w-4 h-4" style={{ color: `hsl(var(--${s.color}))` }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: `hsl(var(--${s.color}))` }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Live bus map placeholder */}
        <div className="portal-card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "hsl(var(--border))" }}>
            <Radio className="w-4 h-4 live-pulse text-success" />
            <h3 className="font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>Live Bus Tracking Map</h3>
            <span className="ml-auto text-xs font-semibold text-success">4,218 buses active</span>
          </div>
          <div className="relative h-48 md:h-64"
            style={{ backgroundColor: "hsl(var(--primary-muted))" }}>
            {/* Map placeholder with visual cues */}
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
              <Map className="w-10 h-10" style={{ color: "hsl(var(--primary) / 0.3)" }} />
              <p className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                Interactive map — GPS coordinates loaded
              </p>
            </div>
            {/* Mock location pins */}
            {[
              { top: "30%", left: "40%", id: "1234" },
              { top: "55%", left: "55%", id: "5678" },
              { top: "25%", left: "65%", id: "3456" },
              { top: "70%", left: "30%", id: "9012" },
            ].map(pin => (
              <div key={pin.id} className="absolute w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                style={{ top: pin.top, left: pin.left, backgroundColor: "hsl(var(--primary))", transform: "translate(-50%,-50%)" }}>
                <span className="text-[8px] text-white font-bold">B</span>
              </div>
            ))}
          </div>
        </div>

        {/* All buses table */}
        <div className="portal-card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>All Registered Buses</h3>
            <Button size="sm"
              style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Bus
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "hsl(var(--muted))" }}>
                  {["Bus ID", "Route", "Driver", "Owner", "Status", "Location", "Actions"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide"
                      style={{ color: "hsl(var(--muted-foreground))" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allBuses.map(bus => (
                  <tr key={bus.id} className="border-b hover:bg-muted/20 transition-colors"
                    style={{ borderColor: "hsl(var(--border))" }}>
                    <td className="px-4 py-3 font-mono font-semibold text-xs" style={{ color: "hsl(var(--primary))" }}>
                      {bus.id.startsWith("SCH") ? (
                        <span className="flex items-center gap-1">
                          <School className="w-3 h-3 text-info" /> {bus.id}
                        </span>
                      ) : bus.id}
                    </td>
                    <td className="px-4 py-3 text-xs">{bus.route}</td>
                    <td className="px-4 py-3">{bus.driver}</td>
                    <td className="px-4 py-3 text-xs">{bus.owner}</td>
                    <td className="px-4 py-3">
                      <span className={`stat-badge ${bus.status === "Running" ? "bg-success-light text-success" : "bg-warning-light text-warning"}`}>
                        {bus.status === "Running" && <Radio className="w-2.5 h-2.5 mr-1 live-pulse" />}
                        {bus.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {bus.lat !== "—" ? `${bus.lat}, ${bus.lng}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                          <Eye className="w-3 h-3 mr-1" />View
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                          <Settings className="w-3 h-3 mr-1" />Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Route management */}
        <div className="portal-card p-5 pb-10 md:pb-5">
          <h3 className="text-sm text-premium text-primary mb-3">
            <Route className="w-4 h-4 inline mr-2" />Route Management
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Active Routes", value: 892, color: "success" },
              { label: "Suspended Routes", value: 14, color: "warning" },
              { label: "Event/Rented", value: 6, color: "info" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between p-3 rounded-xl border border-border"
                style={{ backgroundColor: `hsl(var(--${r.color}-light))` }}>
                <span className="text-xs font-bold text-slate-500">{r.label}</span>
                <span className="text-xl text-premium" style={{ color: `hsl(var(--${r.color}))` }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
