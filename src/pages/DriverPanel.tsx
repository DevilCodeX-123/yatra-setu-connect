import { useState, useEffect, useRef } from "react";
import {
  MapPin, Navigation, Users, Clock, Play, Square, AlertCircle, Bus,
  ChevronRight, User, Check, Radio, ShieldAlert, Flag, Send, RefreshCw, LogOut, Wifi, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  { href: "/driver", id: "route", label: "Today's Route", icon: <Navigation className="w-4 h-4" /> },
  { href: "#passengers", id: "passengers", label: "Passenger List", icon: <Users className="w-4 h-4" /> },
  { href: "#alerts", id: "alerts", label: "Stop Alerts", icon: <AlertCircle className="w-4 h-4" /> },
];

export default function DriverPanel() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("route");
  const [bus, setBus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tripActive, setTripActive] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [loadingPassengers, setLoadingPassengers] = useState(false);
  const [isTrackingPaused, setIsTrackingPaused] = useState(false);
  const locationInterval = useRef<any>(null);

  useEffect(() => {
    fetchBusData();
  }, []);

  const fetchBusData = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployeeInvitations();
      // Current active bus for driver
      const activeBus = res.find((b: any) => b.status === 'Active');
      if (activeBus) {
        const busDetails = await api.getBusById(activeBus.busId);
        setBus(busDetails);
        fetchPassengers(busDetails.busNumber);
      }
    } catch (err) {
      toast.error("Failed to load bus data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPassengers = async (busNumber: string) => {
    try {
      setLoadingPassengers(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/employee/passengers?busNumber=${busNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ys_token')}`
        }
      });
      const data = await res.json();
      setPassengers(data.passengers || []);
    } catch (err) {
      console.error("Failed to fetch passengers", err);
    } finally {
      setLoadingPassengers(false);
    }
  };

  // Simulation/GPS Location Tracking
  useEffect(() => {
    if (tripActive && bus && !isTrackingPaused) {
      // Start location updates
      locationInterval.current = setInterval(() => {
        const mockLat = 18.5204 + (Math.random() - 0.5) * 0.01;
        const mockLng = 73.8567 + (Math.random() - 0.5) * 0.01;
        const newLoc = { lat: mockLat, lng: mockLng };
        setLocation(newLoc);
        api.updateBusLocation(bus.busNumber, newLoc.lat, newLoc.lng);
      }, 5000);
    } else {
      if (locationInterval.current) clearInterval(locationInterval.current);
    }
    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, [tripActive, bus]);

  const handleStartTrip = async () => {
    if (!bus) return;
    try {
      await api.updateBusStatus(bus._id, 'Active');
      setTripActive(true);
      toast.success("Trip Started! GPS is now live.");
    } catch (err) {
      toast.error("Failed to start trip");
    }
  };

  const handleEndTrip = async () => {
    if (!bus) return;
    try {
      await api.updateBusStatus(bus._id, 'Temp-Offline');
      setTripActive(false);
      toast.success("Trip Ended. Status: Temp-Offline");
    } catch (err) {
      toast.error("Failed to end trip");
    }
  };

  const handleSetPrimaryLocation = async () => {
    if (!bus || !location) {
      toast.error("Waiting for GPS signal...");
      return;
    }
    try {
      await api.setOriginLocation(bus._id, location);
      toast.success("Current location set as Primary Origin");
    } catch (err) {
      toast.error("Failed to set origin");
    }
  };

  const handleEmergency = async () => {
    if (!bus) return;
    const type = window.prompt("Type of Emergency (e.g. Breakdown, Medical, Accident):", "Technical Issue");
    if (!type) return;

    try {
      await api.reportEmergency(bus.busNumber, type, "Emergency reported by driver via Safety Key", location);
      toast.success("Emergency report sent to Owner & Authorities");
    } catch (err) {
      toast.error("Failed to report emergency");
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Driver Panel" subtitle="Loading your bus data..." sidebarItems={sidebarItems}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <RefreshCw className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Fetching Duty Details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!bus) {
    return (
      <DashboardLayout title="Driver Panel" subtitle="No active duty found" sidebarItems={sidebarItems}>
        <div className="portal-card p-10 text-center flex flex-col items-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <Bus className="w-12 h-12 text-muted-foreground opacity-30" />
          </div>
          <h2 className="text-xl font-black text-primary">No Bus Assigned</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Contact your owner to get assigned to a bus or check your invitations to accept a job offer.
          </p>
          <Button variant="outline" onClick={fetchBusData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh Status
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Driver Panel"
      subtitle={`On Duty: ${bus.busNumber}`}
      sidebarItems={sidebarItems}>

      {/* Floating Safety Key */}
      <button
        onClick={handleEmergency}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-red-600 text-white shadow-2xl flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 group border-4 border-red-200 dark:border-red-900 overflow-hidden"
      >
        <ShieldAlert className="w-7 h-7" />
        <span className="text-[8px] font-black uppercase mt-0.5">Safety</span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
      </button>

      <div className="space-y-6 animate-slide-up pb-20">
        {/* Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="portal-card p-4 border-l-4 border-primary bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                {user?.name?.charAt(0) || "D"}
              </div>
              <div>
                <p className="font-black text-primary text-sm uppercase tracking-tight">{user?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-success/10 text-success border-success/20 text-[9px] font-black">ON DUTY</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground opacity-60">ID: {(user as any)?._id?.slice(-6).toUpperCase() || (user as any)?.id?.slice(-6).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="portal-card p-4 border-l-4 border-accent">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Vehicle Status</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-primary">{bus.busNumber}</p>
                <p className="text-[10px] font-bold text-muted-foreground">{bus.name || bus.orgName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-accent uppercase">{bus.status}</p>
                <p className="text-[10px] font-bold text-muted-foreground">{bus.totalSeats} Cabin Seats</p>
              </div>
            </div>
          </div>

          <div className="portal-card p-4 border-l-4 border-indigo-500">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Trip Control</p>
            {!tripActive ? (
              <Button className="w-full h-10 font-black uppercase tracking-wider bg-success hover:bg-success/90" onClick={handleStartTrip}>
                <Play className="w-4 h-4 mr-2 fill-white" /> Start Duty Mode
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-10 border-red-500 text-red-500 font-black uppercase tracking-wider hover:bg-red-50" onClick={handleEndTrip}>
                  <Square className="w-4 h-4 mr-2 fill-red-500" /> End Trip
                </Button>
                <Button size="icon" variant="secondary" className="h-10 w-10" onClick={handleSetPrimaryLocation} title="Set as Return Point">
                  <MapPin className="w-4 h-4 text-primary" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Live Tracking & Next Stop */}
        {tripActive && (
          <div className="portal-card p-5 border-l-4 border-success bg-gradient-to-r from-success/5 to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <Radio className="w-4 h-4 text-success animate-pulse" />
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-success/20 text-success">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-primary">LIVE NAVIGATION ACTIVE</h3>
                      <p className="text-xs font-bold text-muted-foreground">Route: {bus.route?.from} → {bus.route?.to}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-8 text-[10px] font-black ${isTrackingPaused ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-primary/5 text-primary'}`}
                    onClick={() => setIsTrackingPaused(!isTrackingPaused)}
                  >
                    {isTrackingPaused ? <WifiOff className="w-3 h-3 mr-1" /> : <Wifi className="w-3 h-3 mr-1" />}
                    {isTrackingPaused ? 'RESUME TRACKING' : 'PAUSE TRACKING'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Next Stop Awareness</p>
                  <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-success/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-primary">{bus.route?.stops?.[0]?.name || "Destination"}</p>
                      <p className="text-[10px] font-bold text-muted-foreground mt-0.5">ETA: 08:45 AM • 2.4 KM away</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black text-success hover:bg-success/10 border border-success/20"
                      onClick={() => api.submitStopPoll(bus._id, 0, "Arrived")}>
                      MARK ARRIVED
                    </Button>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64 h-32 rounded-2xl bg-muted relative overflow-hidden border border-border">
                {/* Mock Map View */}
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-4 h-4 bg-primary rounded-full animate-ping absolute opacity-40" />
                    <div className="w-4 h-4 bg-primary rounded-full relative border-2 border-white shadow-lg" />
                  </div>
                  <div className="absolute bottom-2 left-2 p-1 px-2 rounded-lg bg-white/80 backdrop-blur-sm text-[8px] font-black uppercase text-primary border border-primary/20">
                    LAT: {location?.lat?.toFixed(4) || "0.00"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Route Details & Passengers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="portal-card overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <h3 className="font-black text-xs text-primary uppercase tracking-widest">Route Stations</h3>
              <Badge variant="outline" className="text-[9px] font-black">{bus.route?.stops?.length || 0} STOPS</Badge>
            </div>
            <div className="p-6">
              <div className="relative space-y-6">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border border-dashed" />

                {/* From */}
                <div className="relative flex gap-4 pl-10">
                  <div className="absolute left-1.5 w-4 h-4 rounded-full bg-success border-4 border-white shadow-sm -translate-x-1/2 mt-1" />
                  <div>
                    <p className="text-sm font-black text-primary">{bus.route?.from}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">Original Starting Point</p>
                  </div>
                </div>

                {/* Stops */}
                {bus.route?.stops?.map((stop: any, idx: number) => (
                  <div key={idx} className="relative flex gap-4 pl-10">
                    <div className="absolute left-1.5 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary -translate-x-1/2 mt-1" />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">{stop.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground opacity-60">Arrival: {stop.arrivalTime || "--:--"}</p>
                      </div>
                      <Badge variant="secondary" className="font-mono text-[9px]">₹{stop.price}</Badge>
                    </div>
                  </div>
                ))}

                {/* To */}
                <div className="relative flex gap-4 pl-10">
                  <div className="absolute left-1.5 w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow-sm -translate-x-1/2 mt-1" />
                  <div>
                    <p className="text-sm font-black text-primary">{bus.route?.to}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">Final Destination</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="portal-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <h3 className="font-black text-xs text-primary uppercase tracking-widest">Boarded Passengers</h3>
              <Badge variant="outline" className="text-[9px] font-black text-success border-success/30">{passengers.filter(p => p.boarded).length} ONBOARD</Badge>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {loadingPassengers ? (
                <div className="p-10 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary/30" /></div>
              ) : passengers.length === 0 ? (
                <div className="p-20 text-center opacity-40 italic text-sm">No passengers for today's trip</div>
              ) : (
                <div className="divide-y divide-border">
                  {passengers.map((p, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-xs">
                          {p.seat}
                        </div>
                        <div>
                          <p className="text-xs font-black text-primary">{p.name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground">{p.pnr} • {p.paymentMethod}</p>
                        </div>
                      </div>
                      {!p.boarded ? (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-black uppercase text-success border-success/30"
                          onClick={async () => {
                            await fetch(`${import.meta.env.VITE_API_URL || '/api'}/employee/passengers/${p.pnr}/board`, {
                              method: 'PATCH',
                              headers: { 'Authorization': `Bearer ${localStorage.getItem('ys_token')}` }
                            });
                            fetchPassengers(bus.busNumber);
                            toast.success(`Boarded: ${p.name}`);
                          }}>
                          BOARD
                        </Button>
                      ) : (
                        <Badge className="bg-success text-white text-[9px] font-black">BOARDED</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
