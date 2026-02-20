import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, MapPin, Plus, Trash2, GripVertical, Save, Sparkles, Navigation, Map as MapIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import MapplsMap from "@/components/MapplsMap";

const STATION_COORDINATES: Record<string, { lat: number, lon: number }> = {
    "Bengaluru Central": { lat: 12.9716, lon: 77.5946 },
    "Mysuru Suburban": { lat: 12.2958, lon: 76.6394 },
    "Mandya": { lat: 12.5226, lon: 76.8973 },
    "Ramanagara": { lat: 12.7209, lon: 77.2781 },
    "Channapatna": { lat: 12.6518, lon: 77.2023 },
    "Maddur": { lat: 12.5844, lon: 77.0450 },
    "Kengeri": { lat: 12.9175, lon: 77.4838 },
    "Bidadi": { lat: 12.7981, lon: 77.3876 },
    "Tumkur": { lat: 13.3392, lon: 77.1140 },
    "Hassan": { lat: 13.0072, lon: 76.1029 },
    "Davangere": { lat: 14.4644, lon: 75.9218 },
    "Hubli": { lat: 15.3647, lon: 75.1240 },
    "Dharwad": { lat: 15.4589, lon: 75.0078 },
    "Belgaum": { lat: 15.8497, lon: 74.4977 },
    "Mangalore": { lat: 12.9141, lon: 74.8560 },
    "Udupi": { lat: 13.3409, lon: 74.7473 },
};

interface Stop {
    id: string;
    name: string;
    order: number;
}

export default function RouteSelection() {
    const navigate = useNavigate();
    const [stops, setStops] = useState<Stop[]>([
        { id: "1", name: "Bengaluru Central", order: 0 },
        { id: "2", name: "Mysuru Suburban", order: 1 },
    ]);
    const [newStop, setNewStop] = useState("");
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Map State
    const [markers, setMarkers] = useState<any[]>([]);
    const [routePoints, setRoutePoints] = useState("");

    // Update map data whenever stops change
    useEffect(() => {
        const newMarkers = stops.map(stop => ({
            lat: STATION_COORDINATES[stop.name]?.lat || 12.97,
            lon: STATION_COORDINATES[stop.name]?.lon || 77.59,
            label: stop.name
        }));
        setMarkers(newMarkers);

        const pts = newMarkers.map(m => `${m.lon},${m.lat}`).join(';');
        setRoutePoints(pts);
    }, [stops]);

    const addStop = () => {
        if (!newStop.trim()) return;
        const stop: Stop = {
            id: Math.random().toString(36).substr(2, 9),
            name: newStop,
            order: stops.length
        };
        setStops([...stops, stop]);
        setNewStop("");
        toast.success("Stop added to route");
    };

    const removeStop = (id: string) => {
        if (stops.length <= 2) {
            toast.error("A route must have at least 2 stations (Start & End)");
            return;
        }
        setStops(stops.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
        toast.info("Stop removed");
    };

    const moveStop = (index: number, direction: 'up' | 'down') => {
        const newStops = [...stops];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= stops.length) return;

        [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
        setStops(newStops.map((s, i) => ({ ...s, order: i })));
    };

    const autoSuggestPath = () => {
        setIsSuggesting(true);
        toast.loading("Analyzing traffic and distance...");

        // Simulate smart path selection logic
        setTimeout(() => {
            // For now, simpler "auto-sort" alphabetically or just simulate a change
            const suggested = [...stops].sort((a, b) => a.name.localeCompare(b.name));
            setStops(suggested.map((s, i) => ({ ...s, order: i })));
            setIsSuggesting(false);
            toast.dismiss();
            toast.success("Smart Path Suggested!", { icon: <Sparkles className="w-4 h-4 text-amber-500" /> });
        }, 1500);
    };

    const handleSave = () => {
        if (stops.length < 2) {
            toast.error("Please add at least 2 stops");
            return;
        }
        // Simulate API call
        toast.success("Route path saved successfully!");
        setTimeout(() => navigate("/owner"), 1000);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-full hover:bg-white shadow-sm border">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-primary">Route Selection</h1>
                            <p className="text-sm text-slate-500 font-medium">Design and optimize your bus route paths</p>
                        </div>
                    </div>
                    <Button className="rounded-2xl h-12 px-8 font-bold gap-2 shadow-lg shadow-primary/20" onClick={handleSave}>
                        <Save className="w-4 h-4" /> Save Route
                    </Button>
                </div>

                {/* Interactive Map Hero */}
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden h-[350px] bg-slate-200">
                    <MapplsMap markers={markers} routePoints={routePoints} className="h-full" />
                </Card>

                <div className="grid md:grid-cols-5 gap-6">
                    {/* Stops List */}
                    <div className="md:col-span-3 space-y-4">
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                            <CardHeader className="bg-primary text-white pb-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold uppercase italic flex items-center gap-2">
                                        <Navigation className="w-5 h-5" /> Manage Stops
                                    </CardTitle>
                                    <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                                        {stops.length} STATIONS
                                    </span>
                                </div>
                                <CardDescription className="text-white/70">Add intermediate stops and reorder them for efficiency.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Add a station name..."
                                            className="pl-10 h-12 bg-slate-50 border-none rounded-xl"
                                            value={newStop}
                                            onChange={(e) => setNewStop(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addStop()}
                                        />
                                    </div>
                                    <Button onClick={addStop} className="h-12 w-12 rounded-xl">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="space-y-2 mt-6">
                                    {stops.map((stop, index) => (
                                        <div
                                            key={stop.id}
                                            className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all group"
                                        >
                                            <div className="flex flex-col gap-1 items-center">
                                                <button onClick={() => moveStop(index, 'up')} disabled={index === 0} className="text-slate-300 hover:text-primary disabled:opacity-30">
                                                    <GripVertical className="w-4 h-4 rotate-90" />
                                                </button>
                                                <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                                <button onClick={() => moveStop(index, 'down')} disabled={index === stops.length - 1} className="text-slate-300 hover:text-primary disabled:opacity-30">
                                                    <GripVertical className="w-4 h-4 rotate-90" />
                                                </button>
                                            </div>

                                            <div className="flex-1 flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                                    {index === 0 ? "STARTING POINT" : index === stops.length - 1 ? "FINAL DESTINATION" : `STOP ${index}`}
                                                </span>
                                                <span className="font-bold text-slate-700">{stop.name}</span>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50"
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
                        <Card className="border-none shadow-xl rounded-3xl bg-slate-900 text-white overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-400" /> Smart Suggester
                                </CardTitle>
                                <CardDescription className="text-slate-400 font-medium">Automatic path optimization powered by Yatra Core AI.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400">ESTIMATED REACH</span>
                                        <span className="text-sm font-black text-amber-400 uppercase">2h 45m</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400">TOTAL DISTANCE</span>
                                        <span className="text-sm font-black text-amber-400 uppercase">142 KM</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 font-bold gap-2 text-white shadow-lg shadow-amber-500/20"
                                    onClick={autoSuggestPath}
                                    disabled={isSuggesting}
                                >
                                    {isSuggesting ? "Optimizing..." : "Suggest Smart Path"}
                                </Button>

                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                                        <MapIcon className="w-4 h-4" />
                                        <span>Selected path will be applied to </span>
                                        <span className="text-white font-bold underline decoration-amber-500">KA-01-F-1234</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                                <Navigation className="w-4 h-4" /> Pro Tip
                            </h4>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                Add intermediate stops at high-traffic hubs to increase your monthly earnings. Our AI suggests stops based on historical booking data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
