import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ChevronLeft, Bell, Share2, MapPin, Bus, Navigation,
    Clock, Info, MoreVertical, LayoutGrid, ToggleLeft, ToggleRight,
    TrendingUp, Star, Phone, RefreshCw, ChevronDown, Activity,
    Zap, Gauge, Map as MapIcon, ShieldCheck, Wifi, Battery,
    AlertTriangle, Navigation2, ChevronRight,
    ArrowRight, X, AlertOctagon, ShieldAlert,
    Settings2, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import MapplsMap from "@/components/MapplsMap";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";

// Haversine formula calculation for distance in meters
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
};

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

    // Adaptive Speed Logic States
    const BASELINE_SPEED = 50;
    const [calculationSpeed, setCalculationSpeed] = useState(BASELINE_SPEED);
    const [speedStableTicks, setSpeedStableTicks] = useState(0);

    // Advanced SOS States
    const [sosHoldProgress, setSosHoldProgress] = useState(0);
    const [isSosHolding, setIsSosHolding] = useState(false);
    const [mapTapCount, setMapTapCount] = useState(0);
    const [lastTapTime, setLastTapTime] = useState(0);
    const [showPoliceOverlay, setShowPoliceOverlay] = useState(false);
    const [policeHoldProgress, setPoliceHoldProgress] = useState(0);
    const [isPoliceHolding, setIsPoliceHolding] = useState(false);

    const [showPresenceUI, setShowPresenceUI] = useState(true);
    const [isPresenceCollapsed, setIsPresenceCollapsed] = useState(false);
    const [isGpsSharing, setIsGpsSharing] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLocationDistinct, setIsLocationDistinct] = useState(false);

    // Proximity States
    const [lastProximityToast, setLastProximityToast] = useState<number | null>(null);
    const [showArrivalAlarm, setShowArrivalAlarm] = useState(false);

    // Live Tracking State
    const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [routeGeometry, setRouteGeometry] = useState<any[]>([]);

    const busData = routesData[id as keyof typeof routesData] || routesData["default"];
    const stations = busData.stops;

    const currentStationIndex = stations.findIndex(s => s.status === "In Transit");
    const nextUpcomingStation = useMemo(() => {
        const next = stations.find(s => s.status === "Upcoming") || stations[stations.length - 1];
        return next?.name || "Destination";
    }, [stations]);

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
        const pts = busData.markers.map(m => ({ lat: m.lat, lng: m.lon }));
        const dest = pts[pts.length - 1];

        if (!busLocation && pts.length > 0) {
            setBusLocation(pts[0]);
        }

        const interval = setInterval(() => {
            // Update Speed with slight fluctuation
            setSpeed(prev => {
                const delta = Math.floor(Math.random() * 5) - 2;
                const newSpeed = Math.max(45, Math.min(65, prev + delta));

                // Adaptive Stability Check: 
                // If current speed differs from calculation speed by > 8 km/h
                // increment stability ticks. After ~40 ticks (~2 simulation mins),
                // adopt the new speed for ETA calculation.
                setCalculationSpeed(calcSpeed => {
                    const diff = Math.abs(newSpeed - calcSpeed);
                    if (diff > 8) {
                        setSpeedStableTicks(t => {
                            if (t >= 40) { // Stable for ~2 mins (40 * 3s = 120s)
                                console.log(`Mappls: Speed stabilized at ${newSpeed}km/h. Updating ETA calc.`);
                                return 0; // Reset
                            }
                            return t + 1;
                        });
                        // If we reached the limit, the next tick will use the new calcSpeed
                        if (speedStableTicks >= 40) return newSpeed;
                    } else {
                        setSpeedStableTicks(0);
                    }
                    return calcSpeed;
                });

                return newSpeed;
            });

            // Move bus along the points
            setBusLocation(prev => {
                if (!prev) return pts[0];
                const step = 0.0005;
                const dLat = dest.lat - prev.lat;
                const dLng = dest.lng - prev.lng;
                const distance = Math.sqrt(dLat * dLat + dLng * dLng);

                // Calculate Real-Time ETA based on Distance and Calculation Speed
                const distMeters = getDistance(prev.lat, prev.lng, dest.lat, dest.lng);
                const distKm = distMeters / 1000;
                const timeHours = distKm / calculationSpeed;
                const timeMins = Math.max(1, Math.round(timeHours * 60));
                setEta(timeMins);

                if (distance < step) return dest;
                return {
                    lat: prev.lat + (dLat / distance) * step,
                    lng: prev.lng + (dLng / distance) * step,
                };
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [busData.markers, calculationSpeed, speedStableTicks]);

    // ===== 3. GPS MATCHING & PROXIMITY LOGIC =====
    useEffect(() => {
        if (!isGpsSharing || !busLocation) return;

        let watchId: number;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const uLat = pos.coords.latitude;
                    const uLng = pos.coords.longitude;
                    setUserLocation({ lat: uLat, lng: uLng });

                    const dist = getDistance(uLat, uLng, busLocation.lat, busLocation.lng);
                    if (dist > 100) {
                        setIsLocationDistinct(true);
                        setIsGpsSharing(false);
                        toast.error("Location Distinct", {
                            description: "Your location is significantly different from the bus. GPS sync disabled.",
                        });
                    }
                },
                (err) => console.error("GPS Error:", err),
                { enableHighAccuracy: true }
            );
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isGpsSharing, busLocation]);

    // Proximity alerts to destination
    useEffect(() => {
        if (!busLocation) return;
        const dest = busData.markers[busData.markers.length - 1];
        const distToDest = getDistance(busLocation.lat, busLocation.lng, dest.lat, dest.lon);

        const thresholds = [1000, 500, 100, 20];
        const currentThreshold = thresholds.find(t => distToDest <= t);

        if (currentThreshold && currentThreshold !== lastProximityToast) {
            setLastProximityToast(currentThreshold);
            if (currentThreshold === 20) {
                setShowArrivalAlarm(true);
                // Play simple alert sound if browser allows
                try { new Audio("https://assets.mixkit.co/sfx/preview/mixkit-emergency-alert-alarm-1007.mp3").play(); } catch (e) { }
            } else {
                toast("Stop Approaching", {
                    description: `Your stop is ${currentThreshold}m away. Prepare to deboard.`,
                    icon: <Bell className="w-4 h-4 text-primary" />,
                });
            }
        }
    }, [busLocation, busData.markers, lastProximityToast]);

    // ===== 4. SOS GESTURE HANDLERS =====
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSosHolding) {
            interval = setInterval(() => {
                setSosHoldProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        handleOwnerAlert();
                        return 100;
                    }
                    return prev + (100 / 30); // 3 seconds (30 steps of 100ms)
                });
            }, 100);
        } else {
            setSosHoldProgress(0);
        }
        return () => clearInterval(interval);
    }, [isSosHolding]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPoliceHolding) {
            interval = setInterval(() => {
                setPoliceHoldProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        handlePoliceCall();
                        return 100;
                    }
                    return prev + (100 / 30); // 3 seconds
                });
            }, 100);
        } else {
            setPoliceHoldProgress(0);
        }
        return () => clearInterval(interval);
    }, [isPoliceHolding]);

    const handleOwnerAlert = () => {
        setIsSosHolding(false);
        toast.warning("OWNER ALERTED", {
            description: "A priority alert with your coordinates has been sent to the bus operator.",
            duration: 4000,
        });
    };

    const handlePoliceCall = () => {
        setIsPoliceHolding(false);
        setShowPoliceOverlay(false);
        toast.error("POLICE CALL INITIATED", {
            description: "Direct connection established with emergency dispatchers.",
            duration: 6000,
        });
    };

    const handleMapTap = () => {
        const now = Date.now();
        if (now - lastTapTime < 500) {
            setMapTapCount(prev => {
                const newCount = prev + 1;
                if (newCount >= 7) {
                    setShowPoliceOverlay(true);
                    return 0;
                }
                return newCount;
            });
        } else {
            setMapTapCount(1);
        }
        setLastTapTime(now);
    };

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
            <div className="w-full h-full bg-background text-foreground flex flex-col font-sans selection:bg-emerald-500/10 relative overflow-hidden">
                <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full relative">

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

                    {/* Police Emergency Overlay */}
                    {showPoliceOverlay && (
                        <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-white animate-in fade-in duration-300">
                            <div className="absolute top-8 right-8">
                                <Button variant="ghost" onClick={() => setShowPoliceOverlay(false)} className="text-white hover:bg-white/10 rounded-full w-12 h-12">
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                            <ShieldAlert className="w-20 h-20 text-red-500 mb-8 animate-pulse" />
                            <h2 className="text-3xl font-black mb-2 text-center">POLICE EMERGENCY</h2>
                            <p className="text-sm opacity-60 mb-12 text-center max-w-xs">Hold the button below for 3 seconds to initiate a direct call to local police dispatchers.</p>

                            <div className="relative group">
                                <svg className="w-32 h-32 -rotate-90">
                                    <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
                                    <circle cx="64" cy="64" r="58" fill="none" stroke="red" strokeWidth="8" strokeDasharray="364.4" strokeDashoffset={364.4 - (364.4 * policeHoldProgress / 100)} className="transition-all duration-100 ease-linear" />
                                </svg>
                                <button
                                    onMouseDown={() => setIsPoliceHolding(true)}
                                    onMouseUp={() => setIsPoliceHolding(false)}
                                    onTouchStart={() => setIsPoliceHolding(true)}
                                    onTouchEnd={() => setIsPoliceHolding(false)}
                                    className="absolute inset-4 bg-red-600 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-red-500/40"
                                >
                                    <Phone className="w-8 h-8 text-white" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Floating Presence UI (Replaced Dialog) */}
                    {showPresenceUI && (
                        <div className={`fixed right-4 top-1/2 -translate-y-1/2 z-[200] transition-all duration-500 ease-in-out ${isPresenceCollapsed ? 'translate-x-[calc(100%-40px)]' : 'translate-x-0'}`}>
                            <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col w-[300px] relative">
                                {/* Toggle Button */}
                                <button
                                    onClick={() => setIsPresenceCollapsed(!isPresenceCollapsed)}
                                    className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center hover:bg-secondary/50 transition-colors border-r border-border/50"
                                >
                                    <ChevronLeft className={`w-5 h-5 text-primary transition-transform duration-500 ${isPresenceCollapsed ? '' : 'rotate-180'}`} />
                                </button>

                                <div className="pl-12 pr-6 py-6 flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                            <Bus className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black leading-tight">Boarding Sync</h3>
                                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider mt-0.5">Are you in bus?</p>
                                        </div>
                                    </div>

                                    <p className="text-[10px] font-medium leading-relaxed opacity-60">
                                        Syncing coordinates allows high-precision proximity alerts.
                                    </p>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowPresenceUI(false)}
                                            className="flex-1 h-10 rounded-xl font-black text-[10px] border-border hover:bg-secondary"
                                        >
                                            No
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowPresenceUI(false);
                                                setIsGpsSharing(true);
                                            }}
                                            className="flex-1 h-10 rounded-xl font-black text-[10px] bg-primary hover:bg-primary/90"
                                        >
                                            Yes, Track
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Arrival Alarm Modal */}
                    <Dialog open={showArrivalAlarm} onOpenChange={setShowArrivalAlarm}>
                        <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[300] bg-emerald-600 text-white rounded-[40px] p-10 border-none shadow-2xl animate-in zoom-in-95 duration-500">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-white/20 rounded-[32px] flex items-center justify-center mb-10 animate-bounce">
                                    <MapPin className="w-12 h-12 text-white" />
                                </div>
                                <h2 className="text-4xl font-black mb-4">YOU HAVE ARRIVED</h2>
                                <p className="text-lg opacity-80 font-black mb-12 tracking-wide uppercase leading-tight">Your stop is here.<br />Wake up & get ready!</p>
                                <Button
                                    onClick={() => setShowArrivalAlarm(false)}
                                    className="w-full h-20 bg-white text-emerald-600 hover:bg-white/90 rounded-[28px] text-xl font-black shadow-xl"
                                >
                                    I'M AWAKE
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

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

                    {/* MAIN RESPONSIVE CONTENT AREA */}
                    <div className="flex-1 relative overflow-y-auto bg-background custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-12 h-fit lg:h-full lg:overflow-hidden">

                            {/* LEFT COLUMN: MAP & SMART HUB (Sticky on desktop) */}
                            <div className="lg:col-span-7 xl:col-span-8 p-5 lg:p-8 space-y-6 lg:overflow-y-auto lg:h-full custom-scrollbar">
                                {/* INTEGRATED SMART HUB & MAP CARD */}
                                <div className="w-full bg-card border border-border rounded-[30px] overflow-hidden shadow-card">
                                    {/* Map Section */}
                                    <div className="w-full h-64 lg:h-96 relative border-b border-border overflow-hidden" onClick={handleMapTap}>
                                        <MapplsMap
                                            markers={busData.markers || []}
                                            routePoints={busData.coordinates}
                                            busLocation={busLocation}
                                            userLocation={userLocation}
                                            className="absolute inset-0"
                                        />
                                        {!isInside && (
                                            <div className="absolute inset-0 bg-transparent pointer-events-none" />
                                        )}
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 bg-card/90 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm border border-border">
                                            <MapIcon className="w-3.5 h-3.5" /> 7-Tap Emergency
                                        </div>
                                    </div>

                                    {/* SMART HUB CONTROLS footer */}
                                    <div className="p-6 bg-card space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all transform ${isInside ? 'bg-emerald-500 text-white rotate-3 shadow-lg shadow-emerald-500/20' : 'bg-secondary text-muted-foreground opacity-40'}`}>
                                                    <Bus className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black leading-none mb-1 text-foreground">On-Board Link</p>
                                                    <p className="text-[10px] text-muted-foreground font-black opacity-60">{isGpsSharing ? "Tracking Verified" : "Enable System Feed"}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={isGpsSharing}
                                                onCheckedChange={(val) => {
                                                    setIsGpsSharing(val);
                                                }}
                                                className="data-[state=checked]:bg-emerald-500 scale-90 sm:scale-100 origin-right"
                                            />
                                        </div>

                                        {/* Mode selection embedded only when isInside is active */}
                                        {isInside && (
                                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-border pt-6">
                                                <button
                                                    onClick={() => handleTrackingSelect("gps")}
                                                    className={`h-14 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all active:scale-95 ${trackingMethod === "gps" ? "bg-primary border-primary text-white" : "border-border text-muted-foreground bg-secondary/50 hover:border-primary/30"}`}
                                                >
                                                    <Navigation className={`w-4 h-4 ${trackingMethod === "gps" ? "text-white" : "text-emerald-500"}`} />
                                                    <span className="text-xs font-black ">GPS mode</span>
                                                </button>
                                                <button
                                                    onClick={() => handleTrackingSelect("tower")}
                                                    className={`h-14 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all active:scale-95 ${trackingMethod === "tower" ? "bg-primary border-primary text-white" : "border-border text-muted-foreground bg-secondary/50 hover:border-primary/30"}`}
                                                >
                                                    <TrendingUp className={`w-4 h-4 ${trackingMethod === "tower" ? "text-white" : "text-blue-500"}`} />
                                                    <span className="text-xs font-black ">Tower link</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isSearching && (
                                    <div className="flex items-center justify-center gap-3 py-4 animate-pulse">
                                        <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                                        <span className="text-[10px] font-black tracking-[0.4em] text-muted-foreground opacity-60 uppercase">Syncing with bus system...</span>
                                    </div>
                                )}

                                {/* Extra Desktop Stats (Only visible lg+) */}
                                <div className="hidden lg:grid grid-cols-2 gap-4">
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[30px] p-6 flex flex-col items-center text-center">
                                        <Zap className="w-6 h-6 text-emerald-500 mb-3" />
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Live Speed</p>
                                        <p className="text-3xl font-black text-foreground">{speed} <span className="text-xs opacity-40">KM/H</span></p>
                                    </div>
                                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-[30px] p-6 flex flex-col items-center text-center">
                                        <ShieldCheck className="w-6 h-6 text-blue-500 mb-3" />
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Safety Lock</p>
                                        <p className="text-3xl font-black text-foreground">ON-GRID</p>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: STATION TIMELINE */}
                            <div className="lg:col-span-5 xl:col-span-4 bg-secondary/20 border-l border-border lg:overflow-y-auto lg:h-full custom-scrollbar relative">
                                <div className="absolute left-[3rem] top-0 bottom-0 w-[3px] bg-border/50 rounded-full" />
                                <div
                                    className="absolute left-[3rem] top-0 w-[3px] bg-primary transition-all duration-1000 shadow-lg rounded-full z-10"
                                    style={{
                                        height: currentStationIndex >= 0
                                            ? `${((currentStationIndex + 0.5) / (stations.length - 1)) * 100}%`
                                            : "0%"
                                    }}
                                />

                                <div className="space-y-0 pt-8 pb-32">
                                    {stations.map((station, idx) => {
                                        const isDeparted = station.status === "Departed";
                                        const isInTransit = station.status === "In Transit";
                                        const isUpcoming = station.status === "Upcoming";

                                        return (
                                            <div key={station.name} className={`relative flex items-center py-6 px-5 transition-all group ${isInTransit ? "bg-emerald-500/5" : "hover:bg-secondary/30"}`}>
                                                <div className="w-12 text-right pr-4 shrink-0">
                                                    <p className={`text-[10px] font-black tracking-tight ${isUpcoming ? "text-muted-foreground opacity-20" : isDeparted ? "text-muted-foreground opacity-40" : "text-foreground"}`}>
                                                        {station.arrival !== "---" ? station.arrival : "START"}
                                                    </p>
                                                </div>

                                                <div className="relative px-2 shrink-0 z-10 flex justify-center w-6">
                                                    {isInTransit ? (
                                                        <div className="relative flex items-center justify-center">
                                                            <div className="absolute w-10 h-10 bg-emerald-500/20 rounded-full animate-ping" />
                                                            <div className="w-8 h-8 bg-foreground text-background rounded-[16px] flex items-center justify-center shadow-lg border-2 border-background relative z-10">
                                                                <Bus className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`w-3 h-3 rounded-full border-2 transition-all duration-700 bg-background ${isDeparted ? "border-foreground shadow-[0_0_8px_rgba(0,0,0,0.1)]" : "border-border"}`} />
                                                    )}
                                                </div>

                                                <div className="flex-1 pl-6">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h3 className={`text-sm font-black leading-tight ${isUpcoming ? "text-muted-foreground opacity-20" : "text-foreground"}`}>
                                                                {station.name}
                                                            </h3>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-[9px] text-muted-foreground font-black tracking-[0.2em] opacity-40 whitespace-nowrap">{station.km} KM MARK</span>
                                                                {station.platform && (
                                                                    <span className="text-[8px] text-foreground font-black bg-secondary px-2.5 py-1 rounded-full border border-border opacity-70">
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
                        </div>
                    </div>

                    {/* ERGONOMIC BOTTOM TRAY */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-8 z-[120] pointer-events-none">
                        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 pointer-events-auto">

                            {/* SOS BUTTON & CONTROLS (Moved Above) */}
                            <div className="flex items-center justify-center gap-4">
                                {/* SOS BUTTON (3s Hold) */}
                                <div className="relative group">
                                    <svg className="absolute -inset-1.5 w-[84px] h-[84px] -rotate-90 pointer-events-none group-hover:scale-110 transition-transform">
                                        <circle cx="42" cy="42" r="36" fill="none" stroke="red" strokeWidth="5" strokeDasharray="226" strokeDashoffset={226 - (226 * sosHoldProgress / 100)} className="transition-all duration-100 ease-linear shadow-lg" />
                                    </svg>
                                    <button
                                        onMouseDown={() => setIsSosHolding(true)}
                                        onMouseUp={() => setIsSosHolding(false)}
                                        onTouchStart={() => setIsSosHolding(true)}
                                        onTouchEnd={() => setIsSosHolding(false)}
                                        className="w-18 h-18 sm:w-20 sm:h-20 bg-red-600 rounded-[32px] flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(220,38,38,0.5)] active:scale-95 transition-all border-4 border-background relative z-10 shrink-0"
                                    >
                                        <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                    </button>
                                </div>

                                {isInside && (
                                    <button
                                        onClick={() => setIsRefreshing(true)}
                                        className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center hover:bg-secondary/80 transition-all opacity-60 hover:opacity-100"
                                    >
                                        <RefreshCw className={`w-5 h-5 text-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                )}
                            </div>

                            {/* CENTERED STATUS PILL (Now at the very bottom) */}
                            <div className="flex flex-col items-center gap-4 w-full">
                                {/* DESKTOP/TABLET VERSION (Wide) */}
                                <div className="hidden sm:flex bg-card/90 border border-border rounded-[40px] py-4 px-10 items-center justify-between shadow-elevated backdrop-blur-3xl relative overflow-hidden group w-full max-w-2xl transform hover:scale-[1.01] transition-all">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex flex-col relative z-10 shrink-0">
                                        <span className="text-[10px] font-black text-muted-foreground tracking-[0.3em] mb-1 opacity-60 uppercase">Live ETA Status</span>
                                        <span className="text-2xl font-black text-primary flex items-center gap-3">
                                            {eta} Mins Away <span className="text-muted-foreground/30 text-sm font-black mt-1">from</span>
                                        </span>
                                    </div>
                                    <div className="h-12 w-[1px] bg-border mx-8" />
                                    <div className="flex-1 text-right relative z-10 min-w-0">
                                        <span className="text-[10px] font-black text-muted-foreground tracking-[0.3em] mb-1 opacity-60 uppercase">Arrival Point</span>
                                        <span className="text-lg font-black text-foreground block overflow-hidden text-ellipsis whitespace-nowrap">
                                            {nextUpcomingStation}
                                        </span>
                                    </div>
                                </div>

                                {/* MOBILE VERSION (Compact & Centered) */}
                                <div className="sm:hidden flex flex-col items-center gap-2">
                                    <div className="bg-card/95 border border-border rounded-full py-3.5 px-8 flex items-center gap-4 shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-primary animate-pulse" />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-sm font-black text-foreground">{eta} Mins Away</p>
                                            <p className="text-[9px] font-black text-muted-foreground opacity-60 uppercase tracking-widest leading-none">To {nextUpcomingStation}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
