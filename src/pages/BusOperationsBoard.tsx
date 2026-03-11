import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft, Bus, Calendar, History, MapPin, Search,
    Navigation, Activity, Users, Clock, Zap, Map as MapIcon, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import API_BASE_URL, { api } from "@/lib/api";
import { format } from "date-fns";
import MapplsMap from "@/components/MapplsMap";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function BusOperationsBoard({ embedded = false, targetBusId = null }: { embedded?: boolean, targetBusId?: string | null }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [buses, setBuses] = useState<any[]>([]);
    const [selectedBusId, setSelectedBusId] = useState<string>(targetBusId || "");
    const [busData, setBusData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'live' | 'future' | 'history'>('live');
    const [loading, setLoading] = useState(false);
    const [busBookings, setBusBookings] = useState<any[]>([]);

    // Live Tracking Mock States for the Map
    const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [speed, setSpeed] = useState(55);

    // Sidebar items based on existing OwnerPanel
    const sidebarItems = [
        { label: "Fleet Overview", icon: <Bus className="w-4 h-4" />, id: "fleet", href: "/owner" },
        { label: "Bus Board", icon: <Activity className="w-4 h-4" />, id: "board", href: "/owner/board", active: true },
        // other tabs omitted for brevity, owner can use back button
    ];

    useEffect(() => {
        // Fetch fleet to populate standard dropdown
        api.getOwnerDashboard().then(res => {
            if (res.buses) {
                setBuses(res.buses);
                // Check if busNumber is in URL
                const params = new URLSearchParams(window.location.search);
                const bNum = params.get("busNumber");
                if (bNum) {
                    setSelectedBusId(bNum);
                } else if (res.buses.length > 0) {
                    setSelectedBusId(res.buses[0]._id);
                }
            }
        }).catch(err => console.error("Failed to load buses for board", err));
    }, []);

    useEffect(() => {
        if (!selectedBusId) return;
        setLoading(true);
        fetch(`${API_BASE_URL}/buses/by-id/${selectedBusId}`)
            .then(r => r.json())
            .then(data => {
                setBusData(data);
                if (data?.route?.stops?.length > 0) {
                    setBusLocation({ lat: data.route.stops[0].lat, lng: data.route.stops[0].lng });
                }
            })
            .catch(err => toast.error("Failed to load bus details"))
            .finally(() => setLoading(false));

        // Fetch bookings for this bus to show segment load
        api.getOwnerBookings().then(res => {
            if (res.success) {
                const filtered = res.bookings.filter((b: any) => b.bus?._id === selectedBusId);
                setBusBookings(filtered);
            }
        }).catch(err => console.error("Failed to load bookings for board", err));
    }, [selectedBusId]);

    // Live Map Simulation for "View Live" effect
    useEffect(() => {
        if (activeTab !== 'live' || !busData?.route?.stops?.length) return;
        const pts = busData.route.stops;
        let destIdx = 1;
        if (destIdx >= pts.length) return;

        const dest = pts[destIdx];

        const interval = setInterval(() => {
            setSpeed(prev => Math.max(45, Math.min(65, prev + (Math.floor(Math.random() * 5) - 2))));
            setBusLocation(prev => {
                if (!prev) return { lat: pts[0].lat, lng: pts[0].lng };
                const step = 0.0005;
                const dLat = dest.lat - prev.lat;
                const dLng = dest.lng - prev.lng;
                const dist = Math.sqrt(dLat * dLat + dLng * dLng);
                if (dist < step) return { lat: dest.lat, lng: dest.lng };
                return { lat: prev.lat + (dLat / dist) * step, lng: prev.lng + (dLng / dist) * step };
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [busData, activeTab]);

    const activeStops = busData?.route?.stops || [];
    const futureRoutes = busData?.futureRoutes || [];
    const routeHistory = busData?.routeHistory?.slice(0, 25) || []; // Past 25 routes

    // Map Markers
    const markers = activeStops.map((s: any, i: number) => ({
        lat: s.lat, lon: s.lng,
        label: i === 0 ? `START: ${s.name}` : i === activeStops.length - 1 ? `END: ${s.name}` : s.name
    }));

    const totalSeats = busData?.totalSeats || 40;

    function renderContent() {
        if (!selectedBusId) return (
            <div className="p-12 text-center bg-card rounded-3xl border border-dashed border-border flex flex-col items-center">
                <Bus className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-black text-foreground">No Bus Selected</h3>
                <p className="text-xs font-bold text-muted-foreground">Please select a bus from the dropdown above to view its operations board.</p>
            </div>
        );
        if (loading) return (
            <div className="p-12 text-center bg-card rounded-3xl border border-border flex items-center justify-center">
                <RotateCcw className="w-8 h-8 animate-spin text-primary opacity-50" />
            </div>
        );

        return (
            <>
                {/* Tabs */}
                <div className="flex bg-secondary p-1.5 rounded-2xl w-fit border border-border mt-4">
                    <button onClick={() => setActiveTab('live')} className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-black/5'}`}>
                        <Activity className="w-4 h-4" /> Live Schedule & Track
                    </button>
                    <button onClick={() => setActiveTab('future')} className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'future' ? 'bg-amber-500 text-white shadow-md' : 'text-muted-foreground hover:bg-black/5'}`}>
                        <Calendar className="w-4 h-4" /> Future Plan ({futureRoutes.length})
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-gray-800 text-white shadow-md' : 'text-muted-foreground hover:bg-black/5'}`}>
                        <History className="w-4 h-4" /> Past 25 Routes
                    </button>
                </div>

                {/* LIVE SCHEDULE & TRACKING TAB */}
                {activeTab === 'live' && (
                    <div className="grid lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 fade-in">
                        {/* MAP / TRACKING */}
                        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-card flex flex-col h-[600px]">
                            <div className="p-4 bg-secondary border-b border-border flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                    <h3 className="font-black text-sm text-foreground">Live Tracking Feed</h3>
                                </div>
                                <div className="bg-white/80 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-2 text-[10px] font-black text-emerald-700 shadow-sm">
                                    <Zap className="w-3.5 h-3.5" /> SPEED: {speed} km/h
                                </div>
                            </div>
                            <div className="flex-1 relative bg-secondary/50">
                                {markers.length > 0 ? (
                                    <MapplsMap markers={markers} busLocation={busLocation} className="absolute inset-0" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs font-bold">No route plotted.</div>
                                )}

                                {/* Overlay for upcoming dots/rides */}
                                <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-xl border border-border p-3 rounded-2xl shadow-xl">
                                    <p className="text-[10px] font-black text-muted-foreground mb-2 opacity-70">UPCOMING TRAJECTORY</p>
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {activeStops.map((s: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 shrink-0">
                                                <div className={`w-2.5 h-2.5 rounded-full border-2 ${idx === 0 ? 'bg-emerald-500 border-emerald-300' : 'bg-muted border-foreground/20'}`}></div>
                                                <span className="text-xs font-bold text-foreground truncate max-w-[80px]" title={s.name}>{s.name}</span>
                                                {idx < activeStops.length - 1 && <div className="w-4 h-px bg-border"></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COMPLETE TIMELINE SCHEDULE */}
                        <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-card overflow-y-auto h-[600px] custom-scrollbar">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-primary flex items-center gap-2">
                                    <Clock className="w-5 h-5" /> Complete Schedule
                                </h3>
                                <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border text-[10px] font-black text-muted-foreground">
                                    <Users className="w-3.5 h-3.5" /> DEFAULT CAP: {totalSeats} SEATS
                                </div>
                            </div>

                            {activeStops.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground font-bold text-xs bg-secondary rounded-2xl border border-dashed border-border">
                                    No active route stops found for this bus.
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-border/50 ml-4 space-y-6 pb-4">
                                    {activeStops.map((stop: any, idx: number) => {
                                        const stopTime = stop.arrivalTime || '--:--';

                                        // Calculate segment load: passengers who are on board between this stop and the next
                                        // Passenger is on segment if their starting stop order <= idx AND ending stop order > idx
                                        const segmentOccupants = idx < activeStops.length - 1 ? busBookings.reduce((acc, b) => {
                                            // Find index of fromStop and toStop in activeStops
                                            const fromIdx = activeStops.findIndex((s: any) => s.name === b.fromStop);
                                            const toIdx = activeStops.findIndex((s: any) => s.name === b.toStop);

                                            // Use indices if found, else fallback to full route if segments not recorded accurately
                                            const actualFromIdx = fromIdx !== -1 ? fromIdx : 0;
                                            const actualToIdx = toIdx !== -1 ? toIdx : activeStops.length - 1;

                                            if (actualFromIdx <= idx && actualToIdx > idx) {
                                                return acc + (b.passengers?.length || 1);
                                            }
                                            return acc;
                                        }, 0) : 0;

                                        return (
                                            <div key={idx} className="relative pl-6">
                                                {/* Timeline Dot */}
                                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 shadow-sm ${idx === 0 ? 'bg-primary border-primary-light' : idx === activeStops.length - 1 ? 'bg-red-500 border-red-300' : 'bg-background border-muted-foreground/30'}`}></div>

                                                <div className="bg-secondary/30 border border-border hover:border-primary/30 transition-colors p-4 rounded-2xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                                            {stop.name}
                                                            {idx === 0 && <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[8px] px-2 py-0.5 rounded-full">origin</span>}
                                                            {idx === activeStops.length - 1 && <span className="bg-red-500/10 text-red-600 border border-red-500/20 text-[8px] px-2 py-0.5 rounded-full">destination</span>}
                                                        </h4>
                                                        <span className="text-[10px] font-black text-muted-foreground opacity-60 uppercase Tracking-widest">
                                                            {idx === 0 ? 'Departure' : idx === activeStops.length - 1 ? 'Arrival' : 'Transit'}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                                        <div className="bg-background rounded-xl p-2.5 border border-border">
                                                            <p className="text-[9px] font-black text-muted-foreground opacity-50 mb-0.5">TIMING</p>
                                                            <p className="text-xs font-bold text-foreground">
                                                                {stopTime}
                                                            </p>
                                                        </div>
                                                        <div className="bg-background rounded-xl p-2.5 border border-border flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[9px] font-black text-muted-foreground opacity-50 mb-0.5">SEGMENT LOAD (OCCUPIED / {totalSeats})</p>
                                                                <div className="flex items-center gap-2">
                                                                    <p className={`text-xs font-bold ${segmentOccupants > totalSeats * 0.8 ? 'text-destructive' : 'text-primary'}`}>
                                                                        {segmentOccupants} Seats
                                                                    </p>
                                                                    {idx < activeStops.length - 1 && (
                                                                        <div className="flex-1 h-1 bg-muted rounded-full w-12 overflow-hidden">
                                                                            <div className={`h-full ${segmentOccupants > totalSeats * 0.8 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${Math.min(100, (segmentOccupants / totalSeats) * 100)}%` }}></div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Users className="w-4 h-4 text-muted-foreground opacity-30" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FUTURE ROUTES TAB */}
                {activeTab === 'future' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 fade-in">
                        {futureRoutes.length === 0 ? (
                            <div className="col-span-full p-12 text-center bg-card rounded-3xl border border-dashed border-border">
                                <Calendar className="w-12 h-12 opacity-20 mx-auto mb-3" />
                                <h3 className="font-black text-foreground">No Future Trips</h3>
                                <p className="text-xs font-bold text-muted-foreground">This bus has no future routes scheduled.</p>
                            </div>
                        ) : futureRoutes.map((fr: any) => (
                            <div key={fr._id} className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-card transition-all">
                                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                                    <div className="text-xs font-black text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {format(new Date(fr.plannedDate), 'MMM dd, yyyy')}
                                    </div>
                                </div>
                                <div className="relative pl-3 border-l-2 border-dashed border-border space-y-3">
                                    <div className="absolute -left-1 top-1 w-2 h-2 rounded-full bg-border"></div>
                                    <div className="absolute -left-1 bottom-1 w-2 h-2 rounded-full bg-border"></div>
                                    <div>
                                        <div className="text-[9px] font-black opacity-50">ORIGIN</div>
                                        <div className="text-sm font-bold truncate">{fr.from}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black opacity-50">DESTINATION</div>
                                        <div className="text-sm font-bold truncate">{fr.to}</div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                                    <div className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 rounded-md">{fr.stops?.length || 0} stops total</div>
                                    <div className="text-[10px] font-bold text-primary flex items-center gap-1"><Users className="w-3 h-3" /> Capacity: {totalSeats}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in">
                        <div className="bg-secondary p-3 rounded-2xl border border-border flex items-center justify-between px-4">
                            <span className="text-xs font-bold text-muted-foreground">Showing past {routeHistory.length} routes executed by this bus</span>
                            <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black px-2 py-0.5 rounded-full">MAX: 25 RECENTS</span>
                        </div>
                        {routeHistory.length === 0 ? (
                            <div className="p-12 text-center bg-card rounded-3xl border border-dashed border-border">
                                <History className="w-12 h-12 opacity-20 mx-auto mb-3" />
                                <h3 className="font-black text-foreground">Clean History</h3>
                                <p className="text-xs font-bold text-muted-foreground">No past routes found for this vehicle.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...routeHistory].reverse().map((hr: any, idx: number) => (
                                    <div key={hr._id || idx} className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-card transition-all opacity-80 hover:opacity-100">
                                        <div className="flex items-center justify-between mb-3 text-[10px] font-black">
                                            <span className="text-gray-500 bg-gray-500/10 px-2.5 py-1 rounded-full">COMPLETED</span>
                                            <span className="text-muted-foreground opacity-70">
                                                {hr.savedAt ? format(new Date(hr.savedAt), 'MMM dd hh:mm a') : 'Legacy Data'}
                                            </span>
                                        </div>
                                        <div className="flex border border-border rounded-xl mt-3 p-3 bg-secondary/50 items-center justify-between">
                                            <div className="w-[45%] text-left">
                                                <div className="text-xs font-bold truncate" title={hr.from}>{hr.from}</div>
                                            </div>
                                            <ArrowLeft className="w-3.5 h-3.5 mx-2 rotate-180 opacity-30 shrink-0" />
                                            <div className="w-[45%] text-right">
                                                <div className="text-xs font-bold truncate" title={hr.to}>{hr.to}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </>
        );
    }

    if (embedded) {
        return (
            <div className="p-4 md:p-6 space-y-6">
                {/* Header & Bus Selector for embedded mode */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-full bg-secondary">
                            <ArrowLeft className="w-5 h-5 opacity-60" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-black text-primary">Operations Board</h2>
                            <p className="text-xs text-muted-foreground font-bold">Select a bus to view complete schedule and live status</p>
                        </div>
                    </div>

                    <div className="w-full md:w-[300px]">
                        <Select value={selectedBusId} onValueChange={(val) => {
                            setSelectedBusId(val);
                            navigate(`/owner/board?busNumber=${val}`, { replace: true });
                        }}>
                            <SelectTrigger className="h-12 bg-secondary border-border rounded-xl font-black shadow-inner">
                                <SelectValue placeholder="Select a Bus..." />
                            </SelectTrigger>
                            <SelectContent>
                                {buses.map(b => (
                                    <SelectItem key={b._id} value={b._id} className="font-bold">
                                        <div className="flex items-center gap-2">
                                            <Bus className="w-4 h-4 text-primary" />
                                            {b.busNumber} {b.name ? `(${b.name})` : ''}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {renderContent()}
            </div>
        );
    }

    return (
        <DashboardLayout
            title={
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/owner')} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-black">Bus Operations Board</h1>
                </div>
            }
            sidebarItems={sidebarItems}
        >
            <div className="max-w-6xl mx-auto space-y-6 p-4">
                {/* Bus Selection if not embedded */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-full bg-secondary">
                            <ArrowLeft className="w-5 h-5 opacity-60" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-black text-primary">Operations Board</h2>
                            <p className="text-xs text-muted-foreground font-bold">Select a bus to view complete schedule and live status</p>
                        </div>
                    </div>

                    <div className="w-full md:w-[300px]">
                        <Select value={selectedBusId} onValueChange={(val) => {
                            setSelectedBusId(val);
                            navigate(`/owner/board?busNumber=${val}`, { replace: true });
                        }}>
                            <SelectTrigger className="h-12 bg-secondary border-border rounded-xl font-black shadow-inner">
                                <SelectValue placeholder="Select a Bus..." />
                            </SelectTrigger>
                            <SelectContent>
                                {buses.map(b => (
                                    <SelectItem key={b._id} value={b._id} className="font-bold">
                                        <div className="flex items-center gap-2">
                                            <Bus className="w-4 h-4 text-primary" />
                                            {b.busNumber} {b.name ? `(${b.name})` : ''}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {renderContent()}
            </div>
        </DashboardLayout>
    );
}
