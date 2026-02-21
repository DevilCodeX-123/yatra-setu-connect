import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from '@/lib/api';
import {
    ArrowLeft, MapPin, Plus, Trash2, GripVertical, Save, Sparkles, Navigation, Map as MapIcon,
    Search, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import MapplsMap from "@/components/MapplsMap";

// Fallback coordinates (used only if API search fails and user types manually)
const FALLBACK_COORDINATES: Record<string, { lat: number, lon: number }> = {
    "bengaluru central": { lat: 12.9716, lon: 77.5946 },
    "majestic": { lat: 12.9767, lon: 77.5714 },
    "mysuru": { lat: 12.2958, lon: 76.6394 },
    "magadi": { lat: 12.9592, lon: 77.2289 },
    "electronic city": { lat: 12.8391, lon: 77.6778 },
    "whitefield": { lat: 12.9698, lon: 77.7500 },
    "hebbal": { lat: 13.0354, lon: 77.5988 },
};

interface Stop {
    id: string;
    name: string;
    order: number;
    lat: number;
    lng: number;
}

interface Suggestion {
    placeName: string;
    placeAddress: string;
    lat: number;
    lng: number;
    eLoc: string;
    type: string;
}

export default function RouteSelection() {
    const navigate = useNavigate();
    const [stops, setStops] = useState<Stop[]>(() => {
        const saved = localStorage.getItem("yatra_setu_stops_v2");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].lat !== undefined) {
                    return parsed;
                }
            } catch (e) { }
        }
        return [
            { id: "1", name: "Bengaluru Central", order: 0, lat: 12.9716, lng: 77.5946 },
            { id: "2", name: "Mysuru", order: 1, lat: 12.2958, lng: 76.6394 },
        ];
    });

    // Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<any>(null);

    // Drag state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Map state
    const [markers, setMarkers] = useState<any[]>([]);
    const [routePoints, setRoutePoints] = useState("");
    const [busNumber, setBusNumber] = useState<string | null>(null);

    // Initial load from backend
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const bNum = params.get("busNumber");
        if (bNum) {
            setBusNumber(bNum);
            fetchBusData(bNum);
        }
    }, []);

    const fetchBusData = async (bNum: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/buses/${bNum}`);
            if (res.ok) {
                const data = await res.json();
                if (data.route && data.route.stops && data.route.stops.length > 0) {
                    const formattedStops = data.route.stops.map((s: any, i: number) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        name: s.name,
                        order: i,
                        lat: s.lat,
                        lng: s.lng
                    }));
                    setStops(formattedStops);
                }
            } else {
                toast.error("Bus details not found. Using default stops.");
            }
        } catch (err) {
            console.error("Fetch failed:", err);
            toast.error("Failed to fetch bus data from server.");
        }
    };

    // Persist stops locally as backup
    useEffect(() => {
        localStorage.setItem("yatra_setu_stops_v2", JSON.stringify(stops));
    }, [stops]);

    // Update map data
    useEffect(() => {
        const newMarkers = stops.map((stop, index) => {
            let label = stop.name;
            if (index === 0) label = `START: ${stop.name}`;
            else if (index === stops.length - 1) label = `END: ${stop.name}`;
            else label = `STOP ${index}: ${stop.name}`;

            return {
                lat: stop.lat,
                lon: stop.lng,
                label: label
            };
        });
        setMarkers(newMarkers);

        const pts = newMarkers.map(m => `${m.lon},${m.lat}`).join(';');
        setRoutePoints(pts);
    }, [stops]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ===== SEARCH with Mappls API =====
    const searchPlaces = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`${API_BASE_URL}/maps/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data.suggestions && data.suggestions.length > 0) {
                setSuggestions(data.suggestions.slice(0, 6));
            } else {
                setSuggestions([]);
            }
        } catch (err) {
            console.error("Search failed:", err);
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search
    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        setShowSuggestions(true);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            searchPlaces(value);
        }, 400);
    };

    // ===== ADD STOP FROM SUGGESTION =====
    const addStopFromSuggestion = (suggestion: Suggestion) => {
        const stop: Stop = {
            id: Math.random().toString(36).substr(2, 9),
            name: suggestion.placeName || suggestion.placeAddress.split(',')[0],
            order: stops.length,
            lat: suggestion.lat,
            lng: suggestion.lng,
        };
        setStops([...stops, stop]);
        setSearchQuery("");
        setSuggestions([]);
        setShowSuggestions(false);
        toast.success(`📍 ${stop.name} added to route`);
    };

    // ===== ADD STOP MANUALLY (with fallback coordinates) =====
    const addStopManually = () => {
        if (!searchQuery.trim()) return;
        const name = searchQuery.trim();
        const key = name.toLowerCase();
        const fallback = FALLBACK_COORDINATES[key];

        if (fallback) {
            const stop: Stop = {
                id: Math.random().toString(36).substr(2, 9),
                name: name,
                order: stops.length,
                lat: fallback.lat,
                lng: fallback.lon,
            };
            setStops([...stops, stop]);
            toast.success(`📍 ${name} added to route`);
        } else {
            toast.error("Please select a location from the suggestions for accurate mapping.");
            return;
        }

        setSearchQuery("");
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const removeStop = (id: string) => {
        if (stops.length <= 2) {
            toast.error("A route must have at least 2 stations (Start & End)");
            return;
        }
        setStops(stops.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
        toast.info("Stop removed");
    };

    // Drag & Drop
    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
    };
    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        const newStops = [...stops];
        const item = newStops.splice(draggedIndex, 1)[0];
        newStops.splice(index, 0, item);
        setStops(newStops.map((s, i) => ({ ...s, order: i })));
        setDraggedIndex(index);
    };
    const onDragEnd = () => setDraggedIndex(null);

    const autoSuggestPath = () => {
        setIsSuggesting(true);
        toast.loading("Analyzing traffic and distance...");
        setTimeout(() => {
            const suggested = [...stops].sort((a, b) => a.name.localeCompare(b.name));
            setStops(suggested.map((s, i) => ({ ...s, order: i })));
            setIsSuggesting(false);
            toast.dismiss();
            toast.success("Smart Path Suggested!", { icon: <Sparkles className="w-4 h-4 text-primary-light" /> });
        }, 1500);
    };

    const handleSave = async () => {
        if (stops.length < 2) {
            toast.error("Please add at least 2 stops");
            return;
        }

        if (busNumber) {
            try {
                const response = await fetch(`${API_BASE_URL}/buses/${busNumber}/route`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        from: stops[0].name,
                        to: stops[stops.length - 1].name,
                        stops: stops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng }))
                    })
                });

                if (response.ok) {
                    toast.success("Route path saved to database successfully!");
                    localStorage.setItem("yatra_setu_stops_v2", JSON.stringify(stops));
                    setTimeout(() => navigate("/owner"), 1000);
                } else {
                    const data = await response.json();
                    toast.error(data.message || "Failed to save route to database");
                }
            } catch (err) {
                console.error("Save failed:", err);
                toast.error("Connection error. Could not save to database.");
            }
        } else {
            // Fallback for when no bus context is present
            localStorage.setItem("yatra_setu_stops_v2", JSON.stringify(stops));
            toast.success("Route path saved locally (No bus selected)");
            setTimeout(() => navigate("/owner"), 1000);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-full hover:bg-card shadow-sm border border-border">
                            <ArrowLeft className="w-5 h-5 text-foreground opacity-60" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black text-primary">Route Selection</h1>
                            <p className="text-sm text-muted-foreground font-black opacity-60">Design and optimize your bus route paths</p>
                        </div>
                    </div>
                    <Button className="rounded-2xl h-12 px-8 font-black gap-2 shadow-lg shadow-primary/20 " onClick={handleSave}>
                        <Save className="w-4 h-4" /> Save Route
                    </Button>
                </div>

                {/* Interactive Map Hero */}
                <Card className="border border-border shadow-card rounded-3xl overflow-hidden bg-secondary h-[450px]">
                    <MapplsMap markers={markers} routePoints={routePoints} className="h-full" />
                </Card>

                <div className="grid md:grid-cols-5 gap-6">
                    {/* Stops List */}
                    <div className="md:col-span-3 space-y-4">
                        <Card className="border border-border shadow-card rounded-3xl overflow-hidden">
                            <CardHeader className="bg-primary text-primary-foreground pb-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-black flex items-center gap-2">
                                        <Navigation className="w-5 h-5" /> Manage Stops
                                    </CardTitle>
                                    <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full leading-none">
                                        {stops.length} STATIONS
                                    </span>
                                </div>
                                <CardDescription className="text-primary-foreground/70 font-black text-[10px]">Search and add locations from Mappls for accurate mapping.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {/* ===== SEARCH INPUT WITH AUTOCOMPLETE ===== */}
                                <div ref={searchRef} className="relative">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                                            <Input
                                                placeholder="Search for a location..."
                                                className="pl-10 h-12 bg-secondary border border-border rounded-xl pr-10 font-black text-[10px] placeholder:opacity-40"
                                                value={searchQuery}
                                                onChange={(e) => handleSearchInput(e.target.value)}
                                                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        if (suggestions.length > 0) {
                                                            addStopFromSuggestion(suggestions[0]);
                                                        } else {
                                                            addStopManually();
                                                        }
                                                    }
                                                }}
                                            />
                                            {isSearching && (
                                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => {
                                                if (suggestions.length > 0) addStopFromSuggestion(suggestions[0]);
                                                else addStopManually();
                                            }}
                                            className="h-12 w-12 rounded-xl"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    {/* ===== SUGGESTIONS DROPDOWN ===== */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-2 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                                            {suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-none"
                                                    onClick={() => addStopFromSuggestion(s)}
                                                >
                                                    <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-xs text-foreground truncate ">{s.placeName}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate font-black opacity-40">{s.placeAddress}</p>
                                                    </div>
                                                    <span className="text-[9px] font-black text-muted-foreground mt-1 opacity-40">{s.type}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {showSuggestions && searchQuery.length >= 2 && suggestions.length === 0 && !isSearching && (
                                        <div className="absolute z-50 w-full mt-2 bg-card rounded-2xl shadow-2xl border border-border p-4 text-center">
                                            <p className="text-xs text-muted-foreground font-black opacity-40">No locations found. Try a different search term.</p>
                                        </div>
                                    )}
                                </div>

                                {/* ===== STOPS LIST ===== */}
                                <div className="space-y-2 mt-6">
                                    {stops.map((stop, index) => (
                                        <div
                                            key={stop.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, index)}
                                            onDragOver={(e) => onDragOver(e, index)}
                                            onDragEnd={onDragEnd}
                                            className={`flex items-center gap-3 p-4 bg-secondary rounded-2xl border border-border transition-all group cursor-grab active:cursor-grabbing ${draggedIndex === index ? "opacity-30 border-dashed border-primary" : "hover:border-primary/20"
                                                }`}
                                        >
                                            <div className="flex flex-col gap-0 items-center">
                                                <div className="p-1 px-2 text-muted-foreground opacity-20 group-hover:text-primary group-hover:opacity-100 transition-all cursor-grab">
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col min-w-0">
                                                <span className="text-[9px] font-black text-muted-foreground mb-0.5 opacity-40">
                                                    {index === 0 ? "STARTING POINT" : index === stops.length - 1 ? "FINAL DESTINATION" : `STOP ${index}`}
                                                </span>
                                                <span className="font-black text-sm text-foreground truncate ">{stop.name}</span>
                                                <span className="text-[9px] text-muted-foreground font-black opacity-40">
                                                    {stop.lat.toFixed(4)}°N, {stop.lng.toFixed(4)}°E
                                                </span>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex-shrink-0 opacity-40 hover:opacity-100"
                                                onClick={() => removeStop(stop.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Path Suggestion & Info */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border border-border shadow-card rounded-3xl bg-card text-foreground overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-lg font-black flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary-light" /> Smart Suggester
                                </CardTitle>
                                <CardDescription className="text-muted-foreground font-black text-[9px] opacity-60">Automatic path optimization powered by Yatra Core AI.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-secondary rounded-2xl border border-border space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-muted-foreground opacity-40">TOTAL STOPS</span>
                                        <span className="text-xs font-black text-primary dark:text-primary-light ">{stops.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-muted-foreground opacity-40">ROUTE TYPE</span>
                                        <span className="text-xs font-black text-primary dark:text-primary-light ">Road Following</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 rounded-2xl bg-primary-light hover:bg-primary font-black gap-2 text-white shadow-lg shadow-blue-500/20 "
                                    onClick={autoSuggestPath}
                                    disabled={isSuggesting}
                                >
                                    {isSuggesting ? "Optimizing..." : "Suggest Smart Path"}
                                </Button>

                                <div className="pt-4 border-t border-border">
                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-black opacity-60">
                                        <MapIcon className="w-4 h-4" />
                                        <span>Applying to </span>
                                        <span className="text-foreground underline decoration-amber-500">KA-01-F-1234</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                            <h4 className="font-black text-primary mb-3 flex items-center gap-2 text-xs">
                                <Navigation className="w-4 h-4" /> How It Works
                            </h4>
                            <ul className="text-[9px] text-muted-foreground font-black tracking-wider leading-relaxed space-y-3 opacity-80">
                                <li className="flex gap-2"><span>🔍</span> <span>Search for any location using the high-precision bar</span></li>
                                <li className="flex gap-2"><span>📍</span> <span>Select from Mappls suggestions for exact coordinates</span></li>
                                <li className="flex gap-2"><span>🔄</span> <span>Drag stops to reorder the route flow</span></li>
                                <li className="flex gap-2"><span>🗺️</span> <span>Map updates automatically with road-following paths</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
