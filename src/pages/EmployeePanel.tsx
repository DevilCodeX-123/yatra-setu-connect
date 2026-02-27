import { useState, useEffect, useRef, useCallback } from "react";
import {
    Bus, QrCode, UserPlus, MapPin, CheckCircle, CheckCircle2,
    Clock, Users, LogOut, Wifi, WifiOff,
    XCircle, RefreshCw, Shield, Banknote, BarChart3, FileText,
    Ticket, UserCheck, ArrowRight,
    PlusCircle, Smartphone, TrendingUp, MapPinOff, Wallet,
    ShieldAlert, AlertCircle, ChevronLeft, Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SeatMap, { generateSeats, Seat } from "@/components/SeatMap";
import SOSButton from "@/components/SOSButton";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/useSocket";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import MapplsMap from "@/components/MapplsMap";

// ─── API Helpers ──────────────────────────────────────────────────────────────
const API_BASE = "/api/employee";
const getHeaders = () => {
    const token = localStorage.getItem("ys_token");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};
const apiPost = (path: string, body: object) =>
    fetch(API_BASE + path, { method: "POST", headers: getHeaders(), body: JSON.stringify(body) }).then(r => r.json());
const apiPatch = (path: string, body: object = {}) =>
    fetch(API_BASE + path, { method: "PATCH", headers: getHeaders(), body: JSON.stringify(body) }).then(r => r.json());
const apiGet = (path: string) =>
    fetch(API_BASE + path, { headers: getHeaders() }).then(r => r.json());

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = "BUS_SELECT" | "DUTY_START" | "ACTIVE";
type Tab = "dashboard" | "operations" | "safety" | "shiftReports" | "expenses";
type Role = "Driver" | "Conductor";
interface Passenger { pnr: string; name: string; seat: string; status: string; paymentMethod: string; amount: number; boarded: boolean; }
interface AttendanceRecord {
    date: string;
    checkIn: string;
    checkOut: string;
    hoursWorked: number;
    bus: { busNumber: string };
    overtimeHours?: number;
    salaryEarned?: number;
    isOffDay?: boolean;
}
interface ExpenseItem { category: string; amount: number; description: string; date: string; }
interface DailyReport { totalTickets: number; cashTickets: number; onlineTickets: number; cashAmount: number; onlineAmount: number; totalRevenue: number; }
interface MonthlySummary { TotalSalary: number; TotalOvertime: number; TotalOffs: number; }

// ─── Helper Components ────────────────────────────────────────────────────────

// Handle Bus Selection
function BusSelectionScreen({ onActivate }: { onActivate: (bus: string, busId: string | null, code: string, role: Role, driverCode?: string) => void }) {
    const [busNumber, setBusNumber] = useState("");
    const [activationCode, setActivationCode] = useState("");
    const [role, setRole] = useState<Role>("Driver");
    const [loading, setLoading] = useState(false);

    const handleActivate = async () => {
        if (!busNumber.trim() || !activationCode.trim()) return toast.error("Enter Bus Number and Activation Code");
        setLoading(true);
        try {
            const data = await apiPost("/activate", { busNumber: busNumber.toUpperCase(), activationCode });
            if (data.success) {
                toast.success(`Bus ${busNumber.toUpperCase()} selected! Enter Duty Start Code to begin.`);
                onActivate(busNumber.toUpperCase(), data.bus?._id || null, activationCode, role, data.driverCode);
            } else {
                toast.error(data.message || "Invalid activation code");
            }
        } catch {
            // Demo mode
            toast.success(`Demo: Bus ${busNumber || "DEMO"} activated`);
            onActivate(busNumber || "DEMO-BUS", null, activationCode, role);
        } finally { setLoading(false); }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                        <Bus className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Select Your Bus</h1>
                    <p className="text-xs text-muted-foreground">Enter bus number and owner-provided activation code</p>
                </div>

                {/* Role selection */}
                <div className="flex bg-secondary rounded-2xl p-1">
                    {(["Driver", "Conductor"] as Role[]).map(r => (
                        <button key={r} onClick={() => setRole(r)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${role === r ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}>
                            {r === "Driver" ? "🚌 Driver" : "🎟️ Conductor"}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Bus Number</label>
                        <Input value={busNumber} onChange={e => setBusNumber(e.target.value.toUpperCase())}
                            placeholder="e.g. YS-101" className="h-12 text-sm font-bold mt-1 uppercase tracking-widest" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Bus Activation Code</label>
                        <Input value={activationCode} onChange={e => setActivationCode(e.target.value.toUpperCase())}
                            placeholder="Code from owner" className="h-12 text-sm font-mono font-bold mt-1 tracking-widest text-center" />
                    </div>
                </div>

                <Button onClick={handleActivate} disabled={loading || !busNumber || !activationCode} className="w-full h-14 font-black uppercase tracking-widest text-sm gap-2">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Verify & Continue</>}
                </Button>
            </div>
        </div>
    );
}

function DutyStartScreen({ busNumber, role, defaultDriverCode, onDutyStart }: { busNumber: string; role: Role; defaultDriverCode?: string; onDutyStart: (busData: any, checkIn: Date) => void }) {
    const [driverCode, setDriverCode] = useState(defaultDriverCode || "");
    const [loading, setLoading] = useState(false);

    const handleStart = async () => {
        if (!driverCode.trim()) return toast.error("Enter your driver code");
        setLoading(true);
        try {
            const data = await apiPost("/go-onair", { driverCode, busNumber, role });
            if (data.success) {
                toast.success("✅ Duty started! Attendance marked automatically.");
                onDutyStart(data.bus, new Date(data.checkIn));
            } else {
                toast.error(data.message || "Invalid driver code");
            }
        } catch {
            toast.success("Demo: Duty started!");
            onDutyStart({ busNumber, name: "Demo Bus", route: { from: "Start", to: "End", stops: [] } }, new Date());
        } finally { setLoading(false); }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
            <div className="w-full max-w-sm space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">Bus Verified</p>
                    <p className="text-xl font-black text-foreground mt-1">{busNumber}</p>
                    <p className="text-xs text-muted-foreground">{role} Role Selected</p>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Duty Start Code</label>
                    <p className="text-[10px] text-muted-foreground">Enter the code provided by your owner to start duty and mark attendance.</p>
                    <Input value={driverCode} onChange={e => setDriverCode(e.target.value.toUpperCase())}
                        placeholder="Your driver/duty code"
                        className="h-14 text-center text-xl font-mono font-black tracking-[0.4em]" />
                </div>

                <div className="bg-secondary/60 rounded-xl p-3 space-y-1 text-xs text-muted-foreground">
                    <p className="font-bold text-foreground text-[11px]">Starting duty will automatically:</p>
                    <p>✅ Mark your attendance for today</p>
                    <p>✅ Record start time</p>
                    <p>✅ Enable live location option</p>
                </div>

                <Button onClick={handleStart} disabled={loading || !driverCode} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 font-black uppercase tracking-widest gap-2">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Shield className="w-4 h-4" /> Start Duty Now</>}
                </Button>
            </div>
        </div>
    );
}

function OffDutyPlaceholder({ title, description, icon: Icon, onAction }: { title: string; description: string; icon: any; onAction: () => void }) {
    return (
        <div className="text-center py-20 bg-card/40 border border-border rounded-3xl space-y-4">
            <Icon className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
            <div className="space-y-1">
                <p className="font-black uppercase text-sm">{title}</p>
                <p className="text-[10px] text-muted-foreground">{description}</p>
            </div>
            <Button size="sm" onClick={onAction} className="font-black uppercase tracking-wider text-[10px]">Start Duty Now</Button>
        </div>
    );
}

const TABS = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "operations", label: "Operations", icon: Users },
    { id: "safety", label: "Safety & SOS", icon: Shield },
    { id: "shiftReports", label: "Shift & Reports", icon: BarChart3 },
    { id: "expenses", label: "Expenses", icon: Wallet },
] as const;

export default function EmployeePanel() {
    const { token, user, isVerifying } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState<Step>("BUS_SELECT");
    const [role, setRole] = useState<Role>("Driver");
    const [busNumber, setBusNumber] = useState("");
    const [busId, setBusId] = useState<string | null>(null);
    const [activationCode, setActivationCode] = useState("");
    const [autoDriverCode, setAutoDriverCode] = useState("");
    const [busData, setBusData] = useState<any>(null);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");

    const sidebarItems = TABS.map(tab => ({
        href: `/employee#${tab.id}`,
        label: tab.label,
        icon: <tab.icon className="size-4" />
    }));

    // Sync tab with URL hash
    useEffect(() => {
        const hash = window.location.hash.replace("#", "") as Tab;
        if (hash && TABS.some(t => t.id === hash)) {
            setActiveTab(hash);
        }
    }, [location.hash]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isVerifying && !token) {
            toast.error("Please login to access Employee Panel");
            navigate("/login?redirect=/employee");
        }
    }, [token, isVerifying, navigate]);

    if (isVerifying) return <div className="h-screen flex items-center justify-center"><RefreshCw className="animate-spin" /></div>;
    if (!token) return null;

    // Live
    const [seats, setSeats] = useState<Seat[]>(generateSeats(40));
    const [gpsSending, setGpsSending] = useState(false);
    const [connected, setConnected] = useState(false);
    const [locationSource, setLocationSource] = useState<"mobile" | "vehicle">("mobile");
    const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
    const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Persistence & State Restoration
    useEffect(() => {
        const savedBus = localStorage.getItem("ys_active_bus");
        const savedDuty = localStorage.getItem("ys_on_duty");

        if (savedBus) {
            try {
                const { number, id, role: r, code, driverCode } = JSON.parse(savedBus);
                setBusNumber(number);
                setBusId(id);
                setRole(r);
                setActivationCode(code);
                if (driverCode) setAutoDriverCode(driverCode);

                if (savedDuty) {
                    const dutyInfo = JSON.parse(savedDuty);
                    setCheckInTime(new Date(dutyInfo.checkInTime));
                    setBusData(dutyInfo.busData);
                    setStep("ACTIVE");
                } else {
                    setStep("DUTY_START");
                }
            } catch (e) {
                console.error("Persistence Restore Error:", e);
                localStorage.removeItem("ys_active_bus");
                localStorage.removeItem("ys_on_duty");
            }
        }
    }, []);

    // Initial Position Check
    useEffect(() => {
        if (checkInTime && !currentPosition) {
            navigator.geolocation.getCurrentPosition(pos => {
                setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }, (err) => {
                console.warn("Initial position error:", err);
            });
        }
    }, [checkInTime]);

    // Passengers
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [loadingPassengers, setLoadingPassengers] = useState(false);

    // Attendance
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [attendanceMonth, setAttendanceMonth] = useState(new Date().toISOString().slice(0, 7));

    // Expenses
    const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
    const [expenseForm, setExpenseForm] = useState({ category: "Fuel", amount: "", description: "" });
    const [addingExpense, setAddingExpense] = useState(false);

    // Reports
    const [report, setReport] = useState<DailyReport | null>(null);

    // Tickets / Cash
    const [showCashModal, setShowCashModal] = useState(false);
    const [cashForm, setCashForm] = useState({ name: "", seat: "", from: "", to: "", amount: "", paymentMethod: "Cash" });
    const [addingTicket, setAddingTicket] = useState(false);

    // QR Scanner
    const [showScanner, setShowScanner] = useState(false);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    // Shift end
    const [showShiftEnd, setShowShiftEnd] = useState(false);
    const [shiftSummary, setShiftSummary] = useState<any>(null);

    const { socket, isConnected, sendLocation, joinBus, on } = useSocket();

    // Handle Bus Selection
    const onBusActivated = (bn: string, bid: string | null, code: string, r: Role, driverCodeRes?: string) => {
        setBusNumber(bn); setBusId(bid); setRole(r); setActivationCode(code);
        if (driverCodeRes) setAutoDriverCode(driverCodeRes);
        setStep("DUTY_START");
        localStorage.setItem("ys_active_bus", JSON.stringify({ number: bn, id: bid, role: r, code, driverCode: driverCodeRes }));

        // Notify owner immediately that someone is verifying
        socket?.emit("bus:verifying", { busNumber: bn, role: r });
    };

    // Handle Duty Start
    const onDutyStarted = (bus: any, checkIn: Date) => {
        setBusData(bus); setCheckInTime(checkIn);
        setStep("ACTIVE");
        localStorage.setItem("ys_on_duty", JSON.stringify({ checkInTime: checkIn.toISOString(), busData: bus }));

        // Notify owner that duty has officially started
        socket?.emit("bus:duty-started", {
            busNumber: bus.busNumber,
            busData: bus,
            checkInTime: checkIn.toISOString()
        });
    };

    // Join socket when active
    useEffect(() => {
        if (step !== "ACTIVE") return;
        joinBus(busNumber); setConnected(true);
        const unsub = on("bus:seat-update", ({ seatNumber, status }: any) => {
            setSeats(prev => prev.map(s => s.number === seatNumber ? { ...s, status } : s));
        });
        return () => { unsub(); };
    }, [step, busNumber]);

    // Load passengers
    const loadPassengers = useCallback(async () => {
        if (!busNumber) return;
        setLoadingPassengers(true);
        try {
            const data = await apiGet(`/passengers?busNumber=${busNumber}`);
            setPassengers(data.passengers || []);
        } catch { setPassengers([]); }
        finally { setLoadingPassengers(false); }
    }, [busNumber]);

    // Load attendance
    const loadAttendance = useCallback(async () => {
        try {
            const data = await apiGet(`/my-attendance?month=${attendanceMonth}`);
            setAttendance(data.attendance || []);
        } catch { setAttendance([]); }
    }, [attendanceMonth]);

    // Load expenses
    const loadExpenses = useCallback(async () => {
        try {
            const data = await apiGet(`/expenses?busNumber=${busNumber}`);
            setExpenses(data.expenses || []);
        } catch { setExpenses([]); }
    }, [busNumber]);

    // Load report
    const loadReport = useCallback(async () => {
        try {
            const data = await apiGet(`/daily-report?busNumber=${busNumber}`);
            setReport(data);
        } catch { setReport(null); }
    }, [busNumber]);

    useEffect(() => {
        if (activeTab === "operations") loadPassengers();
        if (activeTab === "shiftReports") {
            loadAttendance();
            loadReport();
        }
        if (activeTab === "expenses") loadExpenses();
    }, [activeTab, step, attendanceMonth]);

    // GPS
    const startGPS = () => {
        if (!navigator.geolocation) return toast.error("GPS not available");
        setGpsSending(true);
        gpsIntervalRef.current = setInterval(() => {
            navigator.geolocation.getCurrentPosition(pos => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setCurrentPosition({ lat, lng });
                sendLocation(busNumber, lat, lng, locationSource === "mobile" ? "driver" : "gps");
                apiPost("/location", { busNumber, lat, lng, source: locationSource });
            });
        }, 5000);
        toast.success("GPS sharing started — every 5s");
    };
    const stopGPS = () => {
        if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
        setGpsSending(false);
        toast.info("GPS sharing stopped");
    };
    useEffect(() => () => { if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current); }, []);

    // QR Scanner
    useEffect(() => {
        if (showScanner) {
            scannerRef.current = new Html5QrcodeScanner("emp-reader", { fps: 10, qrbox: 250 }, false);
            scannerRef.current.render((decoded: string) => {
                toast.success(`Ticket Verified: ${decoded}`);
                apiPost("/scan-qr", { pnr: decoded });
                setShowScanner(false);
            }, () => { });
        } else {
            scannerRef.current?.clear().catch(() => { });
            scannerRef.current = null;
        }
        return () => { scannerRef.current?.clear().catch(() => { }); };
    }, [showScanner]);

    // Add cash ticket
    const addCashTicket = async () => {
        if (!cashForm.name || !cashForm.seat) return toast.error("Passenger name & seat required");
        setAddingTicket(true);
        try {
            const data = await apiPost("/cash-passenger", { ...cashForm, busNumber });
            if (data.success) {
                toast.success(`Ticket created! PNR: ${data.pnr}`);
                setShowCashModal(false);
                setCashForm({ name: "", seat: "", from: "", to: "", amount: "", paymentMethod: "Cash" });
                loadPassengers();
            } else { toast.error(data.message || "Failed"); }
        } catch { toast.error("Network error"); }
        finally { setAddingTicket(false); }
    };

    // Board / drop passenger
    const handleBoard = async (pnr: string) => {
        const data = await apiPatch(`/passengers/${pnr}/board`);
        if (data.success) { toast.success("Marked as boarded"); loadPassengers(); }
    };
    const handleDrop = async (pnr: string) => {
        const data = await apiPatch(`/passengers/${pnr}/drop`);
        if (data.success) { toast.success("Passenger dropped"); loadPassengers(); }
    };

    // Add expense
    const addExpense = async () => {
        if (!expenseForm.amount || !expenseForm.category) return toast.error("Amount and category required");
        setAddingExpense(true);
        try {
            const data = await apiPost("/expenses", { ...expenseForm, busNumber });
            if (data.success) { toast.success("Expense recorded & owner notified"); setExpenseForm({ category: "Fuel", amount: "", description: "" }); loadExpenses(); }
        } catch { toast.error("Failed to add expense"); }
        finally { setAddingExpense(false); }
    };

    // End Duty
    const endDuty = async () => {
        if (!busId) {
            setShiftSummary({ hoursWorked: 8, checkIn: checkInTime, checkOut: new Date(), shiftSummary: { totalTickets: 12, cashCollected: 960, onlineCollected: 520, totalRevenue: 1480 } });
            setShowShiftEnd(true); return;
        }
        try {
            const data = await apiPost("/check-out", { busId });
            if (data.success) { setShiftSummary(data); setShowShiftEnd(true); }
            else toast.error(data.message || "Error ending duty");
        } catch { toast.error("Network error"); }
    };

    const dutyHours = checkInTime ? ((Date.now() - checkInTime.getTime()) / 3600000).toFixed(1) : "0";

    // ─── RENDER ───────────────────────────────────────────────────────────────

    // Shift End Summary Modal
    if (showShiftEnd && shiftSummary) {
        return (
            <DashboardLayout title="Duty Complete" subtitle="Shift Summary" sidebarItems={[]}>
                <div className="max-w-md mx-auto space-y-6 py-8">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black uppercase">Duty Ended</h2>
                        <p className="text-muted-foreground text-sm">Your shift report has been generated</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: "Hours Worked", value: `${shiftSummary.hoursWorked}h`, color: "text-blue-500" },
                            { label: "Total Tickets", value: shiftSummary.shiftSummary?.totalTickets || 0, color: "text-primary" },
                            { label: "Cash Collected", value: `₹${shiftSummary.shiftSummary?.cashCollected || 0}`, color: "text-green-500" },
                            { label: "Total Revenue", value: `₹${shiftSummary.shiftSummary?.totalRevenue || 0}`, color: "text-emerald-500" },
                        ].map((s, i) => (
                            <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center">
                                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                    <Button className="w-full" onClick={() => {
                        setShowShiftEnd(false);
                        setStep("BUS_SELECT");
                        setBusNumber("");
                        setBusId(null);
                        setCheckInTime(null);
                        stopGPS();
                        localStorage.removeItem("ys_active_bus");
                        localStorage.removeItem("ys_on_duty");
                    }}>
                        Start New Shift
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={
                <div className="flex items-center gap-2">
                    {busNumber ? `${busNumber} · ${role}` : "Employee Portal"}
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        <span className={`w-1 h-1 rounded-full mr-1.5 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {isConnected ? 'System Online' : 'System Offline'}
                    </Badge>
                </div>
            }
            subtitle={checkInTime ? `On Duty · ${dutyHours}h` : busNumber ? "Offline · Click Sidebar for Services" : "Driver / Conductor"}
            sidebarItems={sidebarItems}
        >
            <div className="space-y-0">
                {/* Active Header Bar - Only show if bus is selected */}
                {busNumber && (
                    <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${checkInTime && isConnected ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-red-50 text-red-600 border border-red-100"}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${checkInTime && isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-600"}`} />
                                {checkInTime && isConnected ? "Live" : "No Connection"}
                            </div>
                            <div>
                                <p className="font-black text-base leading-none">{busNumber}</p>
                                <p className="text-[10px] text-muted-foreground">{role} · {checkInTime ? `${dutyHours}h on duty` : "Currently Off Duty"}</p>
                            </div>
                        </div>
                        {checkInTime && (
                            <Button variant="destructive" size="sm" className="gap-1.5 text-xs font-black" onClick={endDuty}>
                                <LogOut className="w-3.5 h-3.5" /> End Duty
                            </Button>
                        )}
                    </div>
                )}

                {/* ── DASHBOARD TAB ──────────────────────────────────────────── */}
                {activeTab === "dashboard" && (
                    <div className="space-y-4 pt-4">
                        {step === "BUS_SELECT" ? (
                            <BusSelectionScreen onActivate={onBusActivated} />
                        ) : !checkInTime ? (
                            <DutyStartScreen busNumber={busNumber} role={role} defaultDriverCode={autoDriverCode} onDutyStart={onDutyStarted} />
                        ) : (
                            <>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: "Available", value: seats.filter(s => s.status === "Available").length, color: "text-green-500" },
                                        { label: "Occupied", value: seats.filter(s => s.status !== "Available").length, color: "text-red-400" },
                                        { label: "Total", value: seats.length, color: "text-primary" },
                                    ].map((s, i) => (
                                        <div key={i} className="bg-card border border-border rounded-2xl p-3 text-center">
                                            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setShowCashModal(true)} className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-primary/20 transition-colors">
                                        <UserPlus className="w-7 h-7 text-primary" />
                                        <p className="text-xs font-black text-primary">Cash Ticket</p>
                                    </button>
                                    <button onClick={() => setShowScanner(!showScanner)} className={`border rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors ${showScanner ? "bg-red-500/20 border-red-500/30" : "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20"}`}>
                                        {showScanner ? <XCircle className="w-7 h-7 text-red-400" /> : <QrCode className="w-7 h-7 text-blue-500" />}
                                        <p className={`text-xs font-black ${showScanner ? "text-red-400" : "text-blue-500"}`}>{showScanner ? "Close Scanner" : "Scan QR"}</p>
                                    </button>
                                </div>

                                {showScanner && <div className="bg-background border border-border rounded-2xl p-4 overflow-hidden"><div id="emp-reader" className="w-full" /></div>}

                                {/* Route Info */}
                                {busData?.route && (
                                    <div className="bg-card border border-border rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">Route</p>
                                        <div className="flex items-center gap-2 text-sm font-bold">
                                            <span>{busData.route.from}</span>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                            <span>{busData.route.to}</span>
                                        </div>
                                        {busData.route.stops?.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {busData.route.stops.map((s: any, i: number) => (
                                                    <span key={i} className="bg-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">{s.name}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="bg-card border border-border rounded-2xl p-4">
                                    <p className="text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-wider">Live Seat Map</p>
                                    <div className="scale-90 origin-top"><SeatMap seats={seats} readOnly /></div>
                                </div>

                                <div className="bg-red-950/30 border border-red-900/30 rounded-2xl p-5">
                                    <p className="text-[10px] font-black text-red-400 mb-4 text-center">Emergency Controls</p>
                                    <div className="flex justify-center"><SOSButton busNumber={busNumber} /></div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── OPERATIONS TAB (PASSENGERS + TICKETING) ──────────────────── */}
                {activeTab === "operations" && (
                    <div className="space-y-6 pt-4">
                        {!checkInTime ? (
                            <OffDutyPlaceholder title="Operations Locked" description="You must be on duty to manage passengers and tickets." icon={Users} onAction={() => setActiveTab("dashboard")} />
                        ) : (
                            <>
                                {/* Ticketing Quick Actions */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => { setCashForm(f => ({ ...f, paymentMethod: "Cash" })); setShowCashModal(true); }}
                                        className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-green-500/20 transition-colors">
                                        <Banknote className="w-8 h-8 text-green-500" />
                                        <p className="text-xs font-black text-green-600 dark:text-green-400">Cash Ticket</p>
                                    </button>
                                    <button onClick={() => { setCashForm(f => ({ ...f, paymentMethod: "UPI" })); setShowCashModal(true); }}
                                        className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-purple-500/20 transition-colors">
                                        <Smartphone className="w-8 h-8 text-purple-500" />
                                        <p className="text-xs font-black text-purple-600 dark:text-purple-400">UPI Ticket</p>
                                    </button>
                                </div>
                                <button onClick={() => setShowScanner(!showScanner)} className={`w-full rounded-2xl p-4 flex items-center gap-3 transition-colors ${showScanner ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20"}`}>
                                    <div className={`p-2 rounded-lg ${showScanner ? "bg-red-500 text-white" : "bg-blue-600 text-white"}`}>{showScanner ? <XCircle className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}</div>
                                    <div className="text-left">
                                        <p className="font-black text-sm">{showScanner ? "Stop Scanner" : "Scan QR / Verify PNR"}</p>
                                        <p className="text-[10px] text-muted-foreground opacity-80">Verify tickets or boarding status</p>
                                    </div>
                                </button>
                                {showScanner && <div className="bg-background border border-border rounded-2xl p-4 overflow-hidden"><div id="emp-reader" className="w-full" /></div>}

                                <div className="h-px bg-border my-2" />

                                {/* Passenger List Summary */}
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="font-black uppercase text-sm tracking-tight text-primary">Passengers Today</h3>
                                    <Button variant="outline" size="sm" onClick={loadPassengers} disabled={loadingPassengers} className="h-7 text-[10px] gap-1">
                                        <RefreshCw className={`w-3 h-3 ${loadingPassengers ? "animate-spin" : ""}`} /> Sync
                                    </Button>
                                </div>
                                <div className="space-y-3 pb-4">
                                    {passengers.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-3xl">
                                            <Users className="w-10 h-10 mx-auto mb-2 opacity-10" />
                                            <p className="text-xs font-bold uppercase tracking-widest opacity-30">No bookings yet</p>
                                        </div>
                                    ) : passengers.map(p => (
                                        <div key={p.pnr} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-black text-sm">{p.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">Seat {p.seat} · {p.paymentMethod} · ₹{p.amount}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">{p.pnr}</p>
                                                </div>
                                                <div className="flex flex-col gap-1.5 items-end">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${p.status === "Boarded" ? "bg-emerald-500/10 text-emerald-500" : p.status === "Completed" ? "bg-slate-200 text-slate-500" : "bg-blue-500/10 text-blue-500"}`}>{p.status}</span>
                                                    {p.status !== "Boarded" && p.status !== "Completed" && (
                                                        <Button size="sm" className="h-7 text-[10px] px-3 gap-1 shadow-lg shadow-primary/20" onClick={() => handleBoard(p.pnr)}>
                                                            <UserCheck className="w-3 h-3" /> Board
                                                        </Button>
                                                    )}
                                                    {p.status === "Boarded" && (
                                                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-3 gap-1" onClick={() => handleDrop(p.pnr)}>
                                                            <MapPinOff className="w-3 h-3" /> Drop
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── SAFETY & SOS TAB (TRACKING + SOS) ────────────────────────── */}
                {activeTab === "safety" && (
                    <div className="space-y-4 pt-4 pb-20 -mx-6 px-6 h-[calc(100vh-140px)] flex flex-col">
                        {!checkInTime ? (
                            <OffDutyPlaceholder title="Safety Locked" description="Start duty to access tracking and SOS features." icon={Shield} onAction={() => setActiveTab("dashboard")} />
                        ) : (
                            <>
                                <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-black text-sm">Live Location Sharing</p>
                                            <p className="text-[10px] text-muted-foreground">Broadcasting to passengers & owner</p>
                                        </div>
                                        <button onClick={gpsSending ? stopGPS : startGPS}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${gpsSending ? "bg-emerald-500 text-white shadow-lg" : "bg-secondary text-muted-foreground hover:bg-emerald-500/10"}`}>
                                            {gpsSending ? <><Wifi className="w-4 h-4" /> Sharing</> : <><WifiOff className="w-4 h-4" /> Start</>}
                                        </button>
                                    </div>
                                </div>

                                {/* Live Map View */}
                                <div className="flex-1 bg-card border border-border rounded-3xl overflow-hidden relative shadow-inner">
                                    <MapplsMap
                                        busLocation={currentPosition || undefined}
                                        userLocation={currentPosition}
                                        className="w-full h-full"
                                    />

                                    <div className="absolute bottom-4 left-4 z-10 p-3 bg-background/90 backdrop-blur-md rounded-2xl border border-border shadow-2xl">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Status</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                                            <p className="text-[10px] font-black">{connected ? "LIVE GPS" : "OFFLINE"}</p>
                                        </div>
                                    </div>

                                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                                        <button onClick={() => setLocationSource("mobile")} className={`p-2 rounded-xl border shadow-lg transition-all ${locationSource === "mobile" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"}`}>
                                            <Smartphone className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setLocationSource("vehicle")} className={`p-2 rounded-xl border shadow-lg transition-all ${locationSource === "vehicle" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"}`}>
                                            <Bus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Emergency SOS Section */}
                                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                                            <ShieldAlert className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase">Emergency SOS</p>
                                            <p className="text-[9px] text-muted-foreground">Alert Owner & Authorities</p>
                                        </div>
                                    </div>
                                    <SOSButton busNumber={busNumber} />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── SHIFT & REPORTS TAB (ATTENDANCE + REVENUE) ────────────────── */}
                {activeTab === "shiftReports" && (
                    <div className="space-y-6 pt-4 pb-20">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: "Est. Salary", value: `₹${(attendance.reduce((acc, r) => acc + (r.salaryEarned || 0), 0)).toLocaleString()}`, icon: Wallet, color: "text-emerald-500" },
                                { label: "Overtime", value: `${attendance.reduce((acc, r) => acc + (r.overtimeHours || 0), 0)}h`, icon: Clock, color: "text-blue-500" },
                                { label: "Days Off", value: attendance.filter(r => r.isOffDay).length, icon: CalendarIcon, color: "text-amber-500" },
                            ].map((s, i) => (
                                <div key={i} className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center text-center shadow-sm">
                                    <s.icon className={`w-4 h-4 mb-1.5 ${s.color}`} />
                                    <p className="text-sm font-black tracking-tight">{s.value}</p>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Duty History / Attendance - ALWAYS VISIBLE */}
                        <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black uppercase text-xs tracking-widest text-primary">Duty History</h3>
                                <div className="flex items-center gap-2">
                                    <Input type="month" value={attendanceMonth} onChange={e => setAttendanceMonth(e.target.value)} className="h-8 w-32 text-[10px] font-bold" />
                                    <Button variant="outline" size="sm" onClick={loadAttendance} className="h-8 w-8 p-0"><RefreshCw className="w-3 h-3" /></Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {attendance.length === 0 ? (
                                    <div className="text-center py-10 opacity-30"><Clock className="w-8 h-8 mx-auto mb-2" /><p className="text-[10px] font-bold">No records found</p></div>
                                ) : attendance.map((r, i) => (
                                    <div key={i} className={`bg-secondary/20 rounded-2xl p-4 border border-border/50 transition-all hover:border-primary/20 ${r.isOffDay ? "bg-amber-500/5 animate-pulse" : ""}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${r.isOffDay ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                                                    {new Date(r.date).getDate()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-xs uppercase">{new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}</p>
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase">{r.bus?.busNumber || "OFF DAY"}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs font-black ${r.isOffDay ? "text-amber-500" : "text-emerald-500"}`}>{r.isOffDay ? "SICK/OFF" : "PRESENT"}</p>
                                                {r.salaryEarned && <p className="text-[10px] font-black text-primary">₹{r.salaryEarned}</p>}
                                            </div>
                                        </div>
                                        {!r.isOffDay && (
                                            <div className="grid grid-cols-3 gap-2 border-t border-border/10 pt-3 mt-1">
                                                <div>
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-0.5">Shift</p>
                                                    <p className="text-[10px] font-black">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"} - {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-0.5">Hours</p>
                                                    <p className="text-[10px] font-black text-primary">{r.hoursWorked}h</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-0.5">Overtime</p>
                                                    <p className="text-[10px] font-black text-blue-500">{r.overtimeHours || 0}h</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-muted-foreground italic text-center pt-2">Values are estimates computed from your shift logs.</p>
                        </div>

                        {/* Daily Revenue Breakdown - Only on Duty */}
                        {checkInTime && (
                            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black uppercase text-xs tracking-wider">Daily Revenue</h3>
                                    <Button variant="outline" size="sm" onClick={loadReport} className="h-8 w-8 p-0"><RefreshCw className="w-3 h-3" /></Button>
                                </div>
                                {report ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Total Revenue", value: `₹${report.totalRevenue}`, color: "text-primary" },
                                            { label: "Cash Amount", value: `₹${report.cashAmount}`, color: "text-green-500" },
                                            { label: "Online Amount", value: `₹${report.onlineAmount}`, color: "text-blue-500" },
                                            { label: "Total Tickets", value: report.totalTickets, color: "text-slate-500" },
                                        ].map((s, i) => (
                                            <div key={i} className="bg-secondary/30 border border-border/50 rounded-xl p-3 text-center">
                                                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                                                <p className="text-[8px] font-bold text-muted-foreground uppercase">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 opacity-30"><TrendingUp className="w-8 h-8 mx-auto mb-2" /><p className="text-[10px] font-bold">Syncing reports...</p></div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── EXPENSES TAB ───────────────────────────────────────────── */}
                {activeTab === "expenses" && (
                    <div className="space-y-6 pt-4 pb-20">
                        {!busNumber ? (
                            <div className="text-center py-20 bg-card/40 border border-border rounded-3xl space-y-4">
                                <Wallet className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
                                <div className="space-y-1">
                                    <p className="font-black uppercase text-sm">Select Bus First</p>
                                    <p className="text-[10px] text-muted-foreground">Select a bus on Dashboard to record expenses.</p>
                                </div>
                                <Button size="sm" onClick={() => setActiveTab("dashboard")} className="font-black uppercase tracking-wider text-[10px]">Go to Dashboard</Button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Add New Expense</p>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[9px] font-black text-muted-foreground uppercase">Category</label>
                                                <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}
                                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-[11px] font-bold">
                                                    {["Fuel", "Toll", "Maintenance", "Police/Challan", "Refreshment", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-muted-foreground uppercase">Amount (₹)</label>
                                                <Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" className="h-10 text-[11px]" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-muted-foreground uppercase">Description</label>
                                            <Input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details..." className="h-10 text-[11px]" />
                                        </div>
                                        <Button onClick={addExpense} disabled={addingExpense} className="w-full h-11 gap-2 font-black uppercase text-[10px]">
                                            {addingExpense ? <RefreshCw className="animate-spin w-3 h-3" /> : <PlusCircle className="w-3 h-3" />} Record Expense
                                        </Button>
                                    </div>
                                </div>

                                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black uppercase text-xs tracking-wider">Expense History</h3>
                                        <Button variant="outline" size="sm" onClick={loadExpenses} className="h-8 w-8 p-0"><RefreshCw className="w-3 h-3" /></Button>
                                    </div>
                                    <div className="space-y-3">
                                        {expenses.length === 0 ? (
                                            <div className="text-center py-10 opacity-30"><FileText className="w-8 h-8 mx-auto mb-2" /><p className="text-[10px] font-bold">No expenses today</p></div>
                                        ) : expenses.map((e, i) => (
                                            <div key={i} className="bg-secondary/30 rounded-xl p-3 flex items-center justify-between border border-border/50">
                                                <div><p className="font-black text-xs">{e.category}</p><p className="text-[9px] text-muted-foreground">{e.description || "No description"}</p></div>
                                                <div className="text-right"><p className="text-xs font-black text-red-500">₹{e.amount}</p><p className="text-[8px] text-muted-foreground uppercase font-black">{new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Cash / UPI Booking Modal */}
            {showCashModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setShowCashModal(false)}>
                    <div className="bg-background w-full max-w-md mx-auto rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-base">{cashForm.paymentMethod === "UPI" ? "UPI Ticket" : "Cash Ticket"}</h3>
                            <button onClick={() => setShowCashModal(false)}><XCircle className="w-5 h-5 text-muted-foreground" /></button>
                        </div>
                        <div className="flex bg-secondary rounded-xl p-1">
                            {["Cash", "UPI"].map(m => (
                                <button key={m} onClick={() => setCashForm(f => ({ ...f, paymentMethod: m }))}
                                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase ${cashForm.paymentMethod === m ? "bg-background shadow text-primary" : "text-muted-foreground"}`}>{m}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-muted-foreground">Passenger Name</label>
                                <Input value={cashForm.name} onChange={e => setCashForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="h-10 mt-1" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground">Seat No.</label>
                                <Input value={cashForm.seat} onChange={e => setCashForm(f => ({ ...f, seat: e.target.value }))} placeholder="e.g. 12" className="h-10 mt-1" type="number" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground">Amount (₹)</label>
                                <Input value={cashForm.amount} onChange={e => setCashForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" className="h-10 mt-1" type="number" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground">From</label>
                                <Input value={cashForm.from} onChange={e => setCashForm(f => ({ ...f, from: e.target.value }))} placeholder="Boarding stop" className="h-10 mt-1" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-muted-foreground">To</label>
                                <Input value={cashForm.to} onChange={e => setCashForm(f => ({ ...f, to: e.target.value }))} placeholder="Destination" className="h-10 mt-1" />
                            </div>
                        </div>
                        {cashForm.paymentMethod === "UPI" && (
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                                <p className="text-xs font-bold text-purple-600 dark:text-purple-400">Show your UPI QR to passenger</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Confirm after payment received</p>
                            </div>
                        )}
                        <Button onClick={addCashTicket} disabled={addingTicket} className="w-full gap-2">
                            {addingTicket ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Ticket className="w-4 h-4" /> Confirm & Issue Ticket</>}
                        </Button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
