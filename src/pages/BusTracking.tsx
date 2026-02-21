import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ChevronLeft, Bell, Share2, MapPin, Bus, Navigation,
    Clock, Info, MoreVertical, LayoutGrid, ToggleLeft, ToggleRight,
    TrendingUp, Star, Phone, RefreshCw, ChevronDown, Activity,
    Zap, Gauge, Map as MapIcon, ShieldCheck, Wifi, Battery,
    AlertTriangle, Navigation2, ChevronRight, ChevronLeft as ChevronLeftIcon,
    ArrowRight, HeartPulse, Siren, X, AlertOctagon, ShieldAlert,
    Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import MapplsMap from "@/components/MapplsMap";

const routesData = {
    "KA-01-F-1234": {
        origin: "Bengaluru",
        destination: "Mysuru",
        coordinates: "77.5946,12.9716;76.6394,12.2958",
        markers: [
            { lat: 12.9716, lon: 77.5946, label: "Bengaluru" },
            { lat: 12.2958, lon: 76.6394, label: "Mysuru" }
        ],
        stops: [
            { name: "Bengaluru (Majestic)", arrival: "---", departure: "06:30 AM", km: 0, platform: "12", status: "Departed" },
            { name: "Kengeri", arrival: "06:55 AM", departure: "07:00 AM", km: 15, platform: "2", status: "Departed" },
            { name: "Bidadi", arrival: "07:30 AM", departure: "07:32 AM", km: 35, platform: "1", status: "Departed" },
            { name: "Ramanagara", arrival: "08:10 AM", departure: "08:15 AM", km: 52, platform: "3", status: "Departed" },
            { name: "Channapatna", arrival: "08:35 AM", departure: "08:40 AM", km: 64, platform: "2", status: "In Transit" },
            { name: "Maddur", arrival: "09:05 AM", departure: "09:10 AM", km: 82, platform: "1", status: "Upcoming" },
            { name: "Mandya", arrival: "09:40 AM", departure: "09:45 AM", km: 105, platform: "4", status: "Upcoming" },
            { name: "Mysuru Junction", arrival: "10:30 AM", departure: "---", km: 145, platform: "1", status: "Upcoming" },
        ]
    },
    "default": {
        origin: "Origin",
        destination: "Destination",
        coordinates: "77.0,28.0;77.5,28.5", // Dummy coordinates
        markers: [
            { lat: 28.0, lon: 77.0, label: "Origin" },
            { lat: 28.5, lon: 77.5, label: "Destination" }
        ],
        stops: [
            { name: "Start Point", arrival: "---", departure: "08:00 AM", km: 0, platform: "1", status: "Departed" },
            { name: "Middle Station", arrival: "09:30 AM", departure: "09:45 AM", km: 45, platform: "2", status: "In Transit" },
            { name: "End Point", arrival: "11:30 AM", departure: "---", km: 90, platform: "1", status: "Upcoming" },
        ]
    }
};

export default function BusTracking() {
    const { id } = useParams();
    const [isInside, setIsInside] = useState(false);
    const [trackingMethod, setTrackingMethod] = useState("none");
    const [isSearching, setIsSearching] = useState(false);
    const [isSOSPending, setIsSOSPending] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [eta, setEta] = useState(7);
    const [speed, setSpeed] = useState(53);
    const [occupancy, setOccupancy] = useState(24);

    // Live Tracking State
    const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [routeGeometry, setRouteGeometry] = useState<any[]>([]);

    const busData = routesData[id as keyof typeof routesData] || routesData["default"];
    const stations = busData.stops;

    const currentStationIndex = stations.findIndex(s => s.status === "In Transit");
    const nextUpcomingStation = useMemo(() => {
        return stations.find(s => s.status === "Upcoming")?.name || busData.destination;
    }, [stations, busData.destination]);

    // ===== 1. FETCH PRECISE ROUTE GEOMETRY =====
    useEffect(() => {
        const fetchRoute = async () => {
            try {
                // Using backend API for precise road geometry
                const res = await fetch(`/api/maps/route?pts=${encodeURIComponent(busData.coordinates)}`);
                const data = await res.json();

                if (data.routes && data.routes[0] && data.routes[0].geometry) {
                    console.log("BusTracking: Received precise route geometry");
                }
            } catch (err) {
                console.error("BusTracking: Failed to fetch route geometry", err);
            }
        };
        fetchRoute();
    }, [busData.coordinates]);

    // ===== 2. SIMULATION LOGIC (Live Tracking) =====
    useEffect(() => {
        // Start position
        let currentIdx = 0;
        const pts = busData.markers.map(m => ({ lat: m.lat, lng: m.lon }));

        if (!busLocation && pts.length > 0) {
            setBusLocation(pts[0]);
        }

        const interval = setInterval(() => {
            // Update ETA and Speed
            setEta(prev => Math.max(1, prev - (Math.random() > 0.9 ? 1 : 0)));
            setSpeed(prev => {
                const delta = Math.floor(Math.random() * 5) - 2;
                return Math.max(45, Math.min(65, prev + delta));
            });

            // Move bus along the points
            setBusLocation(prev => {
                if (!prev) return pts[0];
                const target = pts[pts.length - 1];
                const step = 0.0005;
                const dLat = target.lat - prev.lat;
                const dLng = target.lng - prev.lng;
                const distance = Math.sqrt(dLat * dLat + dLng * dLng);
                if (distance < step) return target;
                return {
                    lat: prev.lat + (dLat / distance) * step,
                    lng: prev.lng + (dLng / distance) * step,
                };
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [busData.markers]);

    const handleRefresh = () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            toast.success("Live data updated", {
                description: "GPS coordinates synchronized.",
                duration: 1500,
            });
        }, 1500);
    };

    const handleTrackingSelect = (method: string) => {
        setTrackingMethod(method);
        setIsSearching(true);
        setTimeout(() => {
            setIsSearching(false);
        }, 1200);
    };

    const confirmSOS = () => {
        setIsSOSPending(false);
        toast.error("EMERGENCY SIGNAL SENT!", {
            description: `Police & Hospital alerted. Loc: 12.59° N, 77.04° E.`,
            duration: 6000,
        });
    };

    return (
        <Layout noFooter>
            <div className="max-w-xl mx-auto h-screen bg-background text-foreground flex flex-col font-sans selection:bg-emerald-500/10 relative overflow-hidden">

                {/* SOS Overlay */}
                {isSOSPending && (
                    <div className="fixed inset-0 z-[200] bg-red-600 dark:bg-background backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-white animate-in zoom-in duration-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-600/20 dark:bg-red-950/40 animate-pulse" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white/20 rounded-[32px] flex items-center justify-center mb-8 border border-white/30 shadow-2xl animate-bounce">
                                <AlertTriangle className="w-12 h-12 text-white" />
                            </div>
                            <h2 className="text-4xl font-black mb-4">Emergency Alert</h2>
                            <p className="text-[10px] font-black tracking-[0.2em] opacity-80 max-w-xs leading-relaxed text-center">
                                Emergency services and dispatchers are being alerted with your live location.
                            </p>

                            <div className="flex flex-col gap-4 w-full mt-12">
                                <Button
                                    onClick={confirmSOS}
                                    className="h-20 bg-white text-red-600 hover:bg-white/90 rounded-[24px] text-lg font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all outline-none border-none"
                                >
                                    <ShieldAlert className="w-7 h-7" /> Confirm SOS Alert
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsSOSPending(false)}
                                    className="h-14 text-white hover:bg-white/10 rounded-[20px] text-[10px] font-black tracking-[0.3em]"
                                >
                                    <X className="w-4 h-4 mr-2" /> Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FIXED Header */}
                <header className="flex-none bg-card border-b border-border text-foreground shadow-lg pb-4 relative overflow-hidden z-[100]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] -mr-16 -mt-16 rounded-full" />

                    <div className="p-4 flex items-center justify-between gap-4 relative z-10">
                        <Link to="/" className="w-9 h-9 flex items-center justify-center bg-secondary backdrop-blur-md rounded-xl hover:bg-secondary/80 transition-all active:scale-90 border border-border shadow-sm">
                            <ChevronLeft className="w-4 h-4 text-foreground" />
                        </Link>

                        <div className="flex-1 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-1">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 tracking-[0.2em] leading-none mt-0.5">Live</span>
                            </div>
                            <h1 className="text-base font-black text-foreground mb-0.5">{id || "KA-01-F-1234"}</h1>
                            <div className="flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground font-black opacity-60">
                                <span>{busData.origin}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-primary opacity-40" />
                                <span>{busData.destination}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className={`w-9 h-9 flex items-center justify-center bg-secondary backdrop-blur-md rounded-xl transition-all active:scale-90 border border-border shadow-sm ${isRefreshing ? 'cursor-not-allowed opacity-50' : 'hover:bg-secondary/80'}`}
                        >
                            <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="px-4 mt-1 grid grid-cols-2 gap-3 relative z-10">
                        <div className="bg-secondary rounded-[20px] p-3 shadow-sm border border-border flex flex-col items-center">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="text-[8px] font-black text-muted-foreground tracking-wider opacity-60">Arrival In</span>
                            </div>
                            <p className="text-xl font-black text-foreground">{eta}<span className="text-[10px] text-muted-foreground ml-1 font-black opacity-40">MIN</span></p>
                        </div>
                        <div className="bg-secondary rounded-[20px] p-3 shadow-sm border border-border flex flex-col items-center">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Bus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span className="text-[8px] font-black text-muted-foreground tracking-wider opacity-60">Vacant</span>
                            </div>
                            <p className="text-xl font-black text-foreground">{occupancy}<span className="text-[10px] text-muted-foreground ml-1 font-black opacity-40">SEATS</span></p>
                        </div>
                    </div>
                </header>

                {/* Sub-Header / Status Bar */}
                <div className="flex-none bg-card border-b border-border px-6 py-3 flex justify-between text-[9px] font-black text-muted-foreground tracking-[0.3em] z-40 relative">
                    <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-primary opacity-40" />
                        <span>Signal: High Precision</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-primary-light opacity-40" />
                        <span>Identity Verified</span>
                    </div>
                </div>

                {/* SCROLLABLE Area */}
                <div className="flex-1 relative overflow-y-auto bg-background custom-scrollbar">
                    <div className="absolute left-[3rem] top-0 bottom-0 w-[3px] bg-secondary rounded-full" />
                    <div
                        className="absolute left-[3rem] top-0 w-[3px] bg-primary transition-all duration-1000 shadow-lg rounded-full"
                        style={{
                            height: currentStationIndex >= 0
                                ? `${((currentStationIndex + 0.5) / (stations.length - 1)) * 100}%`
                                : "0%"
                        }}
                    />

                    <div className="space-y-0 pb-64">

                        {/* INTEGRATED SMART HUB & MAP CARD */}
                        <div className="px-5 pt-6 pb-4">
                            <div className="w-full bg-card border border-border rounded-[30px] overflow-hidden shadow-card">

                                {/* Map Section */}
                                <div className="w-full h-48 relative border-b border-border overflow-hidden">
                                    <MapplsMap
                                        markers={busData.markers || []}
                                        routePoints={busData.coordinates}
                                        busLocation={busLocation}
                                        className="absolute inset-0"
                                    />
                                    {!isInside && (
                                        <div className="absolute inset-0 bg-transparent pointer-events-none" />
                                    )}
                                    <div className="absolute bottom-2 right-4 flex items-center gap-1 text-[8px] font-black text-blue-600 dark:text-blue-400 bg-card/80 px-2 py-1 rounded-full backdrop-blur-sm shadow-sm border border-border">
                                        <MapIcon className="w-3 h-3" /> Interactive Map
                                    </div>
                                </div>

                                {/* SMART HUB CONTROLS footer */}
                                <div className="p-4 bg-card space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-inner transition-all transform ${isInside ? 'bg-emerald-500 text-white rotate-3 shadow-lg shadow-emerald-500/20' : 'bg-secondary text-muted-foreground opacity-40'}`}>
                                                <Bus className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black leading-none mb-0.5 text-foreground">On-Board Link</p>
                                                <p className="text-[8px] text-muted-foreground font-black opacity-60">{isInside ? "Precision GPS Sync" : "Enable System Feed"}</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={isInside}
                                            onCheckedChange={(val) => {
                                                setIsInside(val);
                                                if (!val) setTrackingMethod("none");
                                            }}
                                            className="data-[state=checked]:bg-emerald-500 scale-75 origin-right"
                                        />
                                    </div>

                                    {/* Mode selection embedded only when isInside is active */}
                                    {isInside && (
                                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-border pt-4">
                                            <button
                                                onClick={() => handleTrackingSelect("gps")}
                                                className={`h-11 rounded-xl flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${trackingMethod === "gps" ? "bg-primary border-primary text-white" : "border-border text-muted-foreground bg-secondary/50"}`}
                                            >
                                                <Navigation className={`w-3.5 h-3.5 ${trackingMethod === "gps" ? "text-white" : "text-emerald-500"}`} />
                                                <span className="text-[9px] font-black ">GPS mode</span>
                                            </button>
                                            <button
                                                onClick={() => handleTrackingSelect("tower")}
                                                className={`h-11 rounded-xl flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${trackingMethod === "tower" ? "bg-primary border-primary text-white" : "border-border text-muted-foreground bg-secondary/50"}`}
                                            >
                                                <TrendingUp className={`w-3.5 h-3.5 ${trackingMethod === "tower" ? "text-white" : "text-blue-500"}`} />
                                                <span className="text-[9px] font-black ">Tower link</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isSearching && (
                                <div className="flex items-center justify-center gap-2 mt-4 animate-pulse">
                                    <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
                                    <span className="text-[8px] font-black tracking-[0.4em] text-muted-foreground opacity-60">Syncing with bus system...</span>
                                </div>
                            )}
                        </div>

                        {stations.map((station, idx) => {
                            const isDeparted = station.status === "Departed";
                            const isInTransit = station.status === "In Transit";
                            const isUpcoming = station.status === "Upcoming";

                            return (
                                <div key={station.name} className={`relative flex items-center py-5 px-5 transition-all ${isInTransit ? "bg-emerald-500/5" : ""}`}>
                                    <div className="w-10 text-right pr-4 shrink-0">
                                        <p className={`text-[10px] font-black ${isUpcoming ? "text-muted-foreground opacity-20" : isDeparted ? "text-muted-foreground opacity-40" : "text-foreground"}`}>
                                            {station.arrival !== "---" ? station.arrival : "START"}
                                        </p>
                                    </div>

                                    <div className="relative px-2 shrink-0 z-10 flex justify-center w-6">
                                        {isInTransit ? (
                                            <div className="relative flex items-center justify-center">
                                                <div className="absolute w-9 h-9 bg-emerald-500/20 rounded-full animate-ping" />
                                                <div className="w-7 h-7 bg-foreground text-background rounded-[14px] flex items-center justify-center shadow-lg border-2 border-background relative z-10">
                                                    <Bus className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-700 ${isDeparted ? "bg-background border-foreground shadow-[0_0_8px_rgba(0,0,0,0.1)]" : "bg-background border-border"}`} />
                                        )}
                                    </div>

                                    <div className="flex-1 pl-6">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <h3 className={`text-sm font-black leading-tight ${isUpcoming ? "text-muted-foreground opacity-20" : "text-foreground"}`}>
                                                    {station.name}
                                                </h3>
                                                <div className="flex items-center gap-2.5 mt-1">
                                                    <span className="text-[9px] text-muted-foreground font-black tracking-[0.2em] opacity-40">{station.km} KM MARK</span>
                                                    {station.platform && (
                                                        <span className="text-[8px] text-foreground font-black bg-secondary px-2 py-0.5 rounded-full border border-border opacity-70">
                                                            PF {station.platform}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`text-[10px] font-black ${isUpcoming ? "text-muted-foreground opacity-20" : "text-foreground opacity-80"}`}>
                                                    {station.departure !== "---" ? station.departure : "END"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ERGONOMIC BOTTOM TRAY */}
                <div className="fixed bottom-0 left-0 right-0 p-6 z-[120] pointer-events-none">
                    <div className="max-w-xl mx-auto flex items-center justify-between gap-4 pointer-events-auto">

                        {/* COMPACT STATUS PILL */}
                        <div className="flex-1 bg-card border border-border rounded-[32px] py-4 px-8 flex items-center justify-between shadow-elevated backdrop-blur-3xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex flex-col relative z-10">
                                <span className="text-[8px] font-black text-muted-foreground tracking-[0.3em] mb-0.5 opacity-60">Live Eta</span>
                                <span className="text-lg font-black text-primary">{eta} Mins Away</span>
                            </div>
                            <div className="h-10 w-[1px] bg-border mx-4" />
                            <div className="flex-1 text-right relative z-10">
                                <span className="text-[8px] font-black text-muted-foreground tracking-[0.3em] mb-0.5 opacity-60">Next Stop</span>
                                <span className="text-xs font-black text-foreground block overflow-hidden text-ellipsis whitespace-nowrap">
                                    {nextUpcomingStation}
                                </span>
                            </div>
                        </div>

                        {/* SOS BUTTON */}
                        <button
                            onClick={() => setIsSOSPending(true)}
                            className="w-16 h-16 bg-red-600 rounded-[28px] flex flex-col items-center justify-center shadow-[0_15px_40_rgba(220,38,38,0.5)] active:scale-90 transition-all border-4 border-background relative z-10 group shrink-0"
                        >
                            <AlertTriangle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
