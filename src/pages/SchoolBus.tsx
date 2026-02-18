import { School, Bell, MapPin, Radio, Shield, Clock, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const schoolBuses = [
  {
    id: "SCH-001", school: "Delhi Public School, Indiranagar",
    route: "Indiranagar → DPS → Home",
    driver: "Ramesh V.", students: 28, capacity: 32,
    status: "En Route", eta: "3:45 PM", lastStop: "Koramangala",
    notifications: "Parent notified: 24 / 28",
    position: { top: "30%", left: "45%" }
  },
  {
    id: "SCH-002", school: "Kendriya Vidyalaya, HSR Layout",
    route: "HSR Layout → KV → Home",
    driver: "Suraj M.", students: 22, capacity: 32,
    status: "Reached School", eta: "—",
    lastStop: "School Campus",
    notifications: "All parents notified ✓",
    position: { top: "55%", left: "60%" }
  },
];

const safetyFeatures = [
  { icon: Radio, label: "Live GPS Tracking", desc: "Real-time location updates every 30 seconds" },
  { icon: Bell, label: "Parent Alerts", desc: "Auto SMS/app notification on arrival & departure" },
  { icon: Shield, label: "Panic Button", desc: "Emergency alert directly to school admin & police" },
  { icon: Clock, label: "Attendance Check", desc: "Digital roll call at every boarding point" },
];

export default function SchoolBus() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: "hsl(var(--info-light))" }}>
            <School className="w-6 h-6 text-info" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--primary))" }}>School Bus Safety Tracker</h1>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Live tracking & parent notification system
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-success">
            <Radio className="w-3.5 h-3.5 live-pulse" />
            System Active
          </div>
        </div>

        {/* Safety features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {safetyFeatures.map(f => (
            <div key={f.label} className="portal-card p-4 text-center">
              <div className="inline-flex p-2 rounded-lg mb-2" style={{ backgroundColor: "hsl(var(--info-light))" }}>
                <f.icon className="w-4 h-4 text-info" />
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--primary))" }}>{f.label}</p>
              <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Live map placeholder */}
        <div className="portal-card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "hsl(var(--border))" }}>
            <Radio className="w-4 h-4 live-pulse text-success" />
            <h3 className="font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>Live Map — School Bus Locations</h3>
          </div>
          <div className="relative h-48" style={{ backgroundColor: "hsl(var(--info-light))" }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                🗺️ Live GPS Map — Tracking Active
              </p>
            </div>
            {schoolBuses.map(bus => (
              <div key={bus.id} className="absolute"
                style={{ top: bus.position.top, left: bus.position.left, transform: "translate(-50%,-50%)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-elevated border-2 border-white"
                  style={{ backgroundColor: bus.status === "Reached School" ? "hsl(var(--success))" : "hsl(var(--info))" }}>
                  <School className="w-4 h-4 text-white" />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "hsl(var(--primary))", color: "white" }}>
                  {bus.id}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bus cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schoolBuses.map(bus => (
            <div key={bus.id} className="portal-card overflow-hidden">
              {/* Status bar */}
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ backgroundColor: bus.status === "Reached School" ? "hsl(var(--success-light))" : "hsl(var(--info-light))" }}>
                {bus.status === "Reached School"
                  ? <CheckCircle className="w-4 h-4 text-success" />
                  : <Radio className="w-4 h-4 text-info live-pulse" />}
                <p className="text-sm font-bold"
                  style={{ color: bus.status === "Reached School" ? "hsl(var(--success))" : "hsl(var(--info))" }}>
                  {bus.status}
                </p>
                <span className="ml-auto text-xs font-mono">{bus.id}</span>
              </div>

              <div className="p-4 space-y-3">
                {/* School name */}
                <div>
                  <p className="font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>{bus.school}</p>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{bus.route}</p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "Driver", value: bus.driver },
                    { label: "Students", value: `${bus.students} / ${bus.capacity}` },
                    { label: "Last Stop", value: bus.lastStop },
                    { label: "ETA Home", value: bus.eta },
                  ].map(d => (
                    <div key={d.label}>
                      <p style={{ color: "hsl(var(--muted-foreground))" }}>{d.label}</p>
                      <p className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{d.value}</p>
                    </div>
                  ))}
                </div>

                {/* Parent notification status */}
                <div className="p-2 rounded-lg text-xs"
                  style={{ backgroundColor: "hsl(var(--success-light))" }}>
                  <Bell className="w-3.5 h-3.5 inline mr-1 text-success" />
                  <span className="font-medium text-success">{bus.notifications}</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7">View Route</Button>
                  <Button size="sm" className="flex-1 text-xs h-7"
                    style={{ backgroundColor: "hsl(var(--primary))", color: "white" }}>
                    Notify Parents
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Parent lookup */}
        <div className="portal-card p-5 mt-4">
          <h3 className="font-bold text-sm mb-3" style={{ color: "hsl(var(--primary))" }}>
            <Users className="w-4 h-4 inline mr-2" />Parent Lookup — Track Your Child's Bus
          </h3>
          <div className="flex gap-2">
            <input className="flex-1 h-9 px-3 rounded-md border text-sm"
              style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
              placeholder="Enter child's admission number or parent mobile..." />
            <Button size="sm"
              style={{ backgroundColor: "hsl(var(--primary))", color: "white" }}>
              Track Bus
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
