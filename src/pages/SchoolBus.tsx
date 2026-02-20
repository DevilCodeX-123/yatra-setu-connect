import { School, Bell, MapPin, Radio, Shield, Clock, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import MapplsMap from "@/components/MapplsMap";

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

        {/* Live map */}
        <div className="portal-card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "hsl(var(--border))" }}>
            <Radio className="w-4 h-4 live-pulse text-success" />
            <h3 className="font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>Live Map — School Bus Locations</h3>
          </div>
          <div className="h-48">
            <MapplsMap
              markers={schoolBuses.map(bus => ({
                lat: 12.9716 + (Math.random() * 0.1 - 0.05), // Slightly randomized around Bangalore for demo
                lon: 77.5946 + (Math.random() * 0.1 - 0.05),
                label: bus.id
              }))}
              className="h-full rounded-none border-none shadow-none"
            />
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
        <div className="portal-card p-4 sm:p-5 mt-4">
          <h3 className="font-bold text-xs sm:text-sm mb-3 text-premium text-primary">
            <Users className="w-3.5 h-3.5 inline mr-2" />Parent Lookup — Track Your Child's Bus
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input className="flex-1 h-10 px-3 rounded-md border text-sm"
              style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
              placeholder="Admission No. / Mobile No." />
            <Button size="sm" className="h-10 sm:h-auto"
              style={{ backgroundColor: "hsl(var(--primary))", color: "white" }}>
              Track Bus
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
