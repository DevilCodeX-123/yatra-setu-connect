import { useState } from "react";
import {
  MapPin, Navigation, Users, Clock, Play, Square, AlertCircle, Bus,
  ChevronRight, User, Check, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";

const sidebarItems = [
  { href: "/driver", label: "Today's Route", icon: <Navigation className="w-4 h-4" /> },
  { href: "#passengers", label: "Passenger List", icon: <Users className="w-4 h-4" /> },
  { href: "#alerts", label: "Stop Alerts", icon: <AlertCircle className="w-4 h-4" /> },
];

const stops = [
  { name: "Bengaluru Kempegowda Bus Stand", time: "06:30", done: true, passengers: 12 },
  { name: "Chennapatna", time: "07:45", done: true, passengers: 4 },
  { name: "Maddur", time: "08:15", done: false, passengers: 2, next: true },
  { name: "Mandya", time: "08:40", done: false, passengers: 3 },
  { name: "Srirangapatna", time: "09:00", done: false, passengers: 1 },
  { name: "Mysuru KSRTC Stand", time: "09:15", done: false, passengers: 8 },
];

const exitPassengers = [
  { name: "Priya S.", seat: "12", stop: "Maddur" },
  { name: "Anand R.", seat: "7", stop: "Maddur" },
];

export default function DriverPanel() {
  const [tripActive, setTripActive] = useState(false);

  return (
    <DashboardLayout
      title="Driver Panel"
      subtitle="Today's trip management dashboard"
      sidebarItems={sidebarItems}>
      <div className="space-y-5 animate-slide-up">
        {/* Driver info + trip control */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="portal-card p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: "hsl(var(--primary))", color: "white" }}>
              SK
            </div>
            <div>
              <p className="font-bold" style={{ color: "hsl(var(--foreground))" }}>Suresh Kumar</p>
              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>License: KA-DL-123456</p>
              <span className="stat-badge bg-success-light text-success">On Duty</span>
            </div>
          </div>

          <div className="portal-card p-4">
            <p className="text-xs font-semibold tracking-wide mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              Assigned Bus
            </p>
            <p className="font-bold text-base" style={{ color: "hsl(var(--primary))" }}>KA-01-F-1234</p>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Express | 42 Seats | Bengaluru → Mysuru</p>
          </div>

          <div className="portal-card p-4 flex flex-col justify-between">
            <p className="text-xs font-semibold tracking-wide mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
              Trip Control
            </p>
            {!tripActive ? (
              <Button className="w-full" size="sm"
                style={{ backgroundColor: "hsl(var(--success))", color: "white" }}
                onClick={() => setTripActive(true)}>
                <Play className="w-4 h-4 mr-2" fill="white" /> Start Trip
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-success font-semibold">
                  <Radio className="w-3.5 h-3.5 live-pulse" /> Trip Active — GPS Live
                </div>
                <Button variant="outline" className="w-full" size="sm"
                  style={{ borderColor: "hsl(var(--danger))", color: "hsl(var(--danger))" }}
                  onClick={() => setTripActive(false)}>
                  <Square className="w-3.5 h-3.5 mr-2" fill="currentColor" /> End Trip
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Next stop alert */}
        <div className="portal-card p-4"
          style={{ borderLeft: "4px solid hsl(var(--accent))", backgroundColor: "hsl(var(--accent-light))" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--accent))" }} />
              <div>
                <p className="font-bold text-sm" style={{ color: "hsl(var(--foreground))" }}>
                  Next Stop: Maddur — 08:15
                </p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {exitPassengers.length} passengers disembarking at this stop
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline">
              <Check className="w-3.5 h-3.5 mr-1" /> Reached
            </Button>
          </div>
          <div className="mt-3 pl-8 space-y-1">
            {exitPassengers.map(p => (
              <div key={p.seat} className="flex items-center gap-2 text-xs">
                <User className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />
                <span className="font-medium">{p.name}</span>
                <span style={{ color: "hsl(var(--muted-foreground))" }}>Seat {p.seat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Route timeline */}
        <div className="portal-card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <h3 className="font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>Today's Route — Bengaluru to Mysuru</h3>
          </div>
          <div className="p-5">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5"
                style={{ backgroundColor: "hsl(var(--border))" }} />
              <div className="space-y-4">
                {stops.map((stop, i) => (
                  <div key={stop.name} className="relative flex items-start gap-4 pl-10">
                    <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center border-2 -translate-x-1/2 text-xs`}
                      style={{
                        backgroundColor: stop.done ? "hsl(var(--success))" : stop.next ? "hsl(var(--accent))" : "hsl(var(--muted))",
                        borderColor: stop.done ? "hsl(var(--success))" : stop.next ? "hsl(var(--accent))" : "hsl(var(--border))",
                        color: stop.done || stop.next ? "white" : "hsl(var(--muted-foreground))",
                        zIndex: 1
                      }}>
                      {stop.done ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <div className="flex-1 flex items-center justify-between py-0.5">
                      <div>
                        <p className={`text-sm font-${stop.next ? "bold" : "medium"}`}
                          style={{ color: stop.done ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))" }}>
                          {stop.name}
                          {stop.next && <span className="ml-2 text-xs font-bold" style={{ color: "hsl(var(--accent))" }}>← NEXT</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>
                          <Clock className="w-3 h-3 inline mr-1" />{stop.time}
                        </span>
                        <span className="stat-badge"
                          style={{ backgroundColor: "hsl(var(--primary-muted))", color: "hsl(var(--primary))" }}>
                          {stop.passengers} exit
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
