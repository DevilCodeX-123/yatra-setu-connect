import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API_BASE_URL, { api } from '@/lib/api';
import {
    ArrowLeft, Trash2, GripVertical, Save, Map as MapIcon,
    Loader2, BookOpen, Bus, X, RotateCcw, CheckCircle2,
    Clock, IndianRupee, PlayCircle, Lock, Unlock, Zap, Edit, ArrowRight, ArrowLeftRight, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import MapplsMap from "@/components/MapplsMap";
import { format } from "date-fns";

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
    id: string; name: string; order: number; lat: number; lng: number;
    priceFromPrev: number; // ₹ from previous stop
    minsFromPrev: number;  // travel time from previous stop
}
interface Suggestion { placeName: string; placeAddress: string; lat: number; lng: number; eLoc: string; type: string; }

function computeArrivalTimes(stops: any[], startTime: string): string[] {
    if (!startTime) return stops.map(() => '');
    const [h, m] = startTime.split(':').map(Number);
    let total = h * 60 + m;
    return stops.map((s, i) => {
        if (i > 0) total += (s.minsFromPrev || 0);
        const hr = Math.floor(total / 60) % 24;
        const mn = total % 60;
        return `${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
    });
}

export default function RouteSelection({ embedded = false, targetBusId = null }: { embedded?: boolean, targetBusId?: string | null }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlBusId = targetBusId || searchParams.get('busNumber');
    const [activeTab, setActiveTab] = useState<'builder' | 'library' | 'assign'>(embedded ? 'library' : 'builder');

    // Builder State
    const [stops, setStops] = useState<Stop[]>([]);
    const [markers, setMarkers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [routeName, setRouteName] = useState('');
    const [isReversed, setIsReversed] = useState(false);

    // Library State
    const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    // Sidebar/Bus State
    const [buses, setBuses] = useState<any[]>([]);

    // Activation modal state
    const [activating, setActivating] = useState<{ routeId: string; variantIdx: number } | null>(null);
    const [activateBusId, setActivateBusId] = useState('');
    const [activateStartTime, setActivateStartTime] = useState('');
    const [activateLoading, setActivateLoading] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<any>(null);

    // Initial load
    useEffect(() => {
        api.getOwnerDashboard().then(res => {
            if (res.buses) {
                setBuses(res.buses);
                // Pre-select bus if provided in URL or prop
                if (urlBusId) {
                    const bus = res.buses.find((b: any) => b._id === urlBusId);
                    if (bus) {
                        setActivateBusId(urlBusId);
                        if (!embedded) setActiveTab('library');
                    }
                }
            }
        }).catch(console.error);
        fetchSavedRoutes();
        // Mock default route
        setStops([
            { id: '1', name: 'Bengaluru Central', order: 0, lat: 12.9716, lng: 77.5946, priceFromPrev: 0, minsFromPrev: 0 },
            { id: '2', name: 'Mysuru', order: 1, lat: 12.2958, lng: 76.6394, priceFromPrev: 150, minsFromPrev: 90 },
        ]);
    }, [urlBusId]);

    const fetchSavedRoutes = async () => {
        setLoadingRoutes(true);
        try {
            const res = await api.getOwnerRoutes();
            if (res.success) setSavedRoutes(res.routes);
        } catch (err) { console.error(err); }
        finally { setLoadingRoutes(false); }
    };

    useEffect(() => {
        setMarkers(stops.map((s, i) => ({
            lat: s.lat, lon: s.lng,
            label: i === 0 ? `START: ${s.name}` : i === stops.length - 1 ? `END: ${s.name}` : s.name
        })));
    }, [stops]);

    useEffect(() => {
        const h = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const searchPlaces = useCallback(async (query: string) => {
        if (query.trim().length < 2) { setSuggestions([]); return; }
        try {
            const res = await fetch(`${API_BASE_URL}/maps/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSuggestions(data.suggestions?.slice(0, 6) || []);
        } catch { setSuggestions([]); }
    }, []);

    const handleSearchInput = (val: string) => {
        setSearchQuery(val);
        setShowSuggestions(true);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => searchPlaces(val), 400);
    };

    const addStopFromSuggestion = (s: Suggestion) => {
        const newStop: Stop = { id: Math.random().toString(36).substr(2, 9), name: s.placeName, lat: s.lat, lng: s.lng, order: stops.length, priceFromPrev: 0, minsFromPrev: 0 };
        setStops([...stops, newStop]);
        setSearchQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const loadRouteFromLibrary = (route: any) => {
        if (!route.variants || route.variants.length === 0) return;
        const mainVariant = route.variants[0];
        const newStops = mainVariant.stops.map((s: any, i: number) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: s.name,
            lat: s.lat,
            lng: s.lng,
            order: i,
            priceFromPrev: s.priceFromPrev || 0,
            minsFromPrev: s.minsFromPrev || 0
        }));
        setStops(newStops);
        setRouteName(route.name);
        setSearchQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        toast.success(`Loaded route: ${route.name}`);
    };

    const removeStop = (id: string) => {
        setStops(stops.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
    };

    const updateStopPricing = (id: string, field: 'priceFromPrev' | 'minsFromPrev', val: number) => {
        setStops(stops.map(s => s.id === id ? { ...s, [field]: val } : s));
    };

    const onDragStart = (idx: number) => setDraggedIndex(idx);
    const onDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === idx) return;
        const newStops = [...stops];
        const item = newStops.splice(draggedIndex, 1)[0];
        newStops.splice(idx, 0, item);
        setStops(newStops.map((s, i) => ({ ...s, order: i })));
        setDraggedIndex(idx);
    };
    const onDragEnd = () => setDraggedIndex(null);

    const handleReverseRoute = () => {
        setStops([...stops].reverse().map((s, i) => ({ ...s, order: i, priceFromPrev: 0, minsFromPrev: 0 })));
        setIsReversed(!isReversed);
    };

    const handleSaveToLibrary = async () => {
        if (stops.length < 2) return toast.error("Need at least 2 stops");
        if (!routeName.trim()) return toast.error("Give this route a name");
        try {
            const res = await api.createOwnerRoute({
                name: routeName,
                from: stops[0].name,
                to: stops[stops.length - 1].name,
                stops: stops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng, priceFromPrev: s.priceFromPrev, minsFromPrev: s.minsFromPrev }))
            });
            if (res.success) {
                toast.success("Route saved and variants created!");
                setSavedRoutes([res.route, ...savedRoutes]);
                setActiveTab('library');
            }
        } catch (err) { toast.error("Failed to save route"); }
    };

    const handleDeleteRoute = async (id: string) => {
        if (!confirm("Delete this route from library?")) return;
        try {
            const res = await api.deleteOwnerRoute(id);
            if (res.success) setSavedRoutes(savedRoutes.filter(r => r._id !== id));
        } catch (err) { toast.error("Failed to delete"); }
    };

    const handleBlockVariant = async (routeId: string, variantIdx: number, currentStatus: boolean) => {
        try {
            const res = await api.blockRouteVariant(routeId, variantIdx);
            if (res.success) fetchSavedRoutes();
        } catch (err) { toast.error("Update failed"); }
    };

    const handleActivateVariant = async () => {
        if (!activateBusId || !activating) return toast.error("missing params");
        setActivateLoading(true);
        try {
            const res = await api.activateRouteVariant(activating.routeId, activating.variantIdx, { busId: activateBusId, startTime: activateStartTime });
            if (res.success) {
                toast.success("Route Activted & Bus is Live!");
                setActivating(null);
                setActivateBusId('');
                setActivateStartTime('');
            }
        } catch (err) { toast.error("Activation failed"); }
        finally { setActivateLoading(false); }
    };

    // ===== Computed arrival times for preview
    const previewArrivalTimes = (activateStartTime && activating)
        ? computeArrivalTimes(
            savedRoutes.find(r => r._id === activating.routeId)?.variants?.[activating.variantIdx]?.stops || [],
            activateStartTime
        )
        : [];

    const activatingRoute = activating ? savedRoutes.find(r => r._id === activating.routeId) : null;
    const activatingVariant = activatingRoute?.variants?.[activating?.variantIdx ?? 0];

    const renderContent = () => (
        <>
            {/* ROUTE BUILDER TAB */}
            {activeTab === 'builder' && (
                <div className="grid lg:grid-cols-5 gap-6 animate-in fade-in">
                    <div className="lg:col-span-3 space-y-4">
                        <Card className="border border-border rounded-3xl overflow-hidden">
                            <div className="p-3 bg-primary/5 flex items-center justify-between border-b border-border/50">
                                <div className="flex gap-2">
                                    <Button onClick={handleReverseRoute} variant="outline" size="sm" className="h-8 text-xs gap-1.5 font-black border-primary text-primary rounded-xl bg-transparent">
                                        <RotateCcw className="w-3 h-3" /> REVERSE
                                    </Button>
                                </div>
                                <span className="text-[10px] font-black text-muted-foreground opacity-50">{stops.length} STOPS</span>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <Input placeholder="Route Name (e.g. Bengaluru Express)" value={routeName} onChange={e => setRouteName(e.target.value)} className="h-10 bg-secondary border-border rounded-xl font-bold text-xs" />
                                <div ref={searchRef} className="relative">
                                    <Input placeholder="Search city/location to add stop..." className="h-11 bg-secondary border-border rounded-xl font-bold text-xs"
                                        value={searchQuery} onChange={e => handleSearchInput(e.target.value)}
                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} />
                                    {showSuggestions && (suggestions.length > 0 || savedRoutes.some(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))) && (
                                        <div className="absolute z-50 w-full mt-2 bg-card rounded-xl shadow-xl border border-border p-2 max-h-[300px] overflow-y-auto">
                                            {/* Saved Routes Section */}
                                            {searchQuery.length >= 2 && savedRoutes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map((r, i) => (
                                                <button key={`route-${i}`} onClick={() => loadRouteFromLibrary(r)} className="w-full p-3 text-left hover:bg-primary/10 rounded-lg flex items-center gap-3 transition-colors border-b border-border/50 last:border-0 group">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        <BookOpen className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-black uppercase text-indigo-600 group-hover:text-indigo-700">LIBRARY: {r.name}</span>
                                                        <span className="text-[10px] text-muted-foreground opacity-70 truncate">{r.from} → {r.to} ({r.variants?.[0]?.stops?.length || 0} stops)</span>
                                                    </div>
                                                </button>
                                            ))}
                                            
                                            {/* Location Suggestions */}
                                            {suggestions.map((s, i) => (
                                                <button key={`loc-${i}`} onClick={() => addStopFromSuggestion(s)} className="w-full p-3 text-left hover:bg-muted rounded-lg flex items-center gap-3 transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                        <MapIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-black uppercase">{s.placeName}</span>
                                                        <span className="text-[10px] text-muted-foreground opacity-70 truncate">{s.placeAddress}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 thin-scrollbar">
                                    {stops.map((stop, idx) => (
                                        <div key={stop.id} draggable onDragStart={() => onDragStart(idx)} onDragOver={e => onDragOver(e, idx)} onDragEnd={onDragEnd}
                                            className={`group relative flex flex-col p-4 rounded-2xl border transition-all ${draggedIndex === idx ? 'opacity-30' : 'bg-card hover:border-primary/40'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="cursor-grab opacity-30 group-hover:opacity-100"><GripVertical className="w-4 h-4" /></div>
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">{idx + 1}</div>
                                                <span className="text-xs font-black uppercase flex-1">{stop.name}</span>
                                                <button onClick={() => removeStop(stop.id)} className="opacity-0 group-hover:opacity-100 text-destructive p-1 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>

                                            {idx > 0 && (
                                                <div className="mt-3 pt-3 border-t border-dashed flex items-center gap-4 animate-in slide-in-from-top-2">
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase opacity-50">Pricing from Prev Stop</label>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                                            <Input type="number" placeholder="Fare" value={stop.priceFromPrev} onChange={e => updateStopPricing(stop.id, 'priceFromPrev', Number(e.target.value))} className="pl-7 h-8 text-[11px] font-bold rounded-lg bg-secondary/50 border-none" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-[9px] font-black text-muted-foreground uppercase opacity-50">Time from Prev (mins)</label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                                            <Input type="number" placeholder="Mins" value={stop.minsFromPrev} onChange={e => updateStopPricing(stop.id, 'minsFromPrev', Number(e.target.value))} className="pl-7 h-8 text-[11px] font-bold rounded-lg bg-secondary/50 border-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <div className="p-4 bg-muted/30 border-t border-border/50">
                                <Button onClick={handleSaveToLibrary} className="w-full rounded-2xl h-12 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2">
                                    <Save className="w-4 h-4" /> SAVE COMPLETE ROUTE
                                </Button>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <Card className="rounded-3xl border border-border overflow-hidden h-fit sticky top-6">
                            <CardHeader className="p-4 border-b bg-muted/50">
                                <CardTitle className="text-sm font-black uppercase flex items-center gap-2"> <MapIcon className="w-4 h-4 text-primary" /> Visual Route Path </CardTitle>
                            </CardHeader>
                            <div className="h-[450px]">
                                <MapplsMap markers={markers} showPath={true} zoom={7} />
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* ROUTE LIBRARY TAB */}
            {activeTab === 'library' && (
                <div className="space-y-6 animate-in fade-in">
                    {loadingRoutes ? <div className="flex items-center justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div> :
                        savedRoutes.length === 0 ? <div className="p-20 text-center border-2 border-dashed rounded-3xl opacity-40 font-bold text-muted-foreground">No routes found in your library</div> :
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {savedRoutes.map(route => (
                                    <Card key={route._id} className="rounded-[32px] border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-card/50 backdrop-blur-sm">
                                        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-muted/50 to-transparent flex items-center justify-between">
                                            <div>
                                                <h3 className="font-black text-sm uppercase tracking-tight">{route.name}</h3>
                                                <p className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase">{route.variants?.length || 0} Variants</p>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRoute(route._id)} className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                                        </div>
                                        <CardContent className="p-4 space-y-4">
                                            {route.variants.map((v: any, vi: number) => (
                                                <div key={vi} className={`p-4 rounded-[24px] border transition-all ${v.isBlocked ? 'bg-muted/50 grayscale' : 'bg-background hover:border-primary/40'}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${v.isBlocked ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}></div>
                                                            <span className="text-[10px] font-black uppercase opacity-60">Variant {vi + 1}: {v.stops[0]?.name} → {v.stops[v.stops.length - 1]?.name}</span>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <Button onClick={() => handleBlockVariant(route._id, vi, v.isBlocked)} variant="ghost" className={`h-7 px-3 rounded-full text-[9px] font-black ${v.isBlocked ? 'text-primary' : 'text-destructive'}`}>
                                                                {v.isBlocked ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />} {v.isBlocked ? 'ENABLE' : 'DISABLE'}
                                                            </Button>
                                                            {!v.isBlocked && (
                                                                <Button onClick={() => setActivating({ routeId: route._id, variantIdx: vi })} className="h-7 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black">
                                                                    <PlayCircle className="w-3 h-3 mr-1" /> GO LIVE
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                                        {v.stops.map((s: any, si: number) => (
                                                            <div key={si} className="flex items-center flex-shrink-0">
                                                                <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-lg border border-border/50">{s.name}</span>
                                                                {si < v.stops.length - 1 && <ArrowRight className="w-2.5 h-2.5 mx-1 opacity-20" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                    }
                </div>
            )}

            {/* ASSIGN TAB */}
            {activeTab === 'assign' && (
                <div className="space-y-6 animate-in fade-in">
                    <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-emerald-50/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase text-emerald-800">Assign Saved Route to Bus</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {buses.map(bus => (
                                    <div key={bus._id} className="p-4 rounded-2xl border bg-card/80 backdrop-blur shadow-sm flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary"> <Bus className="w-5 h-5" /> </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-tight">{bus.busNumber}</h4>
                                                <p className="text-[10px] font-bold text-muted-foreground truncate">{bus.name} • {bus.busType}</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-2 rounded-xl bg-muted/30 border border-border">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 mb-1">Current Status</p>
                                            <Badge variant={bus.status === 'Active' ? 'outline' : 'secondary'} className={`text-[8px] h-4 font-black ${bus.status === 'Active' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : ''}`}> {bus.status} </Badge>
                                        </div>
                                        <Button variant="outline" className="w-full text-[10px] font-black h-9 rounded-xl border-primary text-primary hover:bg-primary/5"
                                            onClick={() => { setActiveTab('library'); setActivateBusId(bus._id); }}>
                                            CHANGE ROUTE
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* ACTIVATION MODAL */}
            {activating && activatingRoute && activatingVariant && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" onClick={() => !activateLoading && setActivating(null)} />
                    <Card className="relative w-full max-w-lg rounded-[40px] border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 bg-card/80 backdrop-blur-2xl">
                        <div className="p-6 border-b border-border/50 bg-gradient-to-br from-emerald-500/10 to-transparent">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                        <Zap className="w-6 h-6 animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight text-emerald-900">GO LIVE PREP</h2>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{activatingRoute.name} • {activatingVariant.label}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setActivating(null)} className="rounded-full hover:bg-emerald-100 h-9 w-9">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-muted-foreground ml-1">Select Bus to Assign</label>
                                <Select value={activateBusId} onValueChange={setActivateBusId}>
                                    <SelectTrigger className="h-14 rounded-2xl border-2 border-border/50 bg-background shadow-sm text-sm font-bold transition-all focus:border-emerald-500 ring-0 hover:bg-muted/50">
                                        <SelectValue placeholder="Choose an available bus..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border shadow-xl">
                                        {buses.map(bus => (
                                            <SelectItem key={bus._id} value={bus._id} className="rounded-xl py-3 px-4 focus:bg-emerald-50">
                                                <div className="flex items-center gap-3">
                                                    <Bus className={`w-4 h-4 ${bus.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`} />
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-xs uppercase">{bus.busNumber}</span>
                                                        <span className="text-[9px] text-muted-foreground font-bold">{bus.name} • {bus.busType}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-muted-foreground ml-1">Daily Departure Time</label>
                                <div className="relative group">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 transition-transform group-focus-within:scale-110" />
                                    <Input 
                                        type="time" 
                                        value={activateStartTime} 
                                        onChange={e => setActivateStartTime(e.target.value)}
                                        className="h-14 pl-12 rounded-2xl border-2 border-border/50 bg-background shadow-sm text-sm font-bold transition-all focus:border-emerald-500 ring-0"
                                    />
                                </div>
                            </div>

                            {/* ARRIVAL PREVIEW */}
                            {activateStartTime && (
                                <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    <h4 className="text-[10px] font-black text-emerald-800 uppercase flex items-center gap-2">
                                        <Activity className="w-3 h-3" /> Computed Schedule Preview
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 max-h-[120px] overflow-y-auto pr-2 thin-scrollbar">
                                        {previewArrivalTimes.map((time, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-100/50">
                                                <span className="text-[9px] font-black text-slate-500 truncate max-w-[70px] uppercase">
                                                    {activatingVariant.stops[idx]?.name}
                                                </span>
                                                <Badge className="bg-emerald-600 text-[10px] font-black">{time}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>

                        <div className="p-6 bg-emerald-50/30 border-t border-border/50 flex gap-3">
                            <Button variant="outline" onClick={() => setActivating(null)} disabled={activateLoading} className="flex-1 h-12 rounded-2xl font-black text-xs border-emerald-100 hover:bg-emerald-50 text-emerald-800 uppercase tracking-tighter">
                                Keep Editing
                            </Button>
                            <Button 
                                onClick={handleActivateVariant} 
                                disabled={!activateBusId || !activateStartTime || activateLoading}
                                className="flex-[2] h-12 rounded-2xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 uppercase tracking-tight flex items-center justify-center gap-2"
                            >
                                {activateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                                Confirm & Launch Live
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );

    if (embedded) {
        return (
            <div className="p-0 space-y-6">
                <div className="flex flex-wrap bg-muted/50 p-1.5 rounded-2xl w-fit border border-border shadow-sm gap-1 ml-6 mt-6">
                    {[
                        { id: 'builder', label: 'Route Builder', Icon: MapIcon, acColor: 'bg-primary' },
                        { id: 'library', label: `Route Library (${savedRoutes.length})`, Icon: BookOpen, acColor: 'bg-indigo-600' },
                    ].map(({ id, label, Icon, acColor }) => (
                        <button key={id} onClick={() => { setActiveTab(id as any); if (id === 'library') fetchSavedRoutes(); }}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${activeTab === id ? `${acColor} text-white shadow-md` : 'text-muted-foreground hover:bg-secondary/70'}`}>
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </div>
                <div className="p-6 pt-0">
                    {renderContent()}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/owner')} className="rounded-full border border-border bg-secondary">
                        <ArrowLeft className="w-5 h-5 opacity-60" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-primary tracking-tight">Route Management</h1>
                        <p className="text-sm text-muted-foreground font-bold opacity-60 uppercase tracking-wider">Build, timing, assign</p>
                    </div>
                </div>

                <div className="flex flex-wrap bg-secondary/50 p-1.5 rounded-2xl w-fit border border-border shadow-sm gap-1">
                    {[
                        { id: 'builder', label: 'Route Builder', Icon: MapIcon, acColor: 'bg-primary' },
                        { id: 'library', label: `Route Library (${savedRoutes.length})`, Icon: BookOpen, acColor: 'bg-indigo-600' },
                        { id: 'assign', label: 'Assign to Bus', Icon: Bus, acColor: 'bg-emerald-600' },
                    ].map(({ id, label, Icon, acColor }) => (
                        <button key={id} onClick={() => { setActiveTab(id as any); if (id === 'library') fetchSavedRoutes(); }}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${activeTab === id ? `${acColor} text-white shadow-md` : 'text-muted-foreground hover:bg-secondary/70'}`}>
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </div>
                {renderContent()}
            </div>
        </div>
    );
}
