import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Users, Plus, Trash2, Copy, ChevronLeft, ChevronRight,
    TrendingUp, Calendar, Clock, CheckCircle2, XCircle,
    Bus, IndianRupee, Star, Download, Eye, EyeOff, RefreshCw
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Driver {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    perDaySalary: number;
    driverCode: string;
    status: 'Active' | 'Pending' | 'Rejected';
    joinedAt: string;
    busId: string;
    busNumber: string;
    busName?: string;
}

interface AttendanceDay {
    date: string;
    present: boolean;
    checkIn?: string | null;
    checkOut?: string | null;
    hoursWorked: number;
    daySalary: number;
}

interface SalaryReport {
    employee: { id: string; name: string; email?: string; perDaySalary: number; driverCode: string };
    bus: { id: string; busNumber: string; name?: string };
    month: string;
    presentDays: number;
    totalSalary: number;
    totalHours: number;
    days: AttendanceDay[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getMonthLabel = (month: string) =>
    new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const prevMonth = (m: string) => {
    const [y, mo] = m.split('-').map(Number);
    const d = new Date(y, mo - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const nextMonth = (m: string) => {
    const [y, mo] = m.split('-').map(Number);
    const d = new Date(y, mo, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ─── Add Driver Modal ─────────────────────────────────────────────────────────

function AddDriverModal({ buses, onClose, onAdded }: {
    buses: { _id: string; busNumber: string; name?: string }[];
    onClose: () => void;
    onAdded: (driver: Driver) => void;
}) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [salary, setSalary] = useState('');
    const [busId, setBusId] = useState(buses[0]?._id || '');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!name.trim()) { toast.error('Driver name is required'); return; }
        if (!busId) { toast.error('Select a bus'); return; }
        setLoading(true);
        try {
            const res = await api.addDriver(busId, { name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, perDaySalary: Number(salary) || 0 });
            if (res.success) {
                toast.success(`Driver "${name}" added! Code: ${res.driverCode}`);
                onAdded({ ...res.employee, busId, busNumber: buses.find(b => b._id === busId)?.busNumber || '', busName: buses.find(b => b._id === busId)?.name });
                onClose();
            } else {
                toast.error(res.message || 'Failed to add driver');
            }
        } catch { toast.error('Network error'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
                    <h2 className="text-base font-bold">Add New Driver</h2>
                </div>
                <Separator />

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Driver Name *</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Email (optional)</Label>
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="driver@email.com" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Phone</Label>
                            <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Per Day Salary (₹)</Label>
                            <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. 600" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Assign Bus *</Label>
                            <Select value={busId} onValueChange={setBusId}>
                                <SelectTrigger><SelectValue placeholder="Select bus" /></SelectTrigger>
                                <SelectContent>
                                    {buses.map(b => <SelectItem key={b._id} value={b._id}>{b.busNumber} {b.name ? `· ${b.name}` : ''}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400">🔑 A unique <strong>Driver Code</strong> will be auto-generated. Share it with the driver to activate their attendance tracking.</p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button onClick={submit} disabled={loading} className="flex-1">{loading ? 'Adding...' : 'Add Driver'}</Button>
                </div>
            </div>
        </div>
    );
}

// ─── Driver Code reveal box ───────────────────────────────────────────────────

function DriverCodeBadge({ code }: { code: string }) {
    const [visible, setVisible] = useState(false);
    const copy = () => { navigator.clipboard.writeText(code); toast.success('Driver code copied!'); };
    return (
        <div className="flex items-center gap-1">
            <code className={`font-mono text-xs px-2 py-0.5 rounded bg-muted border text-primary tracking-widest ${!visible ? 'blur-[3px] select-none' : ''}`}>{code}</code>
            <button onClick={() => setVisible(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
                {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button onClick={copy} className="text-muted-foreground hover:text-primary transition-colors"><Copy className="w-3 h-3" /></button>
        </div>
    );
}

// ─── Main EmployeeData Page ───────────────────────────────────────────────────

export default function EmployeeData() {
    const [employees, setEmployees] = useState<Driver[]>([]);
    const [buses, setBuses] = useState<{ _id: string; busNumber: string; name?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Report state
    const [selectedEmp, setSelectedEmp] = useState<Driver | null>(null);
    const [month, setMonth] = useState(currentMonth());
    const [report, setReport] = useState<SalaryReport | null>(null);
    const [reportLoading, setReportLoading] = useState(false);

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.getAllEmployees();
            setEmployees(res.employees || []);
            // Derive unique buses
            const busMap = new Map<string, { _id: string; busNumber: string; name?: string }>();
            (res.employees || []).forEach((e: Driver) => {
                if (!busMap.has(e.busId)) busMap.set(e.busId, { _id: e.busId, busNumber: e.busNumber, name: e.busName });
            });
            // Merge with dashboard buses
            const dashRes = await api.getOwnerDashboard?.() || {};
            (dashRes.buses || []).forEach((b: any) => {
                if (!busMap.has(b._id?.toString())) busMap.set(b._id, { _id: b._id, busNumber: b.busNumber, name: b.name });
            });
            setBuses(Array.from(busMap.values()));
        } catch { toast.error('Failed to load employees'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadEmployees(); }, [loadEmployees]);

    const loadReport = useCallback(async () => {
        if (!selectedEmp) return;
        setReportLoading(true);
        try {
            const res = await api.getSalaryReport(selectedEmp._id, month);
            if (res.error || res.message) { toast.error(res.message || 'Failed to load report'); return; }
            setReport(res);
        } catch { toast.error('Failed to load salary report'); }
        finally { setReportLoading(false); }
    }, [selectedEmp, month]);

    useEffect(() => { if (selectedEmp) loadReport(); }, [selectedEmp, month]);

    const removeDriver = async (emp: Driver) => {
        if (!confirm(`Remove ${emp.name} from bus ${emp.busNumber}?`)) return;
        try {
            const res = await api.removeDriver(emp.busId, emp._id);
            if (res.success) { toast.success('Driver removed'); setEmployees(p => p.filter(e => e._id !== emp._id)); if (selectedEmp?._id === emp._id) { setSelectedEmp(null); setReport(null); } }
            else toast.error(res.message || 'Failed');
        } catch { toast.error('Network error'); }
    };

    const markPresent = async (day: AttendanceDay) => {
        if (!selectedEmp || !report) return;
        try {
            await api.markAttendance({ employeeId: selectedEmp._id, busId: report.bus.id, date: day.date, present: !day.present });
            loadReport();
        } catch { toast.error('Failed to update attendance'); }
    };

    // ─── UI ─────────────────────────────────────────────────────────────────────

    const getStatusColor = (status: string) => {
        if (status === 'Active') return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30';
        if (status === 'Pending') return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
        return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30';
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Employee Data</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">Manage drivers, track attendance &amp; generate salary reports</p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)} className="gap-2">
                        <Plus className="w-4 h-4" /> Add Driver
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* ── Left: Driver Roster ─────────────────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Drivers ({employees.length})</h2>
                            <button onClick={loadEmployees} className="text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
                        </div>

                        {loading && <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />)}</div>}

                        {!loading && employees.length === 0 && (
                            <div className="bg-muted/30 border-2 border-dashed border-border rounded-2xl p-8 text-center">
                                <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No drivers added yet.</p>
                                <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddModal(true)}>
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add First Driver
                                </Button>
                            </div>
                        )}

                        {!loading && employees.map(emp => (
                            <div key={emp._id}
                                onClick={() => { setSelectedEmp(emp); setReport(null); }}
                                className={`rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${selectedEmp?._id === emp._id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border bg-card hover:border-primary/30'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{emp.name}</p>
                                                {emp.email && <p className="text-[10px] text-muted-foreground">{emp.email}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap mt-2">
                                            <Badge variant="outline" className={`text-[10px] ${getStatusColor(emp.status)}`}>{emp.status}</Badge>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Bus className="w-2.5 h-2.5" /> {emp.busNumber}</span>
                                            <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold flex items-center gap-0.5"><IndianRupee className="w-2.5 h-2.5" />{emp.perDaySalary}/day</span>
                                        </div>
                                        <div className="mt-2">
                                            <DriverCodeBadge code={emp.driverCode} />
                                        </div>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); removeDriver(emp); }}
                                        className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors shrink-0">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Right: Report Panel ─────────────────────────────────────────── */}
                    <div className="lg:col-span-3">
                        {!selectedEmp ? (
                            <div className="h-full min-h-64 bg-muted/20 border-2 border-dashed border-border rounded-2xl flex items-center justify-center">
                                <div className="text-center">
                                    <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-muted-foreground text-sm">Select a driver to view attendance &amp; salary report</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Driver header */}
                                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                                            {selectedEmp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold">{selectedEmp.name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedEmp.busNumber} {selectedEmp.busName ? `· ${selectedEmp.busName}` : ''}</p>
                                            <p className="text-xs text-green-600 dark:text-green-400 font-semibold">₹{selectedEmp.perDaySalary}/day</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(selectedEmp.status)}`}>{selectedEmp.status}</Badge>
                                </div>

                                {/* Month nav */}
                                <div className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-2">
                                    <button onClick={() => setMonth(prevMonth(month))} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span className="font-semibold text-sm">{getMonthLabel(month)}</span>
                                    </div>
                                    <button onClick={() => setMonth(nextMonth(month))} disabled={month >= currentMonth()} className="p-1 hover:bg-muted rounded-lg transition-colors disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                                </div>

                                {/* Summary cards */}
                                {report && !reportLoading && (
                                    <div className="grid grid-cols-3 gap-3">
                                        <SummaryCard icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} label="Present Days" value={`${report.presentDays}`} sub={`of ${report.days.length} days`} />
                                        <SummaryCard icon={<Clock className="w-4 h-4 text-blue-500" />} label="Total Hours" value={`${report.totalHours}h`} sub="worked" />
                                        <SummaryCard icon={<IndianRupee className="w-4 h-4 text-amber-500" />} label="Month Salary" value={`₹${report.totalSalary.toLocaleString('en-IN')}`} sub={`₹${report.employee.perDaySalary}/day`} highlight />
                                    </div>
                                )}

                                {reportLoading && <div className="h-24 bg-muted/40 rounded-xl animate-pulse" />}

                                {/* Attendance calendar grid */}
                                {report && !reportLoading && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> Attendance — click to toggle
                                        </p>
                                        <div className="grid grid-cols-7 gap-1.5">
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                                <div key={i} className="text-center text-[9px] font-bold text-muted-foreground pb-1">{d}</div>
                                            ))}
                                            {/* Empty offset for first day of month */}
                                            {Array.from({ length: (new Date(month + '-01').getDay() + 6) % 7 }, (_, i) => (
                                                <div key={`empty-${i}`} />
                                            ))}
                                            {report.days.map(day => {
                                                const dateNum = parseInt(day.date.split('-')[2]);
                                                const isFuture = new Date(day.date) > new Date();
                                                return (
                                                    <button key={day.date} onClick={() => !isFuture && markPresent(day)} disabled={isFuture}
                                                        title={`${day.date}${day.checkIn ? ` | In: ${formatTime(day.checkIn)}` : ''}${day.checkOut ? ` Out: ${formatTime(day.checkOut)}` : ''}${day.hoursWorked ? ` | ${day.hoursWorked}h` : ''}`}
                                                        className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center border-2 transition-all
                              ${isFuture ? 'opacity-30 cursor-not-allowed border-border text-muted-foreground' :
                                                                day.present ? 'bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-500/25' :
                                                                    'bg-muted/50 border-border text-muted-foreground/50 hover:border-red-300 hover:bg-red-500/10'}`}>
                                                        {dateNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/50 inline-block" /> Present</span>
                                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-muted border border-border inline-block" /> Absent</span>
                                        </div>
                                    </div>
                                )}

                                {/* Day-by-day breakdown table */}
                                {report && !reportLoading && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Star className="w-3 h-3" /> Day-by-Day Breakdown
                                        </p>
                                        <div className="bg-muted/20 rounded-xl overflow-hidden border border-border">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-border bg-muted/50">
                                                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Date</th>
                                                        <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Status</th>
                                                        <th className="px-3 py-2 text-center font-semibold text-muted-foreground">In</th>
                                                        <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Out</th>
                                                        <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Hrs</th>
                                                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Salary</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {report.days.filter(d => !d.present && new Date(d.date) <= new Date() ? true : d.present).map(day => (
                                                        <tr key={day.date} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                            <td className="px-3 py-1.5 text-foreground/70">
                                                                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })}
                                                            </td>
                                                            <td className="px-3 py-1.5 text-center">
                                                                {day.present
                                                                    ? <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold"><CheckCircle2 className="w-3 h-3" />P</span>
                                                                    : <span className="inline-flex items-center gap-1 text-muted-foreground/50"><XCircle className="w-3 h-3" />A</span>}
                                                            </td>
                                                            <td className="px-3 py-1.5 text-center text-muted-foreground">{formatTime(day.checkIn)}</td>
                                                            <td className="px-3 py-1.5 text-center text-muted-foreground">{formatTime(day.checkOut)}</td>
                                                            <td className="px-3 py-1.5 text-center">{day.hoursWorked > 0 ? `${day.hoursWorked}h` : '—'}</td>
                                                            <td className="px-3 py-1.5 text-right font-semibold text-green-600 dark:text-green-400">
                                                                {day.daySalary > 0 ? `₹${day.daySalary}` : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-primary/5 border-t border-border">
                                                        <td colSpan={4} className="px-3 py-2 font-bold text-foreground">Total ({report.presentDays} present days)</td>
                                                        <td className="px-3 py-2 text-center font-bold">{report.totalHours}h</td>
                                                        <td className="px-3 py-2 text-right font-bold text-green-600 dark:text-green-400 text-sm">₹{report.totalSalary.toLocaleString('en-IN')}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showAddModal && <AddDriverModal buses={buses} onClose={() => setShowAddModal(false)} onAdded={emp => { setEmployees(p => [...p, emp]); loadEmployees(); }} />}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, sub, highlight }: {
    icon: React.ReactNode; label: string; value: string; sub: string; highlight?: boolean;
}) {
    return (
        <div className={`rounded-xl p-3 border ${highlight ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20' : 'bg-card border-border'}`}>
            <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</span></div>
            <p className={`text-xl font-bold ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
        </div>
    );
}
