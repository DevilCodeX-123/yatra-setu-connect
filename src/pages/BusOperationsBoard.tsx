import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, Bus, Calendar, History, MapPin, Activity, Users, Clock,
    Zap, RotateCcw, UserCheck, UserX, Plus, Pencil, Trash2, Check, X,
    ChevronLeft, ChevronRight, IndianRupee, ClipboardList, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import API_BASE_URL, { api } from "@/lib/api";
import { format } from "date-fns";
import MapplsMap from "@/components/MapplsMap";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

// ─── DriverCard ───────────────────────────────────────────────────────────────
function DriverCard({ emp, busId, onUpdate }: { emp: any; busId: string; onUpdate: () => void }) {
    const [editing, setEditing] = useState(false);
    const [salary, setSalary] = useState(String(emp.perDaySalary || 0));
    const [saving, setSaving] = useState(false);

    const accept = async () => { setSaving(true); const r = await api.acceptDriver(busId, emp._id); r.success ? (toast.success("Driver accepted"), onUpdate()) : toast.error(r.message); setSaving(false); };
    const reject = async () => { setSaving(true); const r = await api.rejectDriver(busId, emp._id); r.success ? (toast.success("Driver rejected"), onUpdate()) : toast.error(r.message); setSaving(false); };
    const saveSalary = async () => { setSaving(true); const r = await api.updateBusEmployee(busId, emp._id, { perDaySalary: Number(salary) }); r.success ? (toast.success("Salary updated"), setEditing(false), onUpdate()) : toast.error(r.message); setSaving(false); };
    const remove = async () => { if (!confirm(`Remove ${emp.name}?`)) return; setSaving(true); const r = await api.removeBusEmployee(busId, emp._id); r.success ? (toast.success("Driver removed"), onUpdate()) : toast.error(r.message); setSaving(false); };

    const statusColor: Record<string, string> = { Active: "success", Pending: "warning", Rejected: "destructive" };

    return (
        <div className="portal-card rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{emp.name}</p>
                    <p className="text-[11px] text-muted-foreground">{emp.email || emp.phone || "No contact"}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Code: {emp.driverCode}</p>
                </div>
                <Badge variant={(statusColor[emp.status] as any) || "secondary"} className="text-[10px]">{emp.status}</Badge>
            </div>

            {/* Salary row */}
            <div className="flex items-center gap-2">
                {editing ? (
                    <>
                        <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} className="h-8 rounded-xl text-xs w-28" />
                        <button onClick={saveSalary} disabled={saving} className="p-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditing(false)} className="p-1.5 bg-muted rounded-lg"><X className="w-3.5 h-3.5" /></button>
                    </>
                ) : (
                    <>
                        <span className="text-xs text-muted-foreground">₹{emp.perDaySalary || 0}/day</span>
                        <button onClick={() => setEditing(true)} className="p-1 text-muted-foreground hover:text-primary"><Pencil className="w-3 h-3" /></button>
                    </>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
                {emp.status === "Pending" && (
                    <>
                        <button onClick={accept} disabled={saving}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-success/10 text-success text-[11px] font-black hover:bg-success/20">
                            <UserCheck className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button onClick={reject} disabled={saving}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-danger/10 text-danger text-[11px] font-black hover:bg-danger/20">
                            <UserX className="w-3.5 h-3.5" /> Reject
                        </button>
                    </>
                )}
                {emp.status !== "Pending" && (
                    <button onClick={remove} disabled={saving}
                        className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-muted text-muted-foreground text-[11px] font-black hover:bg-danger/10 hover:text-danger ml-auto">
                        <Trash2 className="w-3 h-3" /> Remove
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── AttendanceGrid ───────────────────────────────────────────────────────────
function AttendanceGrid({ busId, month }: { busId: string; month: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState<{ empId: string; date: string; name: string } | null>(null);
    const [modalForm, setModalForm] = useState({ present: true, hoursWorked: 8, overtimeHours: 0, notes: "" });
    const [saving, setSaving] = useState(false);

    const fetch_ = async () => {
        setLoading(true);
        try { const r = await api.getBusAttendance(busId, month); setData(r); }
        catch (e) { toast.error("Failed to load attendance"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch_(); }, [busId, month]);

    const openModal = (empId: string, name: string, date: string, day: any) => {
        setModal({ empId, date, name });
        setModalForm({ present: day?.present ?? true, hoursWorked: day?.hoursWorked ?? 8, overtimeHours: day?.overtimeHours ?? 0, notes: day?.notes ?? "" });
    };

    const markAttendance = async () => {
        if (!modal) return;
        setSaving(true);
        try {
            const r = await api.markAttendance(busId, { empId: modal.empId, date: modal.date, ...modalForm });
            if (r.success) { toast.success("Attendance marked"); setModal(null); fetch_(); }
            else toast.error(r.message || "Failed");
        } catch { toast.error("Network error"); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading attendance...</div>;
    if (!data?.employees?.length) return <div className="py-8 text-center text-sm text-muted-foreground">No active drivers for this bus.</div>;

    const days = data.daysInMonth;
    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="space-y-6">
            {/* Salary summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.employees.map((emp: any) => (
                    <div key={emp.empId} className="portal-card rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{emp.name}</p>
                            <span className="text-[10px] text-muted-foreground">₹{emp.perDaySalary}/day</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-success/10 rounded-xl p-2">
                                <p className="text-lg font-black text-success">{emp.presentDays}</p>
                                <p className="text-[9px] text-muted-foreground">Present</p>
                            </div>
                            <div className="bg-danger/10 rounded-xl p-2">
                                <p className="text-lg font-black text-danger">{emp.absentDays}</p>
                                <p className="text-[9px] text-muted-foreground">Absent</p>
                            </div>
                            <div className="bg-primary/10 rounded-xl p-2">
                                <p className="text-lg font-black text-primary">{emp.totalOvertimeHours}h</p>
                                <p className="text-[9px] text-muted-foreground">Overtime</p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">
                                Base: ₹{emp.baseSalary.toLocaleString("en-IN")} + OT: ₹{emp.overtimePay.toLocaleString("en-IN")}
                            </div>
                            <div className="text-sm font-black text-primary">₹{emp.totalDue.toLocaleString("en-IN")}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Calendar grid per driver */}
            {data.employees.map((emp: any) => (
                <div key={emp.empId} className="portal-card rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{emp.name} — Attendance Grid</p>
                        <span className="text-[11px] text-muted-foreground">{month}</span>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-7 gap-1.5">
                            {Array.from({ length: days }, (_, i) => {
                                const d = `${month}-${String(i + 1).padStart(2, "0")}`;
                                const dayData = emp.days[i];
                                const isToday = d === today;
                                const isFuture = d > today;
                                const isPast = d < today;
                                let bg = "bg-muted/30 text-muted-foreground";
                                if (dayData.present === true) bg = "bg-success/20 text-success border border-success/30";
                                else if (dayData.present === false) bg = "bg-danger/20 text-danger border border-danger/30";
                                return (
                                    <button key={i} onClick={() => !isFuture && openModal(emp.empId, emp.name, d, dayData)}
                                        className={`rounded-xl p-1.5 text-center transition-all ${bg} ${isToday ? "ring-2 ring-primary" : ""} ${isFuture ? "opacity-30 cursor-default" : "cursor-pointer hover:opacity-80"}`}>
                                        <p className="text-[10px] font-black">{i + 1}</p>
                                        {dayData.present === true && <p className="text-[7px]">P</p>}
                                        {dayData.present === false && <p className="text-[7px]">A</p>}
                                        {dayData.overtimeHours > 0 && <p className="text-[7px] text-primary">+{dayData.overtimeHours}h</p>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}

            {/* Attendance modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
                    <div className="bg-background rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="font-black text-sm text-slate-900 dark:text-white">{modal.name} — {modal.date}</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setModalForm(p => ({ ...p, present: true }))}
                                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${modalForm.present ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>
                                Present ✓
                            </button>
                            <button onClick={() => setModalForm(p => ({ ...p, present: false }))}
                                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${!modalForm.present ? "bg-danger text-white" : "bg-muted text-muted-foreground"}`}>
                                Absent ✗
                            </button>
                        </div>
                        {modalForm.present && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-black">Hours Worked</Label>
                                    <Input type="number" min={0} max={24} value={modalForm.hoursWorked}
                                        onChange={e => setModalForm(p => ({ ...p, hoursWorked: Number(e.target.value) }))}
                                        className="rounded-xl h-9 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-black">Overtime Hours</Label>
                                    <Input type="number" min={0} max={12} value={modalForm.overtimeHours}
                                        onChange={e => setModalForm(p => ({ ...p, overtimeHours: Number(e.target.value) }))}
                                        className="rounded-xl h-9 text-sm" />
                                </div>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-black">Notes (optional)</Label>
                            <Input value={modalForm.notes} onChange={e => setModalForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Any remarks..." className="rounded-xl h-9 text-sm" />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setModal(null)}>Cancel</Button>
                            <Button className="flex-1 rounded-xl" onClick={markAttendance} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── TimetablePanel ───────────────────────────────────────────────────────────
function TimetablePanel({ busId }: { busId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        api.getBusTimetable(busId)
            .then(r => setData(r))
            .catch(() => toast.error("Failed to load timetable"))
            .finally(() => setLoading(false));
    }, [busId]);

    if (loading) return <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading timetable...</div>;
    if (!data) return null;

    const historyDates = Object.keys(data.history || {}).sort((a, b) => b.localeCompare(a));
    const slots = data.slots || [];
    const activeDrivers = data.activeDrivers || [];

    return (
        <div className="space-y-6">
            {/* Scheduled slots */}
            <div className="portal-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border">
                    <p className="text-sm font-black text-slate-900 dark:text-white">Scheduled Time Slots</p>
                    <p className="text-[11px] text-muted-foreground">{data.route?.from} → {data.route?.to}</p>
                </div>
                <div className="p-4">
                    {slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No schedule configured. Enable a schedule in the Route tab.</p>
                    ) : (
                        <div className="space-y-3">
                            {slots.map((slot: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border">
                                    <div className="text-center min-w-[80px]">
                                        <p className="text-xs font-black text-primary">{slot.departure}</p>
                                        <p className="text-[10px] text-muted-foreground">→ {slot.arrival}</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{slot.from} → {slot.to}</p>
                                        <p className="text-[10px] text-muted-foreground">{slot.stops} stops</p>
                                    </div>
                                    {activeDrivers.length > 0 && (
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-muted-foreground">Drivers</p>
                                            {activeDrivers.slice(0, 2).map((d: any) => (
                                                <p key={d.id} className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{d.name}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Past rides */}
            <div className="portal-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Past Ride History</p>
                        <p className="text-[11px] text-muted-foreground">Last 60 days — {historyDates.length} dates with bookings</p>
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    {historyDates.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">No past bookings found.</p>
                    ) : (
                        historyDates.map(date => {
                            const dateData = data.history[date] || { bookings: [], driversOnDuty: [] };
                            const dateBookings = dateData.bookings;
                            const driversOnDuty = dateData.driversOnDuty;
                            const online = dateBookings.filter((b: any) => b.bookingSource === "Online").length;
                            const offline = dateBookings.filter((b: any) => b.bookingSource !== "Online").length;
                            const totalAmt = dateBookings.reduce((s: number, b: any) => s + (b.amount || 0), 0);
                            const isOpen = selectedDate === date;
                            return (
                                <div key={date} className="rounded-2xl border border-border overflow-hidden">
                                    <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-all"
                                        onClick={() => setSelectedDate(isOpen ? null : date)}>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-slate-900 dark:text-white">
                                                {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">{dateBookings.length} bookings • ₹{totalAmt.toLocaleString("en-IN")}</p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-[10px] bg-info/10 text-info px-2 py-0.5 rounded-full font-black">{online} online</span>
                                            <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded-full font-black">{offline} cash</span>
                                            <span className="text-muted-foreground text-xs">{isOpen ? "▲" : "▼"}</span>
                                        </div>
                                    </button>
                                    {isOpen && (
                                        <div className="border-t border-border divide-y divide-border">
                                            {dateBookings.map((b: any, i: number) => (
                                                <div key={i} className="px-4 py-2.5 flex items-center justify-between text-xs">
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{b.user?.name || "Guest"}</p>
                                                        <p className="text-muted-foreground">{b.from || "—"} → {b.to || "—"} • {b.passengers} pax</p>
                                                        <p className="text-[10px] font-mono text-muted-foreground">{b.pnr}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-primary">₹{b.amount}</p>
                                                        <span className={`text-[9px] mt-0.5 px-2 py-0.5 rounded-full font-black border ${
                                                            b.bookingSource === "Online" 
                                                                ? "bg-info/10 text-info border-info/20" 
                                                                : "bg-warning/10 text-warning border-warning/20"
                                                        }`}>
                                                            {b.bookingSource}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Assigned drivers on that day from history */}
                                            {driversOnDuty.length > 0 && (
                                                <div className="px-4 py-3 bg-muted/20 border-t border-border">
                                                    <p className="text-[10px] font-black text-muted-foreground mb-2 flex items-center gap-1.5 grayscale opacity-70 uppercase tracking-widest">
                                                        <Users className="w-3 h-3" /> Drivers on Duty
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {driversOnDuty.map((name: string, i: number) => (
                                                            <span key={i} className="text-[10px] bg-success/10 text-success px-3 py-1 rounded-full font-black border border-success/20">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── AddDriverForm ─────────────────────────────────────────────────────────────
function AddDriverForm({ busId, onAdded }: { busId: string; onAdded: () => void }) {
    const [form, setForm] = useState({ name: "", email: "", phone: "", perDaySalary: "" });
    const [saving, setSaving] = useState(false);
    const submit = async () => {
        if (!form.name.trim()) return toast.error("Name required");
        setSaving(true);
        const r = await api.addBusEmployee(busId, { ...form, perDaySalary: Number(form.perDaySalary) || 0 });
        if (r.employee) { toast.success("Driver added!"); setForm({ name: "", email: "", phone: "", perDaySalary: "" }); onAdded(); }
        else toast.error(r.message || "Failed");
        setSaving(false);
    };
    return (
        <div className="portal-card rounded-2xl p-4 space-y-3 border-2 border-dashed border-primary/20">
            <p className="text-xs font-black text-slate-900 dark:text-white">Add New Driver</p>
            <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Full Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl h-9 text-sm" />
                <Input placeholder="Email (optional)" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="rounded-xl h-9 text-sm" />
                <Input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="rounded-xl h-9 text-sm" />
                <Input type="number" placeholder="Per Day Salary (₹)" value={form.perDaySalary} onChange={e => setForm(p => ({ ...p, perDaySalary: e.target.value }))} className="rounded-xl h-9 text-sm" />
            </div>
            <Button onClick={submit} disabled={saving} className="w-full rounded-xl h-9 text-sm gap-2">
                <Plus className="w-4 h-4" /> {saving ? "Adding..." : "Add Driver"}
            </Button>
        </div>
    );
}

// ─── Main BusOperationsBoard ──────────────────────────────────────────────────
export default function BusOperationsBoard({ embedded = false, targetBusId = null }: { embedded?: boolean; targetBusId?: string | null }) {
    const navigate = useNavigate();

    const sidebarItems = [
        { href: "/owner", label: "Dashboard", icon: <Activity className="w-4 h-4" /> },
        { href: "/owner/buses", label: "My Buses", icon: <Bus className="w-4 h-4" /> },
        { href: "/owner/revenue", label: "Revenue", icon: <Timer className="w-4 h-4" /> },
    ];

    const [buses, setBuses] = useState<any[]>([]);
    const [selectedBusId, setSelectedBusId] = useState<string>(targetBusId || "");
    const [busData, setBusData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"live" | "future" | "history" | "manage">("live");
    const [manageTab, setManageTab] = useState<"drivers" | "attendance" | "timetable">("drivers");
    const [loading, setLoading] = useState(false);
    const [busBookings, setBusBookings] = useState<any[]>([]);
    const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [speed, setSpeed] = useState(55);
    const [employees, setEmployees] = useState<any[]>([]);

    // Attendance month
    const [attMonth, setAttMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const changeAttMonth = (dir: number) => {
        const [y, m] = attMonth.split("-").map(Number);
        const d = new Date(y, m - 1 + dir, 1);
        setAttMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    };

    useEffect(() => {
        api.getOwnerDashboard().then(res => {
            if (res.buses) {
                setBuses(res.buses);
                if (!selectedBusId && res.buses.length > 0) setSelectedBusId(res.buses[0]._id);
            }
        }).catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (!selectedBusId) return;
        setLoading(true);
        fetch(`${API_BASE_URL}/buses/by-id/${selectedBusId}`)
            .then(r => r.json())
            .then(data => {
                setBusData(data);
                if (data?.route?.stops?.length > 0) setBusLocation({ lat: data.route.stops[0].lat, lng: data.route.stops[0].lng });
            })
            .catch(() => toast.error("Failed to load bus details"))
            .finally(() => setLoading(false));
        api.getOwnerBookings?.()?.then(res => {
            if (res.success) setBusBookings(res.bookings.filter((b: any) => b.bus?._id === selectedBusId));
        }).catch(() => { });
        refreshEmployees();
    }, [selectedBusId]);

    const refreshEmployees = async () => {
        if (!selectedBusId) return;
        const r = await api.getBusEmployees(selectedBusId);
        setEmployees(r.employees || []);
    };

    // Map animation
    useEffect(() => {
        if (activeTab !== "live" || !busData?.route?.stops?.length) return;
        const pts = busData.route.stops;
        let destIdx = 1;
        if (destIdx >= pts.length) return;
        const dest = pts[destIdx];
        const interval = setInterval(() => {
            setSpeed(prev => Math.max(45, Math.min(65, prev + (Math.floor(Math.random() * 5) - 2))));
            setBusLocation(prev => {
                if (!prev) return { lat: pts[0].lat, lng: pts[0].lng };
                const step = 0.0005;
                const dLat = dest.lat - prev.lat, dLng = dest.lng - prev.lng;
                const dist = Math.sqrt(dLat * dLat + dLng * dLng);
                if (dist < step) return { lat: dest.lat, lng: dest.lng };
                return { lat: prev.lat + (dLat / dist) * step, lng: prev.lng + (dLng / dist) * step };
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [busData, activeTab]);

    const activeStops = busData?.route?.stops || [];
    const futureRoutes = busData?.futureRoutes || [];
    const routeHistory = busData?.routeHistory?.slice(0, 25) || [];
    const totalSeats = busData?.totalSeats || 40;
    const markers = activeStops.map((s: any, i: number) => ({ lat: s.lat, lon: s.lng, label: i === 0 ? `START: ${s.name}` : i === activeStops.length - 1 ? `END: ${s.name}` : s.name }));

    const pendingDrivers = employees.filter(e => e.status === "Pending");
    const activeDrivers = employees.filter(e => e.status === "Active");

    function renderManagePanel() {
        if (!selectedBusId) return null;
        return (
            <div className="space-y-5 mt-4 animate-in slide-in-from-bottom-2 fade-in">
                {/* Manage sub-tabs */}
                <div className="flex bg-muted p-1 rounded-2xl w-fit border border-border gap-1">
                    {([
                        { id: "drivers", label: `Drivers (${employees.length})`, icon: <Users className="w-3.5 h-3.5" /> },
                        { id: "attendance", label: "Attendance & Salary", icon: <ClipboardList className="w-3.5 h-3.5" /> },
                        { id: "timetable", label: "Timetable", icon: <Clock className="w-3.5 h-3.5" /> },
                    ] as { id: typeof manageTab; label: string; icon: any }[]).map(tab => (
                        <button key={tab.id} onClick={() => setManageTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black transition-all
                                ${manageTab === tab.id ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── DRIVERS sub-tab ── */}
                {manageTab === "drivers" && (
                    <div className="space-y-4">
                        {pendingDrivers.length > 0 && (
                            <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4">
                                <p className="text-xs font-black text-warning mb-3">⏳ Pending Requests ({pendingDrivers.length})</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {pendingDrivers.map(emp => (
                                        <DriverCard key={emp._id} emp={emp} busId={selectedBusId} onUpdate={refreshEmployees} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-black text-muted-foreground mb-3">Active Drivers ({activeDrivers.length})</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {activeDrivers.map(emp => (
                                    <DriverCard key={emp._id} emp={emp} busId={selectedBusId} onUpdate={refreshEmployees} />
                                ))}
                                {activeDrivers.length === 0 && !pendingDrivers.length && (
                                    <p className="text-sm text-muted-foreground col-span-2 text-center py-4">No drivers assigned yet.</p>
                                )}
                            </div>
                        </div>
                        <AddDriverForm busId={selectedBusId} onAdded={refreshEmployees} />
                    </div>
                )}

                {/* ── ATTENDANCE sub-tab ── */}
                {manageTab === "attendance" && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => changeAttMonth(-1)} className="p-1.5 rounded-xl border border-border hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="font-black text-sm min-w-[110px] text-center text-slate-900 dark:text-white">
                                {new Date(attMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                            </span>
                            <button onClick={() => changeAttMonth(+1)} className="p-1.5 rounded-xl border border-border hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                        <div className="flex gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success/30 border border-success/40" /> Present (P)</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-danger/30 border border-danger/40" /> Absent (A)</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted/50 border border-border" /> Not Marked</span>
                        </div>
                        <AttendanceGrid busId={selectedBusId} month={attMonth} />
                    </div>
                )}

                {/* ── TIMETABLE sub-tab ── */}
                {manageTab === "timetable" && <TimetablePanel busId={selectedBusId} />}
            </div>
        );
    }

    function renderContent() {
        if (!selectedBusId) return (
            <div className="p-12 text-center bg-card rounded-3xl border border-dashed border-border flex flex-col items-center">
                <Bus className="w-16 h-16 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">No Bus Selected</h3>
                <p className="text-xs font-bold text-muted-foreground">Select a bus to view its operations board.</p>
            </div>
        );
        if (loading) return (
            <div className="p-12 text-center flex items-center justify-center">
                <RotateCcw className="w-8 h-8 animate-spin text-primary opacity-50" />
            </div>
        );

        return (
            <>
                {/* Tab switcher */}
                <div className="flex flex-wrap bg-secondary p-1.5 rounded-2xl w-fit border border-border mt-4 gap-1">
                    {[
                        { id: "live", label: "Live Schedule & Track", icon: <Activity className="w-4 h-4" />, color: "bg-primary" },
                        { id: "future", label: `Future Plan (${futureRoutes.length})`, icon: <Calendar className="w-4 h-4" />, color: "bg-amber-500" },
                        { id: "history", label: "Past 25 Routes", icon: <History className="w-4 h-4" />, color: "bg-slate-700" },
                        { id: "manage", label: `Manage${pendingDrivers.length > 0 ? ` 🔴${pendingDrivers.length}` : ""}`, icon: <Users className="w-4 h-4" />, color: "bg-indigo-600" },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2
                                ${activeTab === tab.id ? `${tab.color} text-white shadow-md` : "text-muted-foreground hover:bg-black/5"}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── LIVE TAB ── */}
                {activeTab === "live" && (
                    <div className="grid lg:grid-cols-2 gap-6 mt-4 animate-in slide-in-from-bottom-2 fade-in">
                        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-card flex flex-col h-[600px]">
                            <div className="p-4 bg-secondary border-b border-border flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                                    </span>
                                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Live Tracking Feed</h3>
                                </div>
                                <div className="bg-white/80 dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900 px-3 py-1 rounded-full flex items-center gap-2 text-[10px] font-black text-emerald-700 dark:text-emerald-400 shadow-sm">
                                    <Zap className="w-3.5 h-3.5" /> SPEED: {speed} km/h
                                </div>
                            </div>
                            <div className="flex-1 relative bg-secondary/50">
                                {markers.length > 0 ? (
                                    <MapplsMap markers={markers} busLocation={busLocation} className="absolute inset-0" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs font-bold">No route plotted.</div>
                                )}
                                <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-xl border border-border p-3 rounded-2xl shadow-xl">
                                    <p className="text-[10px] font-black text-muted-foreground mb-2 opacity-70">UPCOMING TRAJECTORY</p>
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {activeStops.map((s: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 shrink-0">
                                                <div className={`w-2.5 h-2.5 rounded-full border-2 ${idx === 0 ? "bg-emerald-500 border-emerald-300" : "bg-muted border-foreground/20"}`} />
                                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[80px]" title={s.name}>{s.name}</span>
                                                {idx < activeStops.length - 1 && <div className="w-4 h-px bg-border" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-3xl p-5 shadow-card overflow-y-auto h-[600px]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-primary flex items-center gap-2">
                                    <Clock className="w-5 h-5" /> Complete Schedule
                                </h3>
                                <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border text-[10px] font-black text-muted-foreground">
                                    <Users className="w-3.5 h-3.5" /> {totalSeats} SEATS
                                </div>
                            </div>
                            {activeStops.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground font-bold text-xs bg-secondary rounded-2xl border border-dashed border-border">
                                    No active route stops found.
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-border/50 ml-4 space-y-6 pb-4">
                                    {activeStops.map((stop: any, idx: number) => {
                                        const segmentOccupants = idx < activeStops.length - 1 ? busBookings.reduce((acc, b) => {
                                            const fromIdx = activeStops.findIndex((s: any) => s.name === b.fromStop);
                                            const toIdx = activeStops.findIndex((s: any) => s.name === b.toStop);
                                            const aFrom = fromIdx !== -1 ? fromIdx : 0;
                                            const aTo = toIdx !== -1 ? toIdx : activeStops.length - 1;
                                            if (aFrom <= idx && aTo > idx) return acc + (b.passengers?.length || 1);
                                            return acc;
                                        }, 0) : 0;
                                        return (
                                            <div key={idx} className="relative pl-6">
                                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 shadow-sm ${idx === 0 ? "bg-primary border-primary-light" : idx === activeStops.length - 1 ? "bg-red-500 border-red-300" : "bg-background border-muted-foreground/30"}`} />
                                                <div className="bg-secondary/30 border border-border hover:border-primary/30 transition-colors p-4 rounded-2xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                                            {stop.name}
                                                            {idx === 0 && <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[8px] px-2 py-0.5 rounded-full">origin</span>}
                                                            {idx === activeStops.length - 1 && <span className="bg-red-500/10 text-red-600 border border-red-500/20 text-[8px] px-2 py-0.5 rounded-full">destination</span>}
                                                        </h4>
                                                        <span className="text-[10px] font-black text-muted-foreground opacity-60 uppercase">{idx === 0 ? "Departure" : idx === activeStops.length - 1 ? "Arrival" : "Transit"}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                                        <div className="bg-background rounded-xl p-2.5 border border-border">
                                                            <p className="text-[9px] font-black text-muted-foreground opacity-50 mb-0.5">TIMING</p>
                                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{stop.arrivalTime || "--:--"}</p>
                                                        </div>
                                                        <div className="bg-background rounded-xl p-2.5 border border-border flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[9px] font-black text-muted-foreground opacity-50 mb-0.5">LOAD</p>
                                                                <p className={`text-xs font-bold ${segmentOccupants > totalSeats * 0.8 ? "text-destructive" : "text-primary"}`}>
                                                                    {segmentOccupants}/{totalSeats}
                                                                </p>
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

                {/* ── FUTURE TAB ── */}
                {activeTab === "future" && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 animate-in slide-in-from-bottom-2 fade-in">
                        {futureRoutes.length === 0 ? (
                            <div className="col-span-full p-12 text-center bg-card rounded-3xl border border-dashed border-border">
                                <Calendar className="w-12 h-12 opacity-20 mx-auto mb-3" />
                                <h3 className="font-black text-slate-900 dark:text-white">No Future Trips</h3>
                                <p className="text-xs font-bold text-muted-foreground">No future routes scheduled.</p>
                            </div>
                        ) : futureRoutes.map((fr: any) => (
                            <div key={fr._id} className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-card transition-all">
                                <div className="text-xs font-black text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-4">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {format(new Date(fr.plannedDate), "MMM dd, yyyy")}
                                </div>
                                <div className="relative pl-3 border-l-2 border-dashed border-border space-y-3">
                                    <div><div className="text-[9px] font-black opacity-50">ORIGIN</div><div className="text-sm font-bold text-slate-900 dark:text-white">{fr.from}</div></div>
                                    <div><div className="text-[9px] font-black opacity-50">DESTINATION</div><div className="text-sm font-bold text-slate-900 dark:text-white">{fr.to}</div></div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                                    <span>{fr.stops?.length || 0} stops</span>
                                    <span className="text-primary">{totalSeats} seats</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── HISTORY TAB ── */}
                {activeTab === "history" && (
                    <div className="space-y-4 mt-4 animate-in slide-in-from-bottom-2 fade-in">
                        <div className="bg-secondary p-3 rounded-2xl border border-border flex items-center justify-between px-4">
                            <span className="text-xs font-bold text-muted-foreground">Past {routeHistory.length} routes</span>
                            <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black px-2 py-0.5 rounded-full">MAX: 25</span>
                        </div>
                        {routeHistory.length === 0 ? (
                            <div className="p-12 text-center bg-card rounded-3xl border border-dashed border-border">
                                <History className="w-12 h-12 opacity-20 mx-auto mb-3" />
                                <h3 className="font-black text-slate-900 dark:text-white">Clean History</h3>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...routeHistory].reverse().map((hr: any, idx: number) => (
                                    <div key={hr._id || idx} className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-card transition-all opacity-80 hover:opacity-100">
                                        <div className="flex items-center justify-between mb-3 text-[10px] font-black">
                                            <span className="text-gray-500 bg-gray-500/10 px-2.5 py-1 rounded-full">COMPLETED</span>
                                            <span className="text-muted-foreground opacity-70">{hr.savedAt ? format(new Date(hr.savedAt), "MMM dd hh:mm a") : "Legacy"}</span>
                                        </div>
                                        <div className="flex border border-border rounded-xl p-3 bg-secondary/50 items-center justify-between">
                                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate w-[45%]">{hr.from}</div>
                                            <ArrowLeft className="w-3.5 h-3.5 mx-2 rotate-180 opacity-30 shrink-0" />
                                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate w-[45%] text-right">{hr.to}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── MANAGE TAB ── */}
                {activeTab === "manage" && renderManagePanel()}
            </>
        );
    }

    const busSelector = (
        <div className="w-full md:w-[300px]">
            <Select value={selectedBusId} onValueChange={setSelectedBusId}>
                <SelectTrigger className="h-12 bg-secondary border-border rounded-xl font-black shadow-inner">
                    <SelectValue placeholder="Select a Bus..." />
                </SelectTrigger>
                <SelectContent>
                    {buses.map(b => (
                        <SelectItem key={b._id} value={b._id} className="font-bold">
                            <div className="flex items-center gap-2">
                                <Bus className="w-4 h-4 text-primary" />
                                {b.busNumber} {b.name ? `(${b.name})` : ""}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    if (embedded) {
        return (
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
                    <div>
                        <h2 className="text-xl font-black text-primary">Operations Board</h2>
                        <p className="text-xs text-muted-foreground font-bold">Live tracking, scheduling, driver management & timetable</p>
                    </div>
                    {!targetBusId && busSelector}
                </div>
                {renderContent()}
            </div>
        );
    }

    return (
        <DashboardLayout
            title={
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">Bus Operations Board</h1>
                </div>
            }
            subtitle="Manage schedules, drivers and live tracking"
            sidebarItems={sidebarItems}
        >
            <div className="max-w-6xl mx-auto space-y-6 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm">
                    <div>
                        <h2 className="text-xl font-black text-primary">Operations Board</h2>
                        <p className="text-xs text-muted-foreground font-bold">Select a bus to view complete schedule and live status</p>
                    </div>
                    {busSelector}
                </div>
                {renderContent()}
            </div>
        </DashboardLayout>
    );
}
