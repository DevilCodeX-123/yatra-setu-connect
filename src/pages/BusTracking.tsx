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
                    // Mappls geometry decoding helper (standard polyline fallback or SDK)
                    // For simulation, we'll just parse the path if it's available as points
                    // If geometry is encoded, we'll need a decoder. Mappls usually returns it as a string.
                    // For now, let's use the stops as a fallback or assume the backend gives us points.
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

                // Simple animation: move towards the next marker
                const target = pts[pts.length - 1]; // Move towards destination

                // Fine-grained simulation: small step towards destination
                const step = 0.0005; // Adjust for speed
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

    const openGoogleMaps = () => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(busData.origin)}&destination=${encodeURIComponent(busData.destination)}&travelmode=driving`;
        window.open(url, "_blank");
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
            <div className="max-w-xl mx-auto h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans selection:bg-emerald-500/10 relative overflow-hidden">

                {/* SOS Overlay */}
                {isSOSPending && (
                    <div className="fixed inset-0 z-[200] bg-red-600/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-white animate-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 animate-pulse shadow-[0_0_50px_rgba(255,255,255,0.4)] border border-white/20">
                            <Siren className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter text-center uppercase mb-2">Emergency?</h2>
                        <p className="text-[11px] font-bold opacity-80 text-center mb-12 max-w-xs uppercase tracking-[0.2em] leading-relaxed">
                            Ready to alert Police & Hospital with your live location.
                        </p>

                        <div className="flex flex-col gap-4 w-full max-w-sm relative z-10">
                            <Button
                                onClick={confirmSOS}
                                className="h-20 bg-white text-red-600 hover:bg-white/90 rounded-[24px] text-lg font-black uppercase tracking-tighter flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all outline-none border-none"
                            >
                                <ShieldAlert className="w-7 h-7" /> Confirm SOS Alert
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsSOSPending(false)}
                                className="h-14 text-white hover:bg-white/10 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em]"
                            >
                                <X className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* FIXED Header */}
                <header className="flex-none bg-[#1E293B] text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] pb-4 relative overflow-hidden z-[100]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] -mr-16 -mt-16 rounded-full" />

                    <div className="p-4 flex items-center justify-between gap-4 relative z-10">
                        <Link to="/" className="w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-xl hover:bg-white/10 transition-all active:scale-90 border border-white/5 shadow-lg">
                            <ChevronLeft className="w-4 h-4 text-white" />
                        </Link>

                        <div className="flex-1 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-1">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] leading-none mt-0.5">Live</span>
                            </div>
                            <h1 className="text-base text-premium text-white mb-0.5">{id || "KA-01-F-1234"}</h1>
                            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                <span>{busData.origin}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
                                <span>{busData.destination}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className={`w-9 h-9 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-xl transition-all active:scale-90 border border-white/5 shadow-lg ${isRefreshing ? 'cursor-not-allowed opacity-50' : 'hover:bg-white/10'}`}
                        >
                            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="px-4 mt-1 grid grid-cols-2 gap-3 relative z-10">
                        <div className="bg-white rounded-[20px] p-3 shadow-xl border border-slate-200/5 flex flex-col items-center">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Arrival In</span>
                            </div>
                            <p className="text-xl text-premium text-[#1E293B]">{eta}<span className="text-[10px] text-slate-400 ml-1 italic font-black">MIN</span></p>
                        </div>
                        <div className="bg-white rounded-[20px] p-3 shadow-xl border border-slate-200/5 flex flex-col items-center">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Bus className="w-3.5 h-3.5 text-purple-600" />
                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Vacant</span>
                            </div>
                            <p className="text-xl text-premium text-[#1E293B]">{occupancy}<span className="text-[10px] text-slate-400 ml-1 italic font-black">SEATS</span></p>
                        </div>
                    </div>
                </header>

                {/* Sub-Header */}
                <div className="flex-none bg-white border-b border-slate-50 px-6 py-2 flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] z-40 relative">
                    <span>Arr</span>
                    <span className="text-[#1E293B] opacity-30 italic">Journey Stream</span>
                    <span>Dep</span>
                </div>

                {/* SCROLLABLE Area */}
                <div className="flex-1 relative overflow-y-auto bg-slate-50/20 custom-scrollbar">
                    <div className="absolute left-[3rem] top-0 bottom-0 w-[3px] bg-slate-100 rounded-full" />
                    <div
                        className="absolute left-[3rem] top-0 w-[3px] bg-[#1E293B] transition-all duration-1000 shadow-[0_0_10px_rgba(30,41,59,0.15)] rounded-full"
                        style={{
                            height: currentStationIndex >= 0
                                ? `${((currentStationIndex + 0.5) / (stations.length - 1)) * 100}%`
                                : "0%"
                        }}
                    />

                    <div className="space-y-0 pb-64">

                        {/* INTEGRATED SMART HUB & MAP CARD */}
                        <div className="px-5 pt-6 pb-4">
                            <div className="w-full bg-white border border-slate-200 rounded-[30px] overflow-hidden shadow-sm border-b-4 border-slate-200/50">

                                {/* Map Section */}
                                <div className="w-full h-48 relative border-b border-slate-100 overflow-hidden">
                                    <MapplsMap
                                        markers={busData.markers || []}
                                        routePoints={busData.coordinates}
                                        busLocation={busLocation}
                                        className="absolute inset-0"
                                    />
                                    {/* Overlay to allow clicking/dragging map while still having our layout feel */}
                                    {!isInside && (
                                        <div className="absolute inset-0 bg-transparent pointer-events-none" />
                                    )}
                                    <div className="absolute bottom-2 right-4 flex items-center gap-1 text-[8px] font-black text-blue-500 uppercase tracking-tighter bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm shadow-sm">
                                        <MapIcon className="w-3 h-3" /> Interactive Map
                                    </div>
                                </div>

                                {/* SMART HUB CONTROLS footer */}
                                <div className="p-4 bg-white space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-inner transition-all transform ${isInside ? 'bg-emerald-500 text-white rotate-3' : 'bg-slate-100 text-slate-300'}`}>
                                                <Bus className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-tight leading-none mb-0.5 text-[#1E293B]">On-Board Link</p>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{isInside ? "Precision GPS Sync" : "Enable System Feed"}</p>
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
                                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-50 pt-4">
                                            <button
                                                onClick={() => handleTrackingSelect("gps")}
                                                className={`h-11 rounded-xl flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${trackingMethod === "gps" ? "bg-[#1E293B] border-[#1E293B] text-white" : "border-slate-50 text-slate-400 bg-slate-50/50"}`}
                                            >
                                                <Navigation className={`w-3.5 h-3.5 ${trackingMethod === "gps" ? "text-emerald-400" : ""}`} />
                                                <span className="text-[9px] font-black uppercase tracking-tighter">GPS mode</span>
                                            </button>
                                            <button
                                                onClick={() => handleTrackingSelect("tower")}
                                                className={`h-11 rounded-xl flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${trackingMethod === "tower" ? "bg-[#1E293B] border-[#1E293B] text-white" : "border-slate-50 text-slate-400 bg-slate-50/50"}`}
                                            >
                                                <TrendingUp className={`w-3.5 h-3.5 ${trackingMethod === "tower" ? "text-blue-400" : ""}`} />
                                                <span className="text-[9px] font-black uppercase tracking-tighter">Tower link</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Search indicator - below the hub */}
                            {isSearching && (
                                <div className="flex items-center justify-center gap-2 mt-4 animate-pulse">
                                    <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">Syncing with bus system...</span>
                                </div>
                            )}
                        </div>

                        {stations.map((station, idx) => {
                            const isDeparted = station.status === "Departed";
                            const isInTransit = station.status === "In Transit";
                            const isUpcoming = station.status === "Upcoming";

                            return (
                                <div key={station.name} className={`relative flex items-center py-5 px-5 transition-all ${isInTransit ? "bg-emerald-50/20" : ""}`}>
                                    <div className="w-10 text-right pr-4 shrink-0">
                                        <p className={`text-[10px] text-premium ${isUpcoming ? "text-slate-200" : isDeparted ? "text-slate-400/50" : "text-[#1E293B]"}`}>
                                            {station.arrival !== "---" ? station.arrival : "START"}
                                        </p>
                                    </div>

                                    <div className="relative px-2 shrink-0 z-10 flex justify-center w-6">
                                        {isInTransit ? (
                                            <div className="relative flex items-center justify-center">
                                                <div className="absolute w-9 h-9 bg-emerald-200/30 rounded-full animate-ping" />
                                                <div className="w-7 h-7 bg-[#1E293B] rounded-[14px] flex items-center justify-center shadow-lg border-2 border-white relative z-10">
                                                    <Bus className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-700 ${isDeparted ? "bg-white border-[#1E293B]" : "bg-white border-slate-200"}`} />
                                        )}
                                    </div>

                                    <div className="flex-1 pl-6">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <h3 className={`text-sm font-black tracking-tighter uppercase italic leading-tight ${isUpcoming ? "text-slate-300" : "text-[#1E293B]"}`}>
                                                    {station.name}
                                                </h3>
                                                <div className="flex items-center gap-2.5 mt-1">
                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{station.km} KM MARK</span>
                                                    {station.platform && (
                                                        <span className="text-[8px] text-[#1E293B] font-black uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/30">
                                                            PF {station.platform}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`text-[10px] font-black italic tracking-tighter ${isUpcoming ? "text-slate-200" : "text-[#1E293B]"}`}>
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
                        <div className="flex-1 bg-[#1E293B] rounded-[28px] py-3.5 px-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10 backdrop-blur-3xl">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-[16px] bg-emerald-400/10 flex items-center justify-center border border-emerald-400/20">
                                        <Navigation className="w-5 h-5 text-emerald-400 rotate-45" />
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-[13px] text-white font-black uppercase tracking-tighter leading-none mb-1 italic">
                                        {isInside && trackingMethod === "gps" ? "In-Bus GPS" : nextUpcomingStation}
                                    </h5>
                                    <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest whitespace-nowrap opacity-80">
                                        {isInside && trackingMethod === "gps"
                                            ? `${speed} KM/H • SYNCED`
                                            : "Tracking On Time"}
                                    </p>
                                </div>
                            </div>

                            <button className="p-2 hover:bg-white/10 rounded-xl text-white opacity-40 hover:opacity-100 transition-all active:scale-95">
                                <Bell className="w-5 h-5" />
                            </button>
                        </div>

                        {/* SOS TRIANGLE */}
                        <button
                            onClick={() => setIsSOSPending(true)}
                            className="w-16 h-16 bg-red-600 rounded-[28px] flex flex-col items-center justify-center shadow-[0_15px_40px_rgba(220,38,38,0.5)] active:scale-90 transition-all border-4 border-white/10 relative z-10 group shrink-0"
                        >
                            <Siren className="w-6 h-6 text-white mb-0.5" />
                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">SOS</span>
                        </button>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
