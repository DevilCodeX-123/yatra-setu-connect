import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    Bus, MapPin, Activity, Timer, Settings, ArrowLeft,
    ShieldCheck, TrendingUp, Users, ShieldAlert,
    Wifi, Usb, Tv, BedDouble, Toilet, Accessibility, Cross,
    ChevronLeft, ChevronRight, IndianRupee, BarChart3,
    Save, ToggleLeft, ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { toast } from "sonner";
import RouteSelection from "./RouteSelection";
import BusOperationsBoard from "./BusOperationsBoard";

// ─── Amenity definitions ──────────────────────────────────────────────────────
const AMENITIES = [
    { key: "AC", label: "Air Conditioning", icon: "❄️" },
    { key: "WiFi", label: "WiFi", icon: "📶" },
    { key: "USB Charging", label: "USB Charging", icon: "🔌" },
    { key: "Sleeper Berth", label: "Sleeper Berth", icon: "🛏️" },
    { key: "Toilet", label: "Toilet", icon: "🚻" },
    { key: "TV/Entertainment", label: "Entertainment", icon: "📺" },
    { key: "Wheelchair Access", label: "Wheelchair Access", icon: "♿" },
    { key: "First Aid Kit", label: "First Aid", icon: "🩹" },
    { key: "CCTV", label: "CCTV", icon: "📷" },
    { key: "GPS Tracking", label: "GPS Tracking", icon: "📍" },
];

const BUS_TYPES = ["AC", "Non-AC", "Express", "Volvo", "Ordinary", "Sleeper"];

// ─── Mini bar chart (no library) ─────────────────────────────────────────────
function BarChart({ days }: { days: any[] }) {
    if (!days?.length) return <div className="text-center text-sm text-muted-foreground py-8">No data</div>;
    const maxVal = Math.max(...days.map((d: any) => Math.max(d.income || 0, d.expense || 0)), 1);
    const visible = days.slice(-15); // show last 15 days
    return (
        <div className="flex items-end gap-1 h-28 w-full overflow-hidden">
            {visible.map((d: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                    <div className="flex items-end gap-px w-full">
                        <div
                            className="flex-1 bg-success/60 rounded-t-sm transition-all"
                            style={{ height: `${Math.round((d.income / maxVal) * 80)}px` }}
                            title={`Income: ₹${d.income}`}
                        />
                        <div
                            className="flex-1 bg-danger/40 rounded-t-sm transition-all"
                            style={{ height: `${Math.round((d.expense / maxVal) * 80)}px` }}
                            title={`Expense: ₹${d.expense}`}
                        />
                    </div>
                    <span className="text-[7px] text-muted-foreground">{d.day}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Expense breakdown component ─────────────────────────────────────────────
function ExpenseBreakdown({ categories }: { categories: any }) {
    if (!categories || Object.keys(categories).length === 0) return null;
    return (
        <Card className="rounded-3xl border-none shadow-sm bg-card/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-wider">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {Object.entries(categories).map(([cat, amt]: [string, any]) => (
                    <div key={cat} className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">{cat}</span>
                        <span className="text-xs font-black text-danger">₹{amt.toLocaleString("en-IN")}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

// ─── Day-wise detailed table component ───────────────────────────────────────
function DayWiseTable({ days }: { days: any[] }) {
    const [expandedDay, setExpandedDay] = useState<number | null>(null);

    if (!days?.length) return null;

    return (
        <Card className="rounded-3xl border-none shadow-sm">
            <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-wider">Day-wise Financial Record</CardTitle>
                <CardDescription>Detailed income and expense log for each day</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground">Day</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground">Income</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground">Expense</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground">Net</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground">Rides</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {days.map((d) => (
                                <React.Fragment key={d.day}>
                                    <tr 
                                        className={`hover:bg-muted/20 transition-colors cursor-pointer ${expandedDay === d.day ? 'bg-muted/10' : ''}`}
                                        onClick={() => setExpandedDay(expandedDay === d.day ? null : d.day)}
                                    >
                                        <td className="px-4 py-3 text-xs font-black">{d.day}</td>
                                        <td className="px-4 py-3 text-xs font-bold text-success">₹{(d.income || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-xs font-bold text-danger">₹{(d.expense || 0).toLocaleString()}</td>
                                        <td className={`px-4 py-3 text-xs font-black ${d.net >= 0 ? "text-success" : "text-danger"}`}>
                                            ₹{(d.net || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{d.bookings || 0}</td>
                                        <td className="px-4 py-3">
                                            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedDay === d.day ? 'rotate-90' : ''}`} />
                                        </td>
                                    </tr>
                                    {expandedDay === d.day && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-3 bg-muted/5 animate-in fade-in duration-300">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Day Bookings */}
                                                    <div className="space-y-2">
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground">Bookings ({d.bookingDetails?.length || 0})</p>
                                                        {d.bookingDetails?.length > 0 ? (
                                                            <div className="space-y-1.5">
                                                                {d.bookingDetails.map((b: any, i: number) => (
                                                                    <div key={i} className="flex items-center justify-between bg-background p-2 rounded-xl border border-border text-[10px]">
                                                                        <div>
                                                                            <span className="font-bold">{b.pnr}</span>
                                                                            <span className="mx-1 opacity-40">|</span>
                                                                            <span className="text-muted-foreground">{b.from} → {b.to}</span>
                                                                        </div>
                                                                        <span className="font-black text-primary">₹{b.amount}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] text-muted-foreground italic">No bookings recorded</p>
                                                        )}
                                                    </div>
                                                    {/* Day Expenses */}
                                                    <div className="space-y-2">
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground">Expenses ({d.expenseDetails?.length || 0})</p>
                                                        {d.expenseDetails?.length > 0 ? (
                                                            <div className="space-y-1.5">
                                                                {d.expenseDetails.map((e: any, i: number) => (
                                                                    <div key={i} className="flex items-center justify-between bg-background p-2 rounded-xl border border-border text-[10px]">
                                                                        <div>
                                                                            <span className="font-bold">{e.category}</span>
                                                                            <span className="mx-1 opacity-40">|</span>
                                                                            <span className="text-muted-foreground truncate max-w-[100px]">{e.description}</span>
                                                                        </div>
                                                                        <span className="font-black text-danger">₹{e.amount}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] text-muted-foreground italic">No expenses recorded</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

export default function BusManagement() {
    const { id } = useParams();
    const navigate = useNavigate();

    const sidebarItems = [
        { href: "/owner", label: "Dashboard", icon: <Activity className="w-4 h-4" /> },
        { href: "/owner/buses", label: "My Buses", icon: <Bus className="w-4 h-4" /> },
        { href: "/owner/revenue", label: "Revenue", icon: <Timer className="w-4 h-4" /> },
    ];
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") || "overview";

    const [activeTab, setActiveTab] = useState(initialTab);
    const [bus, setBus] = useState<any>(null);
    const [sosHistory, setSosHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ─── Overview / Financials ──────────────────────────────────────────────
    const [financials, setFinancials] = useState<any>(null);
    const [finMonth, setFinMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [finLoading, setFinLoading] = useState(false);

    // ─── Settings form ──────────────────────────────────────────────────────
    const [settingsForm, setSettingsForm] = useState({
        name: "", type: "Ordinary", totalSeats: 40, mileage: 4,
        amenities: [] as string[],
        isRentalEnabled: false,
        rentalPricePerDay: 5000, rentalPricePerHour: 500, returnChargePerKm: 15
    });
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [customFacility, setCustomFacility] = useState("");

    useEffect(() => { if (!id) return; fetchBusDetails(); }, [id]);
    useEffect(() => { if (bus) initSettingsForm(bus); }, [bus]);
    useEffect(() => { if (id && activeTab === "overview") fetchFinancials(); }, [id, finMonth, activeTab]);

    const fetchBusDetails = async () => {
        try {
            setLoading(true);
            const res = await api.getOwnerDashboard();
            const found = res.buses?.find((b: any) => b._id === id);
            if (found) {
                setBus(found);
                const sosRes = await api.getBusSOSHistory(id!);
                setSosHistory(sosRes.alerts || []);
            } else { toast.error("Bus not found"); navigate("/owner"); }
        } catch (err) { console.error(err); toast.error("Failed to load bus details"); }
        finally { setLoading(false); }
    };

    const fetchFinancials = async () => {
        if (!id) return;
        try {
            setFinLoading(true);
            const data = await api.getBusFinancials(id, finMonth);
            setFinancials(data);
        } catch (err) { console.error(err); }
        finally { setFinLoading(false); }
    };

    const initSettingsForm = (b: any) => {
        setSettingsForm({
            name: b.name || "",
            type: b.type || "Ordinary",
            totalSeats: b.totalSeats || 40,
            mileage: b.mileage || 4,
            amenities: b.amenities || [],
            isRentalEnabled: b.isRentalEnabled ?? false,
            rentalPricePerDay: b.rentalPricePerDay || 5000,
            rentalPricePerHour: b.rentalPricePerHour || 500,
            returnChargePerKm: b.returnChargePerKm || 15
        });
    };

    const toggleAmenity = (key: string) => {
        setSettingsForm(prev => ({
            ...prev,
            amenities: prev.amenities.includes(key)
                ? prev.amenities.filter(a => a !== key)
                : [...prev.amenities, key]
        }));
    };

    const saveSettings = async () => {
        if (!id) return;
        try {
            setSettingsSaving(true);
            const res = await api.updateBusSettings(id, settingsForm);
            if (res.success) {
                toast.success("Bus settings saved!");
                setBus((prev: any) => ({ ...prev, ...settingsForm }));
            } else toast.error(res.message || "Failed to save");
        } catch (err) { toast.error("Network error"); }
        finally { setSettingsSaving(false); }
    };

    const changeMonth = (dir: number) => {
        const [y, m] = finMonth.split("-").map(Number);
        const d = new Date(y, m - 1 + dir, 1);
        setFinMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    };

    const handleManageTimetable = () => { setActiveTab("route"); window.history.pushState(null, "", `?tab=route`); };
    const handleTrackSOS = () => { setActiveTab("sos"); window.history.pushState(null, "", `?tab=sos`); };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
    );
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
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{bus.busNumber}</h1>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                                bus.status === 'Active' 
                                    ? 'bg-success/10 text-success border-success/20' 
                                    : 'bg-secondary text-secondary-foreground border-transparent'
                            }`}>
                                {bus.status}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{bus.name || "Unnamed Bus"} • {bus.type || bus.busType}</p>
                    </div>
                </div>
            }
            subtitle="View detailed financials, settings and safety alerts"
            sidebarItems={sidebarItems}
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

                        {/* ═══════════════════════ OVERVIEW TAB ═══════════════════════ */}
                        <TabsContent value="overview">
                            <div className="space-y-6">
                                {/* Month selector */}
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => changeMonth(-1)}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="font-black text-sm min-w-[100px] text-center">
                                        {new Date(finMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                                    </span>
                                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => changeMonth(+1)}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Financial KPI cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: "Monthly Income", value: `₹${(financials?.totalIncome || 0).toLocaleString("en-IN")}`, color: "text-success", bg: "bg-success/5 border-success/10" },
                                        { label: "Monthly Expenses", value: `₹${(financials?.totalExpense || 0).toLocaleString("en-IN")}`, color: "text-danger", bg: "bg-danger/5 border-danger/10" },
                                        { label: "Net Income", value: `₹${(financials?.netIncome || 0).toLocaleString("en-IN")}`, color: financials?.netIncome >= 0 ? "text-success" : "text-danger", bg: "bg-primary/5 border-primary/10" },
                                        { label: "Total Bookings", value: financials?.totalBookings || 0, color: "text-primary", bg: "bg-primary/5 border-primary/10" },
                                    ].map(({ label, value, color, bg }) => (
                                        <div key={label} className={`rounded-3xl border p-4 ${bg}`}>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">{label}</p>
                                            <p className={`text-xl font-black ${color}`}>{finLoading ? "..." : value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Seat stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: "Total Seats", value: financials?.totalSeats || bus.totalSeats || 0, color: "text-primary" },
                                        { label: "Online Booked", value: financials?.onlineBooked || 0, color: "text-info" },
                                        { label: "Offline / Cash", value: financials?.offlineBooked || 0, color: "text-warning" },
                                        { label: "Passengers", value: financials?.totalPassengers || 0, color: "text-success" },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="portal-card rounded-2xl p-4 text-center">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">{label}</p>
                                            <p className={`text-2xl font-black ${color}`}>{finLoading ? "…" : value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Bar chart */}
                                <Card className="rounded-3xl border-none shadow-sm">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-primary" />
                                            <CardTitle className="text-sm font-black">Daily Income vs Expenses</CardTitle>
                                        </div>
                                        <div className="flex gap-4 text-[10px] font-bold text-muted-foreground">
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success/60 inline-block" />Income</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger/40 inline-block" />Expenses</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {finLoading ? (
                                            <div className="h-28 flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>
                                        ) : (
                                            <BarChart days={financials?.days || []} />
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Bus info + Quick actions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="rounded-3xl border-none shadow-sm bg-card/50">
                                        <CardContent className="p-4 space-y-3">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">Bus Details</p>
                                            {[
                                                ["Registration", bus.busNumber],
                                                ["Name", bus.name || "—"],
                                                ["Type", bus.type || bus.busType || "—"],
                                                ["Capacity", `${bus.totalSeats} Seats`],
                                                ["Mileage", `${bus.mileage || "—"} km/L`],
                                                ["Route", bus.route?.from ? `${bus.route.from} → ${bus.route.to}` : "Not Set"],
                                            ].map(([k, v]) => (
                                                <div key={k} className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-muted-foreground">{k}</span>
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">{v}</span>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                    <div className="space-y-3">
                                        <Button variant="outline" onClick={handleManageTimetable}
                                            className="w-full h-14 rounded-2xl justify-start px-4 gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-info/10 flex items-center justify-center text-info">
                                                <Timer className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase opacity-60">Schedule</p>
                                                <p className="text-xs font-bold">Manage Timetable</p>
                                            </div>
                                        </Button>
                                        <Button variant="outline" onClick={handleTrackSOS}
                                            className="w-full h-14 rounded-2xl justify-start px-4 gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase opacity-60">Safety</p>
                                                <p className="text-xs font-bold">Track & SOS</p>
                                            </div>
                                        </Button>
                                        <Button variant="outline" onClick={() => setActiveTab("settings")}
                                            className="w-full h-14 rounded-2xl justify-start px-4 gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <Settings className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase opacity-60">Configure</p>
                                                <p className="text-xs font-bold">Bus Settings</p>
                                            </div>
                                        </Button>
                                    </div>
                                </div>

                                {/* Detailed Table & Category Breakdown */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2">
                                        <DayWiseTable days={financials?.days || []} />
                                    </div>
                                    <div className="space-y-6">
                                        <ExpenseBreakdown categories={financials?.expenseByCategory} />
                                        <Card className="rounded-3xl border-none shadow-sm bg-card/50">
                                            <CardContent className="p-4 space-y-3">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">Monthly Summary</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-muted-foreground">Average Daily Income</span>
                                                        <span className="text-xs font-black">₹{Math.round((financials?.totalIncome || 0) / (financials?.days?.length || 1)).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-muted-foreground">Booking Load Factor</span>
                                                        <span className="text-xs font-black">
                                                            {Math.round(((financials?.onlineBooked || 0) + (financials?.offlineBooked || 0)) / ((bus.totalSeats || 40) * (financials?.days?.length || 30)) * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ═══════════════════════ ROUTE TAB ═══════════════════════ */}
                        <TabsContent value="route" className="outline-none">
                            <Card className="rounded-[32px] border-none shadow-2xl overflow-hidden ring-1 ring-border/50">
                                <RouteSelection embedded={true} targetBusId={id} />
                            </Card>
                        </TabsContent>

                        {/* ═══════════════════════ OPERATIONS TAB ═══════════════════ */}
                        <TabsContent value="ops" className="outline-none">
                            <Card className="rounded-[32px] border-none shadow-2xl overflow-hidden ring-1 ring-border/50">
                                <BusOperationsBoard embedded={true} targetBusId={id} />
                            </Card>
                        </TabsContent>

                        {/* ═══════════════════════ SETTINGS TAB ═══════════════════ */}
                        <TabsContent value="settings">
                            <div className="space-y-6 max-w-3xl">

                                {/* Basic Info */}
                                <Card className="rounded-3xl border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black uppercase tracking-wider">Basic Information</CardTitle>
                                        <CardDescription>Bus name, type, capacity and fuel efficiency</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-black">Bus Name</Label>
                                                <Input value={settingsForm.name} onChange={e => setSettingsForm(p => ({ ...p, name: e.target.value }))}
                                                    placeholder="e.g. Shivneri Express" className="rounded-xl" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-black">Bus Number</Label>
                                                <Input value={bus.busNumber} readOnly className="rounded-xl bg-muted/50 text-muted-foreground font-mono" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-black">Bus Type</Label>
                                                <select value={settingsForm.type} onChange={e => setSettingsForm(p => ({ ...p, type: e.target.value }))}
                                                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold">
                                                    {BUS_TYPES.map(t => <option key={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-black">Total Seats</Label>
                                                <Input type="number" min={1} max={100} value={settingsForm.totalSeats}
                                                    onChange={e => setSettingsForm(p => ({ ...p, totalSeats: Number(e.target.value) }))}
                                                    className="rounded-xl" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-black">Mileage (km/L)</Label>
                                                <Input type="number" min={1} step={0.1} value={settingsForm.mileage}
                                                    onChange={e => setSettingsForm(p => ({ ...p, mileage: Number(e.target.value) }))}
                                                    className="rounded-xl" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Facilities */}
                                <Card className="rounded-3xl border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black uppercase tracking-wider">Facilities & Amenities</CardTitle>
                                        <CardDescription>Select the features available on this bus</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Preset amenity toggles */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                            {AMENITIES.map(({ key, label, icon }) => {
                                                const active = settingsForm.amenities.includes(key);
                                                return (
                                                    <button key={key} onClick={() => toggleAmenity(key)}
                                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer text-center
                                                            ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"}`}>
                                                        <span className="text-xl">{icon}</span>
                                                        <span className="text-[10px] font-black leading-tight">{label}</span>
                                                        {active && <span className="text-[9px] font-black text-primary">✓ Active</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Custom facility input */}
                                        <div className="pt-2 border-t border-border">
                                            <Label className="text-xs font-black mb-2 block">Add Custom Facility</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={customFacility}
                                                    onChange={e => setCustomFacility(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter" && customFacility.trim()) {
                                                            const val = customFacility.trim();
                                                            if (!settingsForm.amenities.includes(val))
                                                                setSettingsForm(p => ({ ...p, amenities: [...p.amenities, val] }));
                                                            setCustomFacility("");
                                                        }
                                                    }}
                                                    placeholder="e.g. Snack Bar, Luggage Rack, Reading Light…"
                                                    className="rounded-xl h-10 text-sm flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="rounded-xl h-10 px-4 font-black text-sm"
                                                    onClick={() => {
                                                        const val = customFacility.trim();
                                                        if (!val) return;
                                                        if (!settingsForm.amenities.includes(val))
                                                            setSettingsForm(p => ({ ...p, amenities: [...p.amenities, val] }));
                                                        setCustomFacility("");
                                                    }}
                                                >
                                                    + Add
                                                </Button>
                                            </div>

                                            {/* Show custom amenities (those not in the preset list) as removable chips */}
                                            {settingsForm.amenities.filter(a => !AMENITIES.find(x => x.key === a)).length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {settingsForm.amenities.filter(a => !AMENITIES.find(x => x.key === a)).map(custom => (
                                                        <span key={custom}
                                                            className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 text-[11px] font-black px-3 py-1.5 rounded-full">
                                                            ✦ {custom}
                                                            <button
                                                                onClick={() => setSettingsForm(p => ({ ...p, amenities: p.amenities.filter(a => a !== custom) }))}
                                                                className="ml-0.5 text-primary/60 hover:text-danger transition-colors">
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Rental Settings */}
                                <Card className="rounded-3xl border-none shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black uppercase tracking-wider">Rental Settings</CardTitle>
                                        <CardDescription>Configure rental options for this bus</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                                            <div>
                                                <p className="text-sm font-black">Enable Rental</p>
                                                <p className="text-[11px] text-muted-foreground">Allow passengers to rent this bus for private trips</p>
                                            </div>
                                            <button onClick={() => setSettingsForm(p => ({ ...p, isRentalEnabled: !p.isRentalEnabled }))}
                                                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black transition-all
                                                    ${settingsForm.isRentalEnabled ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>
                                                {settingsForm.isRentalEnabled ? "Enabled ✓" : "Disabled"}
                                            </button>
                                        </div>
                                        {settingsForm.isRentalEnabled && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-black">Price per Day (₹)</Label>
                                                    <Input type="number" value={settingsForm.rentalPricePerDay}
                                                        onChange={e => setSettingsForm(p => ({ ...p, rentalPricePerDay: Number(e.target.value) }))}
                                                        className="rounded-xl" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-black">Price per Hour (₹)</Label>
                                                    <Input type="number" value={settingsForm.rentalPricePerHour}
                                                        onChange={e => setSettingsForm(p => ({ ...p, rentalPricePerHour: Number(e.target.value) }))}
                                                        className="rounded-xl" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-black">Return Charge /km (₹)</Label>
                                                    <Input type="number" value={settingsForm.returnChargePerKm}
                                                        onChange={e => setSettingsForm(p => ({ ...p, returnChargePerKm: Number(e.target.value) }))}
                                                        className="rounded-xl" />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Save Button */}
                                <div className="flex justify-end">
                                    <Button onClick={saveSettings} disabled={settingsSaving}
                                        className="h-12 px-8 rounded-2xl font-black text-sm gap-2">
                                        <Save className="w-4 h-4" />
                                        {settingsSaving ? "Saving..." : "Save All Settings"}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ═══════════════════════ SOS TAB ═══════════════════════ */}
                        <TabsContent value="sos" className="outline-none mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="lg:col-span-3 space-y-6">
                                    <Card className="rounded-[32px] border-none shadow-2xl bg-slate-900 p-6 flex flex-col justify-between overflow-hidden relative group">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                            <ShieldAlert className="w-24 h-24 text-red-500" />
                                        </div>
                                        <div className="relative z-10 space-y-4">
                                            <Badge className="bg-red-500 hover:bg-red-600 border-none animate-pulse px-3 py-1 text-[10px] font-black uppercase tracking-tighter">Command Active</Badge>
                                            <div className="space-y-1">
                                                <h2 className="text-2xl font-black text-white leading-tight">Safety <br />Console</h2>
                                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Bus {bus.busNumber}</p>
                                            </div>
                                            <p className="text-white/70 text-sm">
                                                {sosHistory.length > 0 ? `${sosHistory.length} alert(s) recorded` : "No SOS alerts recorded"}
                                            </p>
                                        </div>
                                    </Card>

                                    {sosHistory.length > 0 && (
                                        <div className="space-y-3">
                                            {sosHistory.slice(0, 5).map((alert: any) => (
                                                <div key={alert._id} className="portal-card p-4 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white">{alert.type || "Emergency Alert"}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString("en-IN")}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                                        alert.status === "Resolved" 
                                                            ? "bg-success/10 text-success border-success/20" 
                                                            : "bg-destructive/10 text-destructive border-destructive/20"
                                                    }`}>{alert.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <Card className="rounded-3xl border-none shadow-sm bg-card/50">
                                        <CardContent className="p-4 space-y-3">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">Bus Info</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground">Registration</span>
                                                <span className="text-xs font-mono font-black text-slate-900 dark:text-white">{bus.busNumber}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground">Status</span>
                                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                                    bus.status === "Active" 
                                                        ? "bg-success/10 text-success border-success/20" 
                                                        : "bg-secondary text-secondary-foreground border-transparent"
                                                }`}>{bus.status}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-muted-foreground">Total Alerts</span>
                                                <span className="text-xs font-black text-slate-900 dark:text-white">{sosHistory.length}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                    </div>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
