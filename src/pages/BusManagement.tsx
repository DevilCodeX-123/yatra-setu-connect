import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    Bus, MapPin, Activity, Timer, Settings, ArrowLeft,
    CheckCircle2, AlertCircle, Clock, ChevronRight,
    TrendingUp, Users, DollarSign, ShieldCheck,
    Wifi, WifiOff, ShieldAlert, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import RouteSelection from "./RouteSelection";
import BusOperationsBoard from "./BusOperationsBoard";
import MapplsMap from "@/components/MapplsMap";

export default function BusManagement() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") || "overview";

    const [activeTab, setActiveTab] = useState(initialTab);
    const [bus, setBus] = useState<any>(null);
    const [sosHistory, setSosHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetchBusDetails();
    }, [id]);

    const handleManageTimetable = () => {
        setActiveTab("route");
        window.history.pushState(null, "", `?tab=route`);
    };

    const handleTrackSOS = () => {
        setActiveTab("sos");
        window.history.pushState(null, "", `?tab=sos`);
    };

    const fetchBusDetails = async () => {
        try {
            setLoading(true);
            const res = await api.getOwnerDashboard();
            const found = res.buses?.find((b: any) => b._id === id);
            if (found) {
                setBus(found);
                // Fetch SOS history for this bus
                const sosRes = await api.getBusSOSHistory(id!);
                setSosHistory(sosRes.alerts || []);
            } else {
                toast.error("Bus not found");
                navigate("/owner");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load bus details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!bus) return null;

    return (
        <DashboardLayout
            title={
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black tracking-tight">{bus.busNumber}</h1>
                            <Badge variant={bus.status === 'Active' ? 'success' : 'secondary'} className="text-[10px] font-bold uppercase">
                                {bus.status}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{bus.name} • {bus.busType}</p>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-5 w-full max-w-3xl bg-muted/50 p-1 rounded-2xl h-12">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs gap-2">
                            <Bus className="w-3.5 h-3.5" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="route" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs gap-2">
                            <MapPin className="w-3.5 h-3.5" /> Route
                        </TabsTrigger>
                        <TabsTrigger value="ops" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs gap-2">
                            <Activity className="w-3.5 h-3.5" /> Operations
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs gap-2">
                            <Settings className="w-3.5 h-3.5" /> Settings
                        </TabsTrigger>
                        <TabsTrigger value="sos" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs gap-2 text-red-500 data-[state=active]:text-red-600">
                            <ShieldCheck className="w-3.5 h-3.5" /> Safety & SOS
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <TabsContent value="overview">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Main Info Card */}
                                <Card className="md:col-span-2 rounded-3xl border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground opacity-50">Vehicle Health & Status</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-3xl bg-primary/5 border border-primary/10">
                                                <p className="text-[10px] font-black text-primary/60 uppercase mb-1">Current Route</p>
                                                <p className="text-sm font-bold">{bus.route?.from || 'Not Set'} → {bus.route?.to || 'Not Set'}</p>
                                            </div>
                                            <div className="p-4 rounded-3xl bg-success/5 border border-success/10">
                                                <p className="text-[10px] font-black text-success/60 uppercase mb-1">Monthly Earnings</p>
                                                <p className="text-lg font-black text-success">₹ 12,450</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black uppercase text-muted-foreground opacity-30">Action Center</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={handleManageTimetable}
                                                    className="h-14 rounded-2xl justify-start px-4 gap-3 border-border hover:bg-muted/50"
                                                >
                                                    <div className="w-8 h-8 rounded-xl bg-info/10 flex items-center justify-center text-info">
                                                        <Timer className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black uppercase opacity-60">Schedule</p>
                                                        <p className="text-xs font-bold">Manage Timetable</p>
                                                    </div>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleTrackSOS}
                                                    className="h-14 rounded-2xl justify-start px-4 gap-3 border-border hover:bg-muted/50"
                                                >
                                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black uppercase opacity-60">Safety</p>
                                                        <p className="text-xs font-bold">Track & SOS</p>
                                                    </div>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Side Stats */}
                                <div className="space-y-4">
                                    <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-gradient-to-br from-primary/10 to-transparent">
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-black">1.2k</p>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase">Monthly Passengers</p>
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary w-3/4 animate-pulse"></div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-3xl border-none shadow-sm bg-card/50">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground">Registration</span>
                                                <span className="text-xs font-mono font-black">{bus.busNumber}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground">Capacity</span>
                                                <span className="text-xs font-black">{bus.totalSeats} Seats</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground">Model</span>
                                                <span className="text-xs font-black">{bus.busType}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="route" className="outline-none">
                            <Card className="rounded-[32px] border-none shadow-2xl overflow-hidden ring-1 ring-border/50">
                                <RouteSelection embedded={true} targetBusId={id} />
                            </Card>
                        </TabsContent>

                        <TabsContent value="ops" className="outline-none">
                            <Card className="rounded-[32px] border-none shadow-2xl overflow-hidden ring-1 ring-border/50">
                                <BusOperationsBoard embedded={true} targetBusId={id} />
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings">
                            <Card className="rounded-3xl border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle>Bus Settings</CardTitle>
                                    <CardDescription>Configure vehicle details and operational preferences</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground italic">Settings module coming soon...</p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="sos" className="outline-none mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* Left Column: Command Hub & Radar */}
                                <div className="lg:col-span-3 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Live Status Card */}
                                        <Card className="md:col-span-1 rounded-[32px] border-none shadow-2xl bg-slate-900 p-6 flex flex-col justify-between overflow-hidden relative group">
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                                <ShieldAlert className="w-24 h-24 text-red-500" />
                                            </div>
                                            <div className="relative z-10 space-y-4">
                                                <Badge className="bg-red-500 hover:bg-red-600 border-none animate-pulse px-3 py-1 text-[10px] font-black uppercase tracking-tighter">Command Active</Badge>
                                                <div className="space-y-1">
                                                    <h2 className="text-2xl font-black text-white leading-tight">Safety <br />Console</h2>
                                                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Bus {bus.busNumber}</p>
                                                </div>
                                            </div>
                                            <div className="relative z-10 pt-8 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full animate-ping ${bus.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                                    <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                                                        {bus.status === 'Active' ? 'Broadcasting Live' : 'Not Broadcasting'}
                                                    </p>
                                                </div>
                                                <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                                                    <p className="text-[9px] font-black text-white/40 uppercase mb-1">Last Telemetry</p>
                                                    <p className="text-xs font-mono font-bold text-white">
                                                        {bus.liveLocation?.lat?.toFixed(6) || '0.000000'}, {bus.liveLocation?.lng?.toFixed(6) || '0.000000'}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Staff Snapshot Hub */}
                                        <Card className="md:col-span-2 rounded-[32px] border-none shadow-2xl bg-white p-6 relative overflow-hidden flex flex-col justify-between">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Personnel</h3>
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">Shift Synchronized</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
                                                        <Users className="w-5 h-5" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-black text-blue-600/40 uppercase mb-0.5">Pilot</p>
                                                        <p className="font-black text-blue-900 truncate">{bus.currentDriverName || 'Not Available'}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-black text-emerald-600/40 uppercase mb-0.5">Conductor</p>
                                                        <p className="font-black text-emerald-900 truncate">{bus.currentConductor || 'Standby'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">Route Progress</span>
                                                <span className="text-[10px] font-black text-primary">{bus.route?.from} ➔ {bus.route?.to}</span>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Live Radar Center */}
                                    <Card className="rounded-[40px] overflow-hidden border-none shadow-2xl bg-slate-100 aspect-[21/9] relative group ring-1 ring-black/5">
                                        <MapplsMap
                                            busLocation={bus.liveLocation ? { lat: bus.liveLocation.lat, lng: bus.liveLocation.lng } : undefined}
                                            markers={bus.route?.stops?.map((s: any) => ({ lat: s.lat, lng: s.lng, label: s.name }))}
                                            className="w-full h-full"
                                        />
                                        <div className="absolute top-8 left-8 z-10 flex items-center gap-2">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Visual Tracking</span>
                                            </div>
                                        </div>
                                        <div className="absolute top-8 right-8 z-10 flex items-center gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="rounded-full h-10 px-6 font-black uppercase text-[10px] bg-white/90 backdrop-blur-xl border-none shadow-2xl hover:bg-white active:scale-95 transition-all"
                                                onClick={() => navigate(`/tracking/${bus.busNumber}`)}
                                            >
                                                <Navigation className="w-3.5 h-3.5 mr-2" /> Open Full Controller
                                            </Button>
                                        </div>
                                    </Card>
                                </div>

                                {/* Right Column: Incident Chronology */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                            </div>
                                            Log Timeline
                                        </h3>
                                        <span className="text-[10px] font-black text-slate-400">{sosHistory.length} ENTRIES</span>
                                    </div>

                                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                                        {sosHistory.length === 0 ? (
                                            <Card className="rounded-[32px] border-dashed border-2 border-slate-200 bg-slate-50/50 p-12 text-center">
                                                <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hub Secured</p>
                                                <p className="text-[9px] text-slate-400 mt-1">No incidents reported for this vehicle</p>
                                            </Card>
                                        ) : (
                                            sosHistory.map((alert) => (
                                                <Card key={alert._id} className={`rounded-[30px] border-none shadow-md transition-all p-5 relative overflow-hidden ${alert.status === 'Active' ? 'ring-2 ring-red-500 bg-red-50/20' : 'bg-white'}`}>
                                                    <div className="flex items-start justify-between mb-4 relative z-10">
                                                        <Badge className={alert.status === 'Active' ? 'bg-red-600 animate-pulse rounded-lg' : 'bg-slate-200 text-slate-600 hover:bg-slate-200 rounded-lg'}>
                                                            {alert.status.toUpperCase()}
                                                        </Badge>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{format(new Date(alert.createdAt), 'dd MMM • hh:mm a')}</span>
                                                    </div>
                                                    <h4 className="text-sm font-black mb-1.5 text-slate-900 uppercase tracking-tight">{alert.type} Incident</h4>
                                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed bg-slate-100/50 p-3 rounded-2xl italic border border-slate-200/50 mb-4">
                                                        "{alert.description || 'Manual emergency trigger from vehicle console.'}"
                                                    </p>

                                                    <div className="space-y-3 relative z-10">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase">Alert Location</p>
                                                                <p className="text-[10px] font-bold text-slate-700 truncate">{alert.location?.address || 'GPS Snapshot Captured'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                                <Users className="w-3.5 h-3.5 text-emerald-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase">Staff on Service</p>
                                                                <p className="text-[10px] font-bold text-slate-700 truncate">{alert.driver?.name || 'Unknown Pilot'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {alert.status === 'Active' && (
                                                        <div className="mt-5 pt-4 border-t border-red-100 relative z-10">
                                                            <Button
                                                                size="sm"
                                                                className="w-full rounded-2xl h-10 text-[10px] font-black bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-200 uppercase tracking-widest"
                                                                onClick={async () => {
                                                                    await api.updateSOSStatus(alert._id, 'Resolved');
                                                                    toast.success('Incident resolved locally');
                                                                    const details = await api.getBusSOSHistory(id!);
                                                                    setSosHistory(details.alerts || []);
                                                                }}
                                                            >
                                                                Resolve Incident
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
