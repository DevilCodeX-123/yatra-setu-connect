import { useState, useEffect } from "react";
import {
  Bus, DollarSign, BarChart2, Users, Edit, Plus, Calendar, TrendingUp, Package,
  MapPin, ShieldCheck, Clock, CheckCircle2, Trash2, Copy, Lock, Phone, UserCheck,
  X, Route, PlayCircle, Power, WifiOff, Wifi, ToggleLeft, ToggleRight, Timer, RefreshCw, Repeat
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { AddBusDialog } from "@/components/AddBusDialog";

const sidebarItems = [
  { label: "Fleet Overview", icon: <Bus className="w-4 h-4" />, id: "fleet", url: "/owner" },
  { label: "Booking Records", icon: <Calendar className="w-4 h-4" />, id: "bookings", url: "/owner#bookings" },
  { label: "Earnings", icon: <DollarSign className="w-4 h-4" />, id: "earnings", url: "/owner#earnings" },
  { label: "Rent for Event", icon: <Package className="w-4 h-4" />, id: "rent", url: "/owner#rent" },
  { label: "Tracking Requests", icon: <ShieldCheck className="w-4 h-4" />, id: "tracking", url: "/owner#tracking" },
  { label: "Employees", icon: <Users className="w-4 h-4" />, id: "employees", url: "/owner#employees" },
  { label: "Feedback", icon: <Edit className="w-4 h-4" />, id: "complaints", url: "/owner#complaints" },
];

export default function OwnerPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeRoot, setActiveTab] = useState("fleet");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [ownerBookings, setOwnerBookings] = useState<any[]>([]);
  const [ownerExpenses, setOwnerExpenses] = useState<any[]>([]);
  const [routesHistory, setRoutesHistory] = useState<any[]>([]);
  const [bookingFilters, setBookingFilters] = useState({ busId: 'all', route: 'all' });
  const [rentalRequests, setRentalRequests] = useState<any[]>([]);
  const [trackingRequests, setTrackingRequests] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBus, setShowAddBus] = useState(false);

  // Driver management state
  const [selectedBusForEmp, setSelectedBusForEmp] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeCode, setEmployeeCode] = useState("");
  const [driverForm, setDriverForm] = useState({ name: "", phone: "", email: "", perDaySalary: "", driverCode: "" });
  const [addingDriver, setAddingDriver] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [newDriverCode, setNewDriverCode] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [updatingCode, setUpdatingCode] = useState(false);

  // Run on Route modal state
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedBusForRun, setSelectedBusForRun] = useState<any>(null);

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleBus, setScheduleBus] = useState<any>(null);
  const [scheduleForm, setScheduleForm] = useState({
    isScheduleActive: false,
    type: 'daily' as 'daily' | 'days' | 'specific',
    specificDates: [] as string[],
    startTime: '08:00',
    endTime: '20:00',
    loopEnabled: false,
    loopIntervalMinutes: 60,
    activeDays: [] as string[],
    notes: '',
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleRoute, setScheduleRoute] = useState({ from: '', to: '', stops: [] as any[] });

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    bus: '',
    amount: '',
    category: 'Fuel' as any,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [savingExpense, setSavingExpense] = useState(false);

  // Payroll Modal State
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedEmpForPayroll, setSelectedEmpForPayroll] = useState<any>(null);
  const [payrollReport, setPayrollReport] = useState<any>(null);
  const [payrollMonth, setPayrollMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  // Complaint Reply State
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // UPI Settings State
  const [upiId, setUpiId] = useState("");
  const [savingUPI, setSavingUPI] = useState(false);

  const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const openScheduleModal = (bus: any) => {
    setScheduleBus(bus);
    setScheduleForm({
      isScheduleActive: bus.schedule?.isScheduleActive ?? false,
      type: bus.schedule?.type || 'daily',
      specificDates: bus.schedule?.specificDates || [],
      startTime: bus.schedule?.startTime || '08:00',
      endTime: bus.schedule?.endTime || '20:00',
      loopEnabled: bus.schedule?.loopEnabled ?? false,
      loopIntervalMinutes: bus.schedule?.loopIntervalMinutes ?? 60,
      activeDays: bus.schedule?.activeDays || [],
      notes: bus.schedule?.notes || '',
    });
    setScheduleRoute({
      from: bus.route?.from || '',
      to: bus.route?.to || '',
      stops: bus.route?.stops || []
    });
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!scheduleBus) return;
    setSavingSchedule(true);
    try {
      await api.updateBusRoute(scheduleBus._id, scheduleRoute);
      const res = await api.updateBusSchedule(scheduleBus._id, scheduleForm);
      if (res.success) {
        toast.success('Schedule saved!');
        setShowScheduleModal(false);
        fetchDashboard();
      } else toast.error(res.message || 'Failed to save schedule');
    } catch { toast.error('Failed to save schedule'); }
    finally { setSavingSchedule(false); }
  };

  const handleBusStatusChange = async (busId: string, status: 'Active' | 'Inactive' | 'Temp-Offline') => {
    try {
      const res = await api.updateBusStatus(busId, status);
      if (res.success) {
        const label = status === 'Active' ? '🟢 Live' : status === 'Temp-Offline' ? '🟡 Temp-Offline' : '🔴 Offline';
        toast.success(`Bus set to ${label}`);
        fetchDashboard();
      } else toast.error(res.message || 'Status update failed');
    } catch { toast.error('Status update failed'); }
  };

  const handleToggleRental = async (busId: string, current: boolean) => {
    try {
      const res = await api.toggleRental(busId, !current);
      if (res.success) {
        toast.success(!current ? 'Rental enabled ✓' : 'Rental disabled');
        fetchDashboard();
      } else toast.error(res.message || 'Failed to update rental');
    } catch { toast.error('Failed to update rental'); }
  };

  const handleComplaintStatus = async (complaintId: string, status: string) => {
    try {
      const res = await api.updateComplaintStatus(complaintId, { status });
      if (res.success) {
        toast.success(`Complaint marked as ${status}`);
        fetchDashboard();
      } else toast.error(res.message || 'Update failed');
    } catch { toast.error('Update failed'); }
  };

  const handleSendReply = async () => {
    if (!selectedComplaint || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await api.updateComplaintStatus(selectedComplaint._id, {
        status: 'Resolved',
        response: replyText.trim()
      });
      if (res.success) {
        toast.success('Response sent and issue resolved ✓');
        setShowReplyModal(false);
        setReplyText("");
        fetchDashboard();
      } else {
        toast.error(res.message || 'Failed to send reply');
      }
    } catch {
      toast.error('Error sending reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSaveUPI = async () => {
    if (!upiId.trim()) { toast.error("Please enter a valid UPI ID"); return; }
    setSavingUPI(true);
    try {
      const res = await api.updateOwnerUPI(upiId.trim());
      if (res.success) toast.success("UPI ID updated successfully! Passengers will pay directly to this ID.");
      else toast.error(res.message || "Failed to update UPI ID");
    } catch {
      toast.error("Error saving UPI ID");
    } finally {
      setSavingUPI(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const [stats, bookingsRes, expensesRes, routesRes, rentalRes, trackingRes, complaintsRes] = await Promise.all([
        api.getOwnerDashboard(),
        api.getOwnerBookings(),
        api.getOwnerExpenses(),
        api.getRoutesHistory(),
        api.getOwnerRequests(),
        api.getOwnerTrackingRequests(),
        api.getOwnerComplaints()
      ]);

      setDashboardData(stats);
      setUpiId(stats?.upiId || "");
      setOwnerBookings(bookingsRes?.bookings || []);
      setOwnerExpenses(expensesRes?.expenses || []);
      setRoutesHistory(routesRes?.routes || []);
      setRentalRequests(rentalRes || []);
      setTrackingRequests(Array.isArray(trackingRes) ? trackingRes : trackingRes?.requests || []);
      setComplaints(Array.isArray(complaintsRes) ? complaintsRes : complaintsRes?.complaints || []);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && sidebarItems.some(i => i.id === hash)) {
      setActiveTab(hash);
    } else {
      setActiveTab("fleet");
    }
  }, [location.hash]);

  // Inline editing state: { busId, field, value }
  const [editCell, setEditCell] = useState<{ busId: string; field: string; value: string } | null>(null);
  const [editSettings, setEditSettings] = useState<string | null>(null);
  const [settingsVal, setSettingsVal] = useState({ percentage: 50, hourly: 500 });

  // Save inline bus field (name / totalSeats / pricePerKm)
  const handleSaveBusField = async (busId: string, field: string, value: string) => {
    if (!value.trim()) { setEditCell(null); return; }
    try {
      const payload: any = {};
      payload[field] = field === 'name' ? value : Number(value);
      const res = await api.updateBusInfo(busId, payload);
      if (res.success) {
        toast.success('Saved!');
        fetchDashboard();
      } else {
        toast.error(res.message || 'Save failed');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setEditCell(null);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category) return;
    setSavingExpense(true);
    try {
      const res = await api.addOwnerExpense({ ...expenseForm, amount: Number(expenseForm.amount) });
      if (res.success) {
        toast.success('Expense recorded ✓');
        setShowExpenseModal(false);
        setExpenseForm({ bus: '', amount: '', category: 'Fuel', date: new Date().toISOString().split('T')[0], description: '' });
        fetchDashboard();
      } else toast.error(res.message || 'Failed to add expense');
    } catch { toast.error('Error adding expense'); }
    finally { setSavingExpense(false); }
  };

  const handlePaySalary = async () => {
    if (!payrollReport || payrollReport.isPaid) return;
    try {
      const res = await api.payDriverSalary(payrollReport.bus.id, payrollReport.employee.id, {
        monthYear: payrollMonth,
        amount: payrollReport.totalDue,
        hours: payrollReport.totalHours,
        description: `Manual payout for ${payrollMonth}`
      });
      if (res.success) {
        toast.success(`Salary paid to ${payrollReport.employee.name} ✓`);
        loadPayroll(payrollReport.employee.id, payrollMonth);
        fetchDashboard();
      } else toast.error(res.message);
    } catch { toast.error('Payment failed'); }
  };

  const loadPayroll = async (empId: string, month: string) => {
    setLoadingPayroll(true);
    try {
      const res = await api.getSalaryReport(empId, month);
      setPayrollReport(res);
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoadingPayroll(false); }
  };

  const buses = dashboardData?.buses || [];
  const earningsData = Array.isArray(dashboardData?.monthlyEarnings) ? dashboardData.monthlyEarnings : [];
  const maxEarning = Math.max(...earningsData.map((e: any) => e.amount), 1);
  const totalRevenue = Array.isArray(ownerBookings) ? ownerBookings.reduce((sum, b) => sum + (b.amount || 0), 0) : 0;
  const totalExpenses = Array.isArray(ownerExpenses) ? ownerExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) : 0;
  const netProfit = totalRevenue - totalExpenses;
  const totalEarnings = totalRevenue; // Alias for the dashboard card

  const handleUpdateSettings = async (busId: string) => {
    try {
      await api.updateBusSettings(busId, {
        oneWayReturnChargePercentage: Number(settingsVal.percentage),
        rentalPricePerHour: Number(settingsVal.hourly)
      });
      toast.success("Settings updated successfully");
      setEditSettings(null);
      fetchDashboard();
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  const handleRequestAction = async (requestId: string, status: 'Accepted' | 'Rejected') => {
    try {
      await api.updateRequestStatus(requestId, status);
      toast.success(`Request ${status.toLowerCase()} successfully`);
      fetchDashboard();
    } catch (err) {
      toast.error("Failed to update request");
    }
  };

  const handleTrackingAction = async (requestId: string, status: 'Accepted' | 'Rejected') => {
    try {
      await api.updateTrackingRequestStatus(requestId, status);
      toast.success(`Tracking ${status.toLowerCase()} successfully`);
      fetchDashboard();
    } catch (err) {
      toast.error("Failed to update tracking request");
    }
  };

  // ── Driver Management ──────────────────────────────────────────────────────
  const loadEmployees = async (busId: string) => {
    try {
      const data = await api.getBusEmployees(busId);
      setEmployees(data.employees || []);
      setEmployeeCode(data.employeeCode || '');
      setActivationCode(data.activationCode || '');
    } catch {
      toast.error('Failed to load drivers');
    }
  };

  const handleUpdateActivationCode = async () => {
    if (!selectedBusForEmp || !activationCode.trim()) return;
    setUpdatingCode(true);
    try {
      const res = await api.updateBusActivationCode(selectedBusForEmp, activationCode.trim().toUpperCase());
      if (res.success) {
        toast.success("Activation code updated successfully!");
        setActivationCode(res.activationCode);
      } else {
        toast.error(res.message || "Failed to update code");
      }
    } catch {
      toast.error("Failed to update activation code");
    } finally {
      setUpdatingCode(true);
      setUpdatingCode(false);
    }
  };

  const handleAddDriver = async () => {
    if (!driverForm.name.trim() || !selectedBusForEmp) return;
    setAddingDriver(true);
    try {
      const res = await api.addDriver(selectedBusForEmp, {
        name: driverForm.name.trim(),
        email: driverForm.email.trim() || undefined,
        phone: driverForm.phone.trim() || undefined,
        perDaySalary: driverForm.perDaySalary ? Number(driverForm.perDaySalary) : 0,
        driverCode: driverForm.driverCode.trim() || undefined,
      });
      if (res.success) {
        setNewDriverCode(res.driverCode || '');
        toast.success(`Driver "${driverForm.name}" added! Code: ${res.driverCode}`);
        setDriverForm({ name: "", phone: "", email: "", perDaySalary: "", driverCode: "" });
        setShowDriverForm(false);
        loadEmployees(selectedBusForEmp);
      } else {
        toast.error(res.message || 'Failed to add driver');
      }
    } catch {
      toast.error('Failed to add driver');
    } finally {
      setAddingDriver(false);
    }
  };

  const handleRemoveDriver = async (empId: string) => {
    if (!selectedBusForEmp) return;
    try {
      await api.removeDriver(selectedBusForEmp, empId);
      toast.success('Driver removed');
      loadEmployees(selectedBusForEmp);
    } catch {
      toast.error('Failed to remove driver');
    }
  };

  // ── Run on Route ────────────────────────────────────────────────────────────
  const handleRunOnRoute = (bus: any) => {
    setSelectedBusForRun(bus);
    setShowRunModal(true);
  };

  const handleActivateBusOnRoute = () => {
    if (!selectedBusForRun) return;
    toast.success(`Bus ${selectedBusForRun.busNumber} is now set to run on: ${selectedBusForRun.route?.from} → ${selectedBusForRun.route?.to}`);
    setShowRunModal(false);
  };

  const currentSidebarItems = sidebarItems.map(item => ({
    ...item,
    active: activeRoot === item.id,
    href: item.url
  }));

  if (loading) {
    return (
      <DashboardLayout title="Loading Dashboard..." subtitle="Please wait" sidebarItems={currentSidebarItems}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Bus Owner Panel"
      subtitle="Manage your fleet, fares and earnings"
      sidebarItems={currentSidebarItems}
    >
      <div className="space-y-5 animate-slide-up">
        {activeRoot === "fleet" && (
          <>
            {/* ── Stats Cards (Clickable) ─────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Buses", value: dashboardData?.totalBuses ?? "—", icon: Bus, color: "primary", tab: "fleet" },
                { label: "Active Buses", value: dashboardData?.activeBuses ?? "—", icon: TrendingUp, color: "success", tab: "fleet" },
                { label: "Total Earnings", value: dashboardData ? `₹${(totalEarnings / 1000).toFixed(1)}k` : "—", icon: DollarSign, color: "info", tab: "earnings" },
                { label: "Total Bookings", value: dashboardData?.totalBookings ?? "—", icon: Users, color: "warning", tab: "bookings" },
              ].map(s => (
                <button
                  key={s.label}
                  onClick={() => { setActiveTab(s.tab); navigate(`/owner#${s.tab}`); }}
                  className="portal-card p-4 text-left w-full transition-all hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <s.icon className="w-4 h-4" style={{ color: `hsl(var(--${s.color}))` }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: `hsl(var(--${s.color}))` }}>{s.value}</p>
                </button>
              ))}
            </div>

            {/* ── DB not connected warning ────────────────────────────────── */}
            {!dashboardData && !loading && (
              <div className="portal-card p-5 border-l-4 border-warning text-warning text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                Database not connected — only live data is shown. Please ensure the backend server is running.
              </div>
            )}

            {/* ── Fleet Table ─────────────────────────────────────────────── */}
            <div className="portal-card overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between border-border">
                <div>
                  <h3 className="font-bold text-sm text-primary">Registered Fleet</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Click <Edit className="w-2.5 h-2.5 inline" /> to edit — changes save to database instantly</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowAddBus(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Bus
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      {["Bus Number", "Name", "Route", "Seats", "Fare (₹/km)", "Rental Settings", "Controls", "Rental", "Actions"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {buses.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground opacity-40 text-sm italic">
                          {loading ? "Loading..." : "No buses registered yet. Click + Add Bus to get started."}
                        </td>
                      </tr>
                    )}
                    {buses.map((bus: any) => (
                      <tr key={bus._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        {/* Bus Number */}
                        <td className="px-4 py-3 font-mono font-bold text-xs text-primary whitespace-nowrap">{bus.busNumber}</td>

                        {/* Name — inline editable */}
                        <td className="px-4 py-3 min-w-[130px]">
                          {editCell?.busId === bus._id && editCell.field === 'name' ? (
                            <div className="flex gap-1">
                              <Input
                                autoFocus
                                className="h-7 text-xs w-32"
                                value={editCell.value}
                                onChange={e => setEditCell({ ...editCell, value: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveBusField(bus._id, 'name', editCell.value);
                                  if (e.key === 'Escape') setEditCell(null);
                                }}
                              />
                              <Button size="sm" className="h-7 px-2 text-xs bg-success text-white"
                                onClick={() => handleSaveBusField(bus._id, 'name', editCell.value)}>✓</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group">
                              <span className={bus.name ? '' : 'text-muted-foreground italic opacity-40 text-xs'}>
                                {bus.name || 'No Name'}
                              </span>
                              <button
                                onClick={() => setEditCell({ busId: bus._id, field: 'name', value: bus.name || '' })}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/10">
                                <Edit className="w-3 h-3 text-primary" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Route — shows from→to, click to edit */}
                        <td className="px-4 py-3 text-xs min-w-[140px]">
                          {bus.route?.from ? (
                            <div className="flex items-center gap-1.5 group">
                              <span className="font-medium text-foreground">{bus.route.from} → {bus.route.to}</span>
                              <button
                                onClick={() => navigate(`/owner/route-selection?busNumber=${bus._id}`)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/10">
                                <Edit className="w-3 h-3 text-primary" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => navigate(`/owner/route-selection?busNumber=${bus._id}`)}
                              className="text-primary text-xs underline-offset-2 hover:underline opacity-60 hover:opacity-100 italic">
                              + Set Route
                            </button>
                          )}
                        </td>

                        {/* Seats — inline editable */}
                        <td className="px-4 py-3">
                          {editCell?.busId === bus._id && editCell.field === 'totalSeats' ? (
                            <div className="flex gap-1">
                              <Input
                                autoFocus type="number"
                                className="h-7 text-xs w-16"
                                value={editCell.value}
                                onChange={e => setEditCell({ ...editCell, value: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveBusField(bus._id, 'totalSeats', editCell.value);
                                  if (e.key === 'Escape') setEditCell(null);
                                }}
                              />
                              <Button size="sm" className="h-7 px-2 text-xs bg-success text-white"
                                onClick={() => handleSaveBusField(bus._id, 'totalSeats', editCell.value)}>✓</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group">
                              <span className={bus.totalSeats ? 'font-medium' : 'text-muted-foreground opacity-40 text-xs italic'}>
                                {bus.totalSeats || '—'}
                              </span>
                              <button
                                onClick={() => setEditCell({ busId: bus._id, field: 'totalSeats', value: String(bus.totalSeats || '') })}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/10">
                                <Edit className="w-3 h-3 text-primary" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Fare — inline editable */}
                        <td className="px-4 py-3">
                          {editCell?.busId === bus._id && editCell.field === 'pricePerKm' ? (
                            <div className="flex gap-1">
                              <Input
                                autoFocus type="number"
                                className="h-7 text-xs w-20"
                                value={editCell.value}
                                onChange={e => setEditCell({ ...editCell, value: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveBusField(bus._id, 'pricePerKm', editCell.value);
                                  if (e.key === 'Escape') setEditCell(null);
                                }}
                              />
                              <Button size="sm" className="h-7 px-2 text-xs bg-success text-white"
                                onClick={() => handleSaveBusField(bus._id, 'pricePerKm', editCell.value)}>✓</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group">
                              <span className="font-medium">₹{bus.pricePerKm ?? '—'}</span>
                              <button
                                onClick={() => setEditCell({ busId: bus._id, field: 'pricePerKm', value: String(bus.pricePerKm || '') })}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/10">
                                <Edit className="w-3 h-3 text-primary" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Rental Settings */}
                        <td className="px-4 py-3">
                          {editSettings === bus._id ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] font-black opacity-40">Return:</span>
                                <input type="number" className="w-12 h-6 text-[10px] bg-secondary border border-border rounded px-1"
                                  value={settingsVal.percentage} onChange={e => setSettingsVal({ ...settingsVal, percentage: Number(e.target.value) })} />
                                <span className="text-[8px] font-black opacity-40">%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] font-black opacity-40">Hr Rate:</span>
                                <input type="number" className="w-12 h-6 text-[10px] bg-secondary border border-border rounded px-1"
                                  value={settingsVal.hourly} onChange={e => setSettingsVal({ ...settingsVal, hourly: Number(e.target.value) })} />
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" onClick={() => setEditSettings(null)} className="h-5 px-1.5 text-[8px]">✕</Button>
                                <Button onClick={() => handleUpdateSettings(bus._id)} className="h-5 px-1.5 text-[8px]">Save</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[9px] font-black text-accent flex flex-col cursor-pointer hover:opacity-70 group"
                              onClick={() => { setEditSettings(bus._id); setSettingsVal({ percentage: bus.oneWayReturnChargePercentage || 50, hourly: bus.rentalPricePerHour || 500 }); }}>
                              <span>Return: {bus.oneWayReturnChargePercentage || 50}%</span>
                              <span>Rate: ₹{bus.rentalPricePerHour || 500}/h</span>
                              <span className="opacity-0 group-hover:opacity-60 text-[8px] text-primary font-normal">click to edit</span>
                            </div>
                          )}
                        </td>

                        {/* ── Controls: Live / Temp-Off / Off ── */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1 min-w-[100px]">
                            <button
                              onClick={() => handleBusStatusChange(bus._id, 'Active')}
                              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all ${bus.status === 'Active'
                                ? 'bg-success/15 border-success text-success shadow-sm'
                                : 'border-muted opacity-40 hover:opacity-80'}`}>
                              <Wifi className="w-2.5 h-2.5" /> Live
                            </button>
                            <button
                              onClick={() => handleBusStatusChange(bus._id, 'Temp-Offline')}
                              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all ${bus.status === 'Temp-Offline'
                                ? 'bg-warning/15 border-warning text-warning shadow-sm'
                                : 'border-muted opacity-40 hover:opacity-80'}`}>
                              <WifiOff className="w-2.5 h-2.5" /> Temp-Off
                            </button>
                            <button
                              onClick={() => handleBusStatusChange(bus._id, 'Inactive')}
                              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-all ${bus.status === 'Inactive'
                                ? 'bg-destructive/15 border-destructive text-destructive shadow-sm'
                                : 'border-muted opacity-40 hover:opacity-80'}`}>
                              <Power className="w-2.5 h-2.5" /> Off
                            </button>
                          </div>
                        </td>

                        {/* ── Rental Toggle ── */}
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleToggleRental(bus._id, bus.isRentalEnabled ?? true)}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-[10px] font-bold transition-all ${(bus.isRentalEnabled ?? true)
                              ? 'bg-success/10 border-success text-success'
                              : 'bg-muted border-border text-muted-foreground opacity-50'}`}>
                            {(bus.isRentalEnabled ?? true)
                              ? <><ToggleRight className="w-3.5 h-3.5" /> ON</>
                              : <><ToggleLeft className="w-3.5 h-3.5" /> OFF</>}
                          </button>
                        </td>

                        {/* ── Actions ── */}
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                              onClick={() => navigate(`/owner/route-selection?busNumber=${bus._id}`)}>
                              <MapPin className="w-3 h-3 mr-1" /> Route
                            </Button>
                            {bus.route?.from && (
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-success border-success/40 hover:bg-success/10"
                                onClick={() => handleRunOnRoute(bus)}>
                                <PlayCircle className="w-3 h-3 mr-1" /> Run
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-info border-info/40 hover:bg-info/10"
                              onClick={() => openScheduleModal(bus)}>
                              <Timer className="w-3 h-3 mr-1" />
                              {bus.schedule?.isScheduleActive ? 'Sched ✓' : 'Schedule'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Schedule Modal ──────────────────────────────────────────────── */}
            {showScheduleModal && scheduleBus && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
                  <div className="flex items-center justify-between p-6 pb-2 border-b border-border/50 shrink-0">
                    <div>
                      <h2 className="text-base font-bold flex items-center gap-2">
                        <Timer className="w-4 h-4 text-info" />
                        Route Schedule — {scheduleBus.busNumber}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{scheduleBus.name} · {scheduleBus.route?.from || '?'} → {scheduleBus.route?.to || '?'}</p>
                    </div>
                    <button onClick={() => setShowScheduleModal(false)} className="p-1.5 hover:bg-muted rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-4 flex-1">

                    {/* Enable schedule toggle */}
                    <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 border border-border">
                      <div>
                        <p className="text-sm font-semibold">Activate Schedule</p>
                        <p className="text-[10px] text-muted-foreground">Bus shows at start point until start time, then goes live</p>
                      </div>
                      <button
                        onClick={() => setScheduleForm(f => ({ ...f, isScheduleActive: !f.isScheduleActive }))}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-all ${scheduleForm.isScheduleActive
                          ? 'bg-success/10 border-success text-success'
                          : 'bg-muted border-border text-muted-foreground'}`}>
                        {scheduleForm.isScheduleActive ? <><ToggleRight className="w-4 h-4" /> Active</> : <><ToggleLeft className="w-4 h-4" /> Disabled</>}
                      </button>
                    </div>

                    {/* Route & Stops */}
                    <div className="rounded-xl bg-muted/30 p-3 border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold flex items-center gap-1.5"><Route className="w-4 h-4 text-primary" /> Route Path</p>
                        {routesHistory?.length > 0 && (
                          <select
                            className="h-7 text-[10px] px-2 rounded border border-border bg-background cursor-pointer font-bold text-primary ring-primary/20 focus:ring-2 outline-none"
                            onChange={(e) => {
                              if (!e.target.value) return;
                              try {
                                const route = JSON.parse(e.target.value);
                                setScheduleRoute({
                                  from: route.from || '',
                                  to: route.to || '',
                                  stops: (route.stops || []).map((s: any) => ({
                                    name: s.name,
                                    arrivalTime: s.arrivalTime || s.estimatedArrivalTime || '',
                                    price: s.price || s.priceFromPreviousStop || 0,
                                    distance: s.distance || 0, lat: s.lat || 0, lng: s.lng || 0
                                  }))
                                });
                                toast.success('Route config loaded!');
                              } catch (err) { console.error(err); }
                              e.target.value = '';
                            }}>
                            <option value="">📂 Choose from Saved Routes...</option>
                            {routesHistory.map((r: any, idx: number) => (
                              <option key={idx} value={JSON.stringify(r)}>{r.from} → {r.to} ({r.stops?.length || 0} stops)</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Input className="h-8 text-xs flex-1" placeholder="From (e.g. Pune)" value={scheduleRoute.from} onChange={e => setScheduleRoute(r => ({ ...r, from: e.target.value }))} />
                        <Input className="h-8 text-xs flex-1" placeholder="To (e.g. Mumbai)" value={scheduleRoute.to} onChange={e => setScheduleRoute(r => ({ ...r, to: e.target.value }))} />
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {scheduleRoute.stops.map((stop, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-5 flex justify-center"><div className="w-2 h-2 rounded-full bg-primary/40 border border-primary"></div></div>
                            <Input className="h-7 text-xs flex-1" placeholder="Stop Name" value={stop.name || ''} onChange={e => {
                              const newStops = [...scheduleRoute.stops];
                              newStops[i].name = e.target.value;
                              setScheduleRoute(r => ({ ...r, stops: newStops }));
                            }} />
                            <Input className="h-7 text-xs w-20" type="time" placeholder="Arrival" value={stop.arrivalTime || ''} onChange={e => {
                              const newStops = [...scheduleRoute.stops];
                              newStops[i].arrivalTime = e.target.value;
                              setScheduleRoute(r => ({ ...r, stops: newStops }));
                            }} />
                            <Input className="h-7 text-xs w-16" type="number" placeholder="₹" value={stop.price || ''} onChange={e => {
                              const newStops = [...scheduleRoute.stops];
                              newStops[i].price = e.target.value;
                              setScheduleRoute(r => ({ ...r, stops: newStops }));
                            }} />
                            <button onClick={() => {
                              setScheduleRoute(r => ({ ...r, stops: r.stops.filter((_, idx) => idx !== i) }));
                            }} className="text-muted-foreground hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] text-primary hover:bg-primary/10 w-full border border-dashed border-primary/30" onClick={() => {
                          setScheduleRoute(r => ({ ...r, stops: [...r.stops, { name: '', arrivalTime: '', price: 0, distance: 0, lat: 0, lng: 0 }] }));
                        }}>+ Add Stop</Button>
                      </div>
                    </div>

                    {/* Time range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start Time</label>
                        <Input type="time" className="text-sm" value={scheduleForm.startTime}
                          onChange={e => setScheduleForm(f => ({ ...f, startTime: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">End Time</label>
                        <Input type="time" className="text-sm" value={scheduleForm.endTime}
                          onChange={e => setScheduleForm(f => ({ ...f, endTime: e.target.value }))} />
                      </div>
                    </div>

                    {/* Schedule Timing */}
                    <div className="bg-muted/40 rounded-xl p-3 space-y-3 border border-border">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">Schedule Timing</span>
                        <div className="flex items-center gap-1.5 ml-auto">
                          {(['daily', 'days', 'specific'] as const).map(t => (
                            <button key={t} onClick={() => setScheduleForm(f => ({ ...f, type: t as any }))}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${scheduleForm.type === t ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background border border-border text-muted-foreground hover:bg-muted'}`}>
                              {t === 'daily' ? '🔁 Daily' : t === 'days' ? '📅 Days' : '📆 Dates'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Days Selection */}
                      {scheduleForm.type === 'days' && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Select Days</label>
                          <div className="flex gap-2 flex-wrap">
                            {ALL_DAYS.map(day => (
                              <button key={day} onClick={() => setScheduleForm(f => ({
                                ...f, activeDays: f.activeDays.includes(day) ? f.activeDays.filter(d => d !== day) : [...f.activeDays, day]
                              }))}
                                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all shadow-sm ${scheduleForm.activeDays.includes(day) ? 'bg-primary text-primary-foreground border-primary scale-105 ring-2 ring-primary/20' : 'bg-background border border-border text-muted-foreground hover:border-primary/40 hover:bg-muted'}`}>
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dates Selection */}
                      {scheduleForm.type === 'specific' && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Select Dates</label>
                          <div className="flex flex-col sm:flex-row gap-3 items-start">
                            <div className="relative">
                              <Input type="date" min={new Date().toISOString().split('T')[0]}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val && !scheduleForm.specificDates.includes(val)) {
                                    setScheduleForm(f => ({ ...f, specificDates: [...f.specificDates, val].sort() }));
                                  }
                                  e.target.value = '';
                                }}
                                className="h-10 text-sm w-44 bg-background border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" />
                            </div>
                            <div className="flex flex-wrap gap-2 flex-1 items-center bg-background/50 p-2 rounded-lg border border-border/50 min-h-[40px]">
                              {scheduleForm.specificDates.length === 0 && <p className="text-[10px] text-muted-foreground italic">No dates chosen.</p>}
                              {scheduleForm.specificDates.map(d => (
                                <Badge key={d} variant="default" className="text-xs py-1 px-2.5 gap-1.5 cursor-pointer bg-primary/15 text-primary hover:bg-red-500/15 hover:text-red-500 hover:border-red-500/30 transition-all border border-primary/20 group"
                                  onClick={() => setScheduleForm(f => ({ ...f, specificDates: f.specificDates.filter(x => x !== d) }))}>
                                  {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Loop */}
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 border border-border">
                      <div className="flex-1">
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          <Repeat className="w-3.5 h-3.5 text-accent" /> Loop Route
                        </p>
                        <p className="text-[10px] text-muted-foreground">Repeat route automatically every N minutes</p>
                      </div>
                      <button
                        onClick={() => setScheduleForm(f => ({ ...f, loopEnabled: !f.loopEnabled }))}
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border transition-all ${scheduleForm.loopEnabled
                          ? 'bg-accent/10 border-accent text-accent'
                          : 'bg-muted border-border text-muted-foreground'}`}>
                        {scheduleForm.loopEnabled ? <><ToggleRight className="w-4 h-4" /> On</> : <><ToggleLeft className="w-4 h-4" /> Off</>}
                      </button>
                    </div>

                    {scheduleForm.loopEnabled && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Loop Every</label>
                        <Input type="number" min={15} max={480} className="w-24 text-sm"
                          value={scheduleForm.loopIntervalMinutes}
                          onChange={e => setScheduleForm(f => ({ ...f, loopIntervalMinutes: Number(e.target.value) }))} />
                        <span className="text-xs text-muted-foreground">minutes</span>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Notes (optional)</label>
                      <Input placeholder="e.g. Runs every hour, daily service" className="text-sm"
                        value={scheduleForm.notes}
                        onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))} />
                    </div>

                    {/* Info box */}
                    {scheduleForm.isScheduleActive && (
                      <div className="rounded-xl bg-info/5 border border-info/20 p-3 text-xs text-info flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>Before <strong>{scheduleForm.startTime}</strong>, bus location will be pinned at the starting stop (<strong>{scheduleBus.route?.stops?.[0]?.name || scheduleBus.route?.from || 'Route Start'}</strong>). After end time, bus goes Temp-Offline automatically.</span>
                      </div>
                    )}

                  </div>

                  <div className="p-6 pt-2 border-t border-border/50 shrink-0 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
                    <Button className="flex-1 bg-primary" onClick={handleSaveSchedule} disabled={savingSchedule}>
                      {savingSchedule ? 'Saving...' : 'Save Schedule'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}


        {activeRoot === "earnings" && (
          <div className="space-y-6">
            {/* Top Cards: Profit & Loss */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="portal-card p-5 border-l-4 border-success">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-success/10 rounded-lg"><TrendingUp className="w-4 h-4 text-success" /></div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Revenue</p>
                </div>
                <p className="text-2xl font-black text-primary">₹{(totalRevenue).toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground mt-1">From all ticket bookings</p>
              </div>

              <div className="portal-card p-5 border-l-4 border-destructive">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg"><Package className="w-4 h-4 text-destructive" /></div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Expenses</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-primary" onClick={() => setShowExpenseModal(true)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-2xl font-black text-primary">₹{(totalExpenses).toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground mt-1">Petrol, Toll, Salaries, etc.</p>
              </div>

              <div className={`portal-card p-5 border-l-4 ${netProfit >= 0 ? 'border-primary' : 'border-warning'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg"><DollarSign className="w-4 h-4 text-primary" /></div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Net Profit/Loss</p>
                </div>
                <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {netProfit < 0 && '-'}₹{Math.abs(netProfit).toLocaleString()}
                </p>
                <p className="text-[9px] text-muted-foreground mt-1">Revenue - Expenses</p>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="portal-card p-6 border-l-4 border-indigo-500 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-primary mb-1">Direct Passenger Payments (UPI)</h3>
                  <p className="text-xs font-black text-muted-foreground opacity-60 mb-4">Set your UPI ID here. Passengers will scan the generated QR code to pay their ticket or rental fare directly to your bank account.</p>

                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="e.g. yourname@ybl or 9876543210@paytm"
                      className="max-w-xs font-mono text-sm border-indigo-200 dark:border-indigo-800"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                    />
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      onClick={handleSaveUPI}
                      disabled={savingUPI}
                    >
                      {savingUPI ? "Saving..." : "Save UPI ID"}
                      {!savingUPI && <CheckCircle2 className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earnings Table */}
              <div className="portal-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <h3 className="font-bold text-xs text-primary uppercase tracking-wider">Recent Earnings</h3>
                  <Badge variant="outline" className="text-[9px] bg-success/5 text-success border-success/20">LIVE TICKETS</Badge>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-card border-b border-border">
                      <tr className="text-muted-foreground font-black uppercase">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Bus</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ownerBookings.slice(0, 10).map((b: any) => (
                        <tr key={b._id} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 opacity-70">{format(new Date(b.createdAt), 'dd MMM')}</td>
                          <td className="px-4 py-2.5 font-bold text-primary">{b.bus?.busNumber}</td>
                          <td className="px-4 py-2.5 text-right font-black text-success">₹{b.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expenses Table */}
              <div className="portal-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <h3 className="font-bold text-xs text-primary uppercase tracking-wider">Recent Expenses</h3>
                  <Button size="sm" variant="outline" className="h-6 text-[9px] font-black gap-1" onClick={() => setShowExpenseModal(true)}>
                    <Plus className="w-3 h-3" /> ADD NEW
                  </Button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-card border-b border-border">
                      <tr className="text-muted-foreground font-black uppercase">
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ownerExpenses.length === 0 ? (
                        <tr><td colSpan={3} className="p-8 text-center text-muted-foreground italic">No expenses recorded yet.</td></tr>
                      ) : (
                        ownerExpenses.slice(0, 10).map((e: any) => (
                          <tr key={e._id} className="hover:bg-muted/30">
                            <td className="px-4 py-2.5 opacity-70">{format(new Date(e.date), 'dd MMM')}</td>
                            <td className="px-4 py-2.5 font-bold">
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${e.category === 'Fuel' ? 'bg-orange-500/10 text-orange-600 border-orange-200' :
                                e.category === 'Salary' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                                  'bg-secondary text-foreground'
                                }`}>{e.category}</Badge>
                            </td>
                            <td className="px-4 py-2.5 text-right font-black text-destructive">₹{e.amount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Driver Payroll Management Section */}
            <div className="portal-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-primary/5">
                <div>
                  <h3 className="font-black text-sm text-primary">Driver Payroll & Performance</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Calculate salary based on attendance and overtime</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="month"
                    className="h-8 text-xs w-32"
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-xs font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Driver Name</th>
                      <th className="px-4 py-3">Monthly Attendance</th>
                      <th className="px-4 py-3">Hours Worked</th>
                      <th className="px-4 py-3 text-right">Estimated Payout</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {/* List all employees from dashboard buses */}
                    {buses.flatMap((b: any) => (b.employees || []).map((emp: any) => ({ ...emp, busNo: b.busNumber, busId: b._id }))).map((emp: any) => (
                      <tr key={emp._id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-bold text-primary">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">Bus: {emp.busNo}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] gap-1 font-black">
                            <Calendar className="w-3 h-3" /> Check Report
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">--</td>
                        <td className="px-4 py-3 text-right font-black text-primary">₹{emp.perDaySalary || 0} /day</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-[10px] font-black uppercase tracking-widest"
                            onClick={() => {
                              setSelectedEmpForPayroll(emp);
                              loadPayroll(emp._id, payrollMonth);
                              setShowPayrollModal(true);
                            }}
                          >
                            Generate Slip
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Chart Overview (Simplified) */}
            <div className="portal-card p-5">
              <h3 className="font-black text-sm mb-4 text-primary">Monthly Revenue Trend</h3>
              <div className="flex items-end gap-3 h-32">
                {earningsData.map((e: any) => (
                  <div key={e.month} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[9px] font-black text-primary">₹{(e.amount / 1000).toFixed(1)}k</p>
                    <div className="w-full rounded-t-lg transition-all bg-primary/20 hover:bg-primary"
                      style={{ height: `${(e.amount / maxEarning) * 88}px` }} />
                    <p className="text-[10px] font-black text-muted-foreground">{e.month}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeRoot === "rent" && (
          <div className="space-y-6">
            <div className="portal-card p-5 border-l-4 border-accent">
              <h3 className="font-bold text-sm mb-2 text-primary">
                <Package className="w-4 h-4 inline mr-2 text-accent" />
                Rental Summary
              </h3>
              <p className="text-xs mb-3 text-muted-foreground">
                Manage inquiries for full bus rentals for events and trips.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-accent/5 rounded-xl border border-accent/10">
                  <p className="text-[10px] font-black text-accent uppercase opacity-60">Pending Requests</p>
                  <p className="text-xl font-black text-primary">{rentalRequests.filter(r => r.status === 'PendingOwner').length}</p>
                </div>
                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-600 uppercase opacity-60">Confirmed Rentals</p>
                  <p className="text-xl font-black text-primary">{rentalRequests.filter(r => r.status === 'Confirmed').length}</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-[10px] font-black text-primary uppercase opacity-60">Total Value</p>
                  <p className="text-xl font-black text-primary">₹{(rentalRequests.reduce((acc, r) => acc + (r.amount || 0), 0) || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="portal-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-sm text-primary">Active Rental Inquiries</h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                  {rentalRequests.length} Total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Customer</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Bus / Destination</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Details</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Amount</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Status</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentalRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground opacity-40 font-black">No rental requests found</td>
                      </tr>
                    ) : (
                      rentalRequests.map((req: any) => (
                        <tr key={req._id} className="border-b border-border hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-primary">{req.user?.name || "Guest User"}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">{req.user?.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black">{req.bus?.busNumber}</span>
                              <span className="text-[10px] font-black text-accent uppercase">{req.rentalDetails?.fromLocation || 'Pickup'} → {req.rentalDetails?.destination}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(req.rentalDetails?.startDate), 'dd MMM yyyy')} @ {req.rentalDetails?.startTime || '09:00'}
                                <span className="ml-1 px-1.5 py-0.5 bg-accent/10 text-accent rounded uppercase text-[8px]">
                                  {req.rentalDetails?.isRoundTrip ? 'Round' : 'One-Way'}
                                </span>
                              </div>
                              <div className="text-[9px] font-bold text-muted-foreground line-clamp-1 italic">
                                "{req.rentalDetails?.purpose}"
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-primary">₹{req.amount}</span>
                              <span className="text-[8px] font-bold text-muted-foreground italic">
                                ({req.rentalDetails?.hoursRequested || 24}h @ ₹{((req.amount || 0) - (req.rentalDetails?.calculatedFuelCost || 0)).toLocaleString()} + Petrol: ₹{(req.rentalDetails?.calculatedFuelCost || 0).toLocaleString()}
                                for {req.rentalDetails?.totalFuelKm || (req.rentalDetails?.isRoundTrip ? req.rentalDetails?.estimatedKm * 2 : req.rentalDetails?.estimatedKm * 1.5)} KM total)
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${req.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-600' :
                              req.status === 'Accepted' ? 'bg-blue-500/10 text-blue-600' :
                                req.status === 'Rejected' ? 'bg-red-500/10 text-red-600' :
                                  'bg-amber-500/10 text-amber-600'
                              }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {req.status === 'PendingOwner' ? (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" className="h-8 text-[10px] font-black border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleRequestAction(req._id, 'Rejected')}>
                                  Reject
                                </Button>
                                <Button size="sm" className="h-8 text-[10px] font-black bg-emerald-600 hover:bg-emerald-700" onClick={() => handleRequestAction(req._id, 'Accepted')}>
                                  Accept
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[9px] font-black text-muted-foreground opacity-40 uppercase">Handled</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeRoot === "complaints" && (
          <div className="space-y-6">
            <div className="portal-card p-5 border-l-4 border-amber-500">
              <h3 className="font-bold text-sm mb-2 text-primary">
                <Edit className="w-4 h-4 inline mr-2 text-amber-500" />
                Passenger Feedback
              </h3>
              <p className="text-xs mb-3 text-muted-foreground">
                View feedback from your passengers. Resolve complaints to maintain high service ratings.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                  <p className="text-[10px] font-black text-red-600 uppercase opacity-60">Pending Complaints</p>
                  <p className="text-xl font-black text-red-600">{complaints.filter(c => c.status === 'Pending' && c.type === 'Complaint').length}</p>
                </div>
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                  <p className="text-[10px] font-black text-amber-600 uppercase opacity-60">New Suggestions</p>
                  <p className="text-xl font-black text-amber-600">{complaints.filter(c => c.type === 'Suggestion').length}</p>
                </div>
                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-600 uppercase opacity-60">Resolved</p>
                  <p className="text-xl font-black text-emerald-600">{complaints.filter(c => c.status === 'Resolved').length}</p>
                </div>
              </div>
            </div>

            <div className="portal-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-sm text-primary">Passenger Feedback</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">User / Bus</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Type / Category</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Description</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Status</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!Array.isArray(complaints) || complaints.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground opacity-40 font-black">No feedback received yet</td>
                      </tr>
                    ) : (
                      complaints.map((comp: any) => (
                        <tr key={comp._id} className="border-b border-border hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-primary">{comp.userName || comp.user?.name || "Anonymous"}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">Bus: {comp.bus?.busNumber}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className={`text-[8px] font-black uppercase py-0 ${comp.type === 'Complaint' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                {comp.type}
                              </Badge>
                              <span className="text-[10px] font-black text-accent">{comp.category}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 max-w-[300px]">
                            <p className="text-xs font-medium text-muted-foreground line-clamp-2 italic">"{comp.description}"</p>
                            <span className="text-[9px] font-bold opacity-30">{format(new Date(comp.createdAt), 'dd MMM, hh:mm a')}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${comp.status === 'Resolved' ? 'bg-success/10 text-success' :
                              comp.status === 'Reviewed' ? 'bg-blue-500/10 text-blue-600' :
                                'bg-amber-500/10 text-amber-600'
                              }`}>
                              {comp.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {comp.status !== 'Resolved' ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-[10px] font-black border-primary text-primary hover:bg-primary/5"
                                  onClick={() => {
                                    setSelectedComplaint(comp);
                                    setReplyText(comp.response || "");
                                    setShowReplyModal(true);
                                  }}
                                >
                                  Reply
                                </Button>
                                {comp.status === 'Pending' && (
                                  <Button size="sm" variant="outline" className="h-8 text-[10px] font-black" onClick={() => handleComplaintStatus(comp._id, 'Reviewed')}>
                                    Review
                                  </Button>
                                )}
                                <Button size="sm" className="h-8 text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleComplaintStatus(comp._id, 'Resolved')}>
                                  Resolve
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-black text-muted-foreground opacity-40 uppercase">Completed</span>
                                {comp.response && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[8px] font-bold p-0 text-primary underline"
                                    onClick={() => {
                                      setSelectedComplaint(comp);
                                      setReplyText(comp.response);
                                      setShowReplyModal(true);
                                    }}
                                  >
                                    View Reply
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeRoot === "tracking" && (

          <div className="space-y-6">
            <div className="portal-card p-5 border-l-4 border-primary">
              <h3 className="font-bold text-sm mb-2 text-primary">
                <ShieldCheck className="w-4 h-4 inline mr-2 text-primary" />
                Bus Tracking Permissions
              </h3>
              <p className="text-xs mb-3 text-muted-foreground">
                Approve or reject requests from passengers to track your official buses. Only approved users can see live locations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-[10px] font-black text-primary uppercase opacity-60">Pending Tracking Requests</p>
                  <p className="text-xl font-black text-primary">{trackingRequests.filter(r => r.status === 'Pending').length}</p>
                </div>
                <div className="p-3 bg-success/5 rounded-xl border border-success/10">
                  <p className="text-[10px] font-black text-success uppercase opacity-60">Total Active Trackers</p>
                  <p className="text-xl font-black text-success">{trackingRequests.filter(r => r.status === 'Accepted').length}</p>
                </div>
              </div>
            </div>

            <div className="portal-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-sm text-primary">Incoming Tracking Requests</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Passenger</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Bus / Organisation</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Sent At</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50">Status</th>
                      <th className="px-4 py-3 text-xs font-black uppercase text-muted-foreground opacity-50 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackingRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground opacity-40 font-black">No tracking requests found</td>
                      </tr>
                    ) : (
                      trackingRequests.map((req: any) => (
                        <tr key={req._id} className="border-b border-border hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-primary">{req.user?.name}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">{req.user?.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black">{req.bus?.busNumber}</span>
                              <span className="text-[10px] font-black text-accent uppercase">{req.bus?.orgName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {format(new Date(req.requestedAt), 'dd MMM yyyy, hh:mm a')}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${req.status === 'Accepted' ? 'bg-success/10 text-success' :
                              req.status === 'Rejected' ? 'bg-red-500/10 text-red-600' :
                                'bg-amber-500/10 text-amber-600'
                              }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {req.status === 'Pending' ? (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" className="h-8 text-[10px] font-black border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleTrackingAction(req._id, 'Rejected')}>
                                  Reject
                                </Button>
                                <Button size="sm" className="h-8 text-[10px] font-black bg-primary hover:bg-primary/90" onClick={() => handleTrackingAction(req._id, 'Accepted')}>
                                  Approve
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[9px] font-black text-muted-foreground opacity-40 uppercase">Handled</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeRoot === "bookings" && (
          <div className="portal-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-card text-card-foreground">
              <div>
                <h3 className="font-bold text-sm text-primary">Booking Records</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Track all passenger tickets and payments</p>
              </div>
            </div>

            {/* Booking Filters */}
            <div className="px-5 py-3 border-b border-border bg-muted/20 flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase">Filter by Bus</label>
                <select
                  className="bg-card border border-border rounded-lg px-2 py-1 text-xs font-bold outline-none ring-primary/20 focus:ring-2"
                  value={bookingFilters.busId}
                  onChange={e => setBookingFilters({ ...bookingFilters, busId: e.target.value })}
                >
                  <option value="all">All Buses</option>
                  {buses.map((b: any) => <option key={b._id} value={b._id}>{b.busNumber}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase">Filter by Route</label>
                <select
                  className="bg-card border border-border rounded-lg px-2 py-1 text-xs font-bold outline-none ring-primary/20 focus:ring-2"
                  value={bookingFilters.route}
                  onChange={e => setBookingFilters({ ...bookingFilters, route: e.target.value })}
                >
                  <option value="all">All Routes</option>
                  {Array.from(new Set(ownerBookings.map(b => `${b.bus?.route?.from} → ${b.bus?.route?.to}`)))
                    .filter(r => r !== 'undefined → undefined')
                    .map(r => <option key={r} value={r}>{r}</option>)
                  }
                </select>
              </div>
              <Button size="sm" variant="ghost" className="h-8 mt-auto text-[10px] font-black opacity-50" onClick={() => setBookingFilters({ busId: 'all', route: 'all' })}>RESET</Button>
            </div>

            {/* Quick Stats Grid for Bookings */}
            {(() => {
              const filteredBkgs = ownerBookings.filter(b => {
                const busMatch = bookingFilters.busId === 'all' || b.bus?._id === bookingFilters.busId;
                const routeName = `${b.bus?.route?.from} → ${b.bus?.route?.to}`;
                const routeMatch = bookingFilters.route === 'all' || routeName === bookingFilters.route;
                return busMatch && routeMatch;
              });
              const filteredRev = filteredBkgs.reduce((sum, b) => sum + (b.amount || 0), 0);

              return (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border-b border-border text-card-foreground">
                    <div className="bg-card p-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Bookings Count</p>
                      <p className="text-xl font-black text-primary">{filteredBkgs.length}</p>
                    </div>
                    <div className="bg-card p-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Filtered Revenue</p>
                      <p className="text-xl font-black text-success">₹{(filteredRev / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="bg-card p-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Avg per Seat</p>
                      <p className="text-xl font-black text-info">₹{filteredBkgs.length > 0 ? Math.round(filteredRev / filteredBkgs.length) : 0}</p>
                    </div>
                    <div className="bg-card p-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Filtered Total</p>
                      <p className="text-xl font-black text-primary">₹{filteredRev.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Bus & Route</th>
                          <th className="px-4 py-3 text-left">Passenger info</th>
                          <th className="px-4 py-3 text-left">Source & Payment</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {filteredBkgs.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm italic">No bookings match the filters.</td></tr>
                        ) : (
                          filteredBkgs.map((b: any) => (
                            <tr key={b._id} className="hover:bg-muted/40 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <p className="font-bold text-foreground">{format(new Date(b.date || b.createdAt), 'dd MMM yyyy')}</p>
                                <p className="text-[10px] text-muted-foreground">{format(new Date(b.createdAt), 'h:mm a')}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-primary flex items-center gap-1.5"><Bus className="w-3.5 h-3.5" /> {b.bus?.busNumber}</p>
                                <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{b.bus?.route?.from || 'Unknown'} → {b.bus?.route?.to || 'Unknown'}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-foreground">{b.user?.name || (b.passengers && b.passengers[0]?.name) || 'Unknown'}</p>
                                {b.passengers?.length > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{b.passengers.length} seat(s): {b.passengers.map((p: any) => p.seatNumber).join(', ')}</p>}
                              </td>
                              <td className="px-4 py-3">
                                {b.bookingSource === 'Employee' ? (
                                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 font-bold px-2 py-0.5 whitespace-nowrap">Offline / {b.paymentMethod || 'Cash'}</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-info/10 text-info border-info/20 font-bold px-2 py-0.5 whitespace-nowrap">Online / {b.paymentMethod || 'Online'}</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-black font-mono text-success text-sm">₹{b.amount}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ===== EMPLOYEES / DRIVERS TAB ===== */}
        {activeRoot === "employees" && (
          <div className="space-y-5">
            <div className="portal-card p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-sm text-primary">Driver Management</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Add and manage drivers for each bus. Each driver gets a unique Driver Code to go on-air.</p>

              {/* Bus Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Select Bus</label>
                <select
                  value={selectedBusForEmp}
                  onChange={e => {
                    setSelectedBusForEmp(e.target.value);
                    setShowDriverForm(false);
                    setNewDriverCode("");
                    if (e.target.value) loadEmployees(e.target.value);
                  }}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  <option value="">-- Choose a bus --</option>
                  {buses.map((bus: any) => (
                    <option key={bus._id} value={bus._id}>{bus.busNumber} {bus.name ? `— ${bus.name}` : ''}</option>
                  ))}
                </select>
              </div>

              {selectedBusForEmp && (
                <>
                  {/* Bus Activation Code Management */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Staff Activation Code
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                        placeholder="e.g. YS-DRIVER-101"
                        className="bg-white border-primary/20 font-mono tracking-widest uppercase font-black"
                      />
                      <Button
                        onClick={handleUpdateActivationCode}
                        disabled={updatingCode || !activationCode.trim()}
                        className="font-black uppercase text-[10px] tracking-widest px-6"
                      >
                        {updatingCode ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : "Set Code"}
                      </Button>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      This code is required for the driver to activate the panel for <strong className="text-foreground">Bus {buses.find(b => b._id === selectedBusForEmp)?.busNumber}</strong>.
                    </p>
                  </div>

                  {/* New Driver Code Banner */}
                  {newDriverCode && (
                    <div className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-success uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Driver Code Generated — Share with Driver
                        </p>
                        <code className="text-success font-mono text-base tracking-widest font-black">{newDriverCode}</code>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-success"
                          onClick={() => { navigator.clipboard.writeText(newDriverCode); toast.success('Driver code copied!'); }}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"
                          onClick={() => setNewDriverCode("")}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Add Driver Button / Form */}
                  {!showDriverForm ? (
                    <Button onClick={() => setShowDriverForm(true)} size="sm" className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Driver
                    </Button>
                  ) : (
                    <div className="bg-secondary/60 rounded-2xl p-4 border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-primary">New Driver Details</p>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowDriverForm(false)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground">Full Name *</label>
                          <Input
                            placeholder="Driver name"
                            value={driverForm.name}
                            onChange={e => setDriverForm({ ...driverForm, name: e.target.value })}
                            className="h-9 text-sm mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground">Email *</label>
                          <Input
                            type="email"
                            placeholder="driver@example.com"
                            value={driverForm.email}
                            onChange={e => setDriverForm({ ...driverForm, email: e.target.value })}
                            className="h-9 text-sm mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground">Phone (optional)</label>
                          <Input
                            placeholder="+91 98765 43210"
                            value={driverForm.phone}
                            onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })}
                            className="h-9 text-sm mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground">Per Day Salary (₹)</label>
                          <Input
                            type="number"
                            placeholder="600"
                            value={driverForm.perDaySalary}
                            onChange={e => setDriverForm({ ...driverForm, perDaySalary: e.target.value })}
                            className="h-9 text-sm mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground">Driver Code (Optional)</label>
                          <Input
                            placeholder="e.g. YS-DRV-A01"
                            value={driverForm.driverCode}
                            onChange={e => setDriverForm({ ...driverForm, driverCode: e.target.value.toUpperCase() })}
                            className="h-9 text-sm mt-0.5 uppercase font-mono tracking-widest"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleAddDriver}
                        disabled={addingDriver || !driverForm.name.trim() || !driverForm.email.trim() || !driverForm.email.includes('@')}
                        size="sm"
                        className="gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {addingDriver ? 'Adding...' : 'Confirm & Set Driver'}
                      </Button>
                    </div>
                  )}

                  {/* Driver List */}
                  {employees.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No drivers added yet. Add a driver above.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider opacity-60">{employees.length} Driver{employees.length > 1 ? 's' : ''}</p>
                      {employees.map((emp: any, idx: number) => (
                        <div key={emp._id || idx} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {(emp.name || emp.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{emp.name || <span className="opacity-40 italic">No Name</span>}</p>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                {emp.phone && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Phone className="w-2.5 h-2.5" /> {emp.phone}
                                  </span>
                                )}
                                {emp.email && (
                                  <span className="text-[10px] text-muted-foreground">{emp.email}</span>
                                )}
                                {emp.perDaySalary > 0 && (
                                  <span className="text-[10px] font-black text-accent">₹{emp.perDaySalary}/day</span>
                                )}
                              </div>
                              {emp.driverCode && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Code:</span>
                                  <code className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">{emp.driverCode}</code>
                                  <button onClick={() => { navigator.clipboard.writeText(emp.driverCode); toast.success('Driver code copied!'); }}
                                    className="p-0.5 rounded hover:bg-primary/10">
                                    <Copy className="w-2.5 h-2.5 text-primary" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[9px] px-2 py-0.5 ${emp.status === 'Active' ? 'bg-green-500/20 text-green-600 border-green-200' :
                              emp.status === 'Rejected' ? 'bg-red-500/20 text-red-600 border-red-200' :
                                'bg-yellow-500/20 text-yellow-600 border-yellow-200'
                              }`}>
                              {emp.status}
                            </Badge>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveDriver(emp._id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Bus Dialog */}
      <AddBusDialog
        open={showAddBus}
        onOpenChange={setShowAddBus}
        onBusAdded={fetchDashboard}
      />

      {/* ===== Run on Route Modal ===== */}
      {
        showRunModal && selectedBusForRun && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-success/10 rounded-xl">
                    <PlayCircle className="w-5 h-5 text-success" />
                  </div>
                  <h3 className="font-black text-primary text-sm">Run Bus on Route</h3>
                </div>
                <button onClick={() => setShowRunModal(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Bus Info */}
              <div className="bg-secondary/60 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Bus Details</p>
                <p className="font-black text-primary">{selectedBusForRun.busNumber} {selectedBusForRun.name && `— ${selectedBusForRun.name}`}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${selectedBusForRun.status === 'Active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {selectedBusForRun.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{selectedBusForRun.totalSeats} seats</span>
                </div>
              </div>

              {/* Route Info */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Saved Route</p>
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <Route className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-black text-sm text-primary">{selectedBusForRun.route?.from} → {selectedBusForRun.route?.to}</p>
                    {selectedBusForRun.route?.stops?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {selectedBusForRun.route.stops.length} stops on route
                      </p>
                    )}
                  </div>
                </div>

                {/* Stops list */}
                {selectedBusForRun.route?.stops?.length > 0 && (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {selectedBusForRun.route.stops.map((stop: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-success' : i === selectedBusForRun.route.stops.length - 1 ? 'bg-red-500' : 'bg-primary/40'}`}></div>
                        <span className={`font-semibold ${i === 0 || i === selectedBusForRun.route.stops.length - 1 ? 'text-foreground' : ''}`}>{stop.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowRunModal(false)}>Cancel</Button>
                <Button
                  className="flex-1 bg-success hover:bg-success/90 text-white gap-1.5"
                  onClick={handleActivateBusOnRoute}
                >
                  <PlayCircle className="w-4 h-4" />
                  Activate Route
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground text-center opacity-60">
                To modify stops, use the Route button instead.
              </p>
            </div>
          </div>
        )
      }

      {/* ===== Add Expense Modal ===== */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-black text-primary text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Record New Expense
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="p-1 hover:bg-muted rounded text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase mb-1 block">Expense Category</label>
                <select
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm focus:ring-2 ring-primary/20"
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                >
                  <option value="Fuel">⛽ Fuel / Petrol</option>
                  <option value="Toll">🛣️ Toll / Tax</option>
                  <option value="Maintenance">🔧 Maintenance</option>
                  <option value="Salary">💰 Other Salary</option>
                  <option value="Other">🛡️ Other Misc</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase mb-1 block">Associated Bus</label>
                <select
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm"
                  value={expenseForm.bus}
                  onChange={e => setExpenseForm({ ...expenseForm, bus: e.target.value })}
                >
                  <option value="">-- No specific bus --</option>
                  {dashboardData?.buses?.map((b: any) => (
                    <option key={b._id} value={b._id}>{b.busNumber}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase mb-1 block">Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="h-10 text-sm font-black"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase mb-1 block">Date</label>
                  <Input
                    type="date"
                    className="h-10 text-xs"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase mb-1 block">Description</label>
                <Input
                  placeholder="e.g. 50L Diesel, NH-44 Toll"
                  className="h-10 text-sm"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-primary font-bold"
                onClick={handleAddExpense}
                disabled={savingExpense || !expenseForm.amount}
              >
                {savingExpense ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Payroll / Salary Slip Modal ===== */}
      {showPayrollModal && selectedEmpForPayroll && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="bg-primary p-6 text-primary-foreground relative">
              <button onClick={() => setShowPayrollModal(false)} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
                  {selectedEmpForPayroll.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black">{selectedEmpForPayroll.name}</h3>
                  <p className="text-sm opacity-80 uppercase tracking-widest font-bold">Salary Slip • {payrollMonth}</p>
                </div>
              </div>
            </div>

            {loadingPayroll ? (
              <div className="p-20 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary/40" /></div>
            ) : payrollReport ? (
              <>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Attendance Info</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span className="text-sm font-bold">{payrollReport.presentDays} Days Present</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase">Work Hours</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold">{Math.round(payrollReport.totalHours)} Total Hours</span>
                        </div>
                        {payrollReport.overtimeHours > 0 && (
                          <p className="text-[10px] text-success font-black mt-1">+ {Math.round(payrollReport.overtimeHours)} hrs Overtime included</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-secondary/40 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Base Salary:</span>
                        <span className="font-bold">₹{payrollReport.baseSalary}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Overtime Pay:</span>
                        <span className="font-bold text-success">+ ₹{payrollReport.overtimePay}</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between items-center">
                        <span className="font-black text-primary text-sm">Total Due:</span>
                        <span className="font-black text-xl text-primary">₹{payrollReport.totalDue}</span>
                      </div>
                    </div>
                  </div>

                  {payrollReport.isPaid ? (
                    <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center justify-between text-success">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6" />
                        <div>
                          <p className="text-sm font-black">Already Paid</p>
                          <p className="text-[10px] opacity-80">Salary marked as paid on {format(new Date(payrollReport.paymentDetails.createdAt), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-4">Clicking "Mark as Paid" will notify the driver and record this as a business expense.</p>
                      <Button className="w-full bg-success hover:bg-success/90 text-white font-black py-6 text-lg" onClick={handlePaySalary}>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Mark as Paid & Notify
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
      {/* ===== Complaint Reply Modal ===== */}
      {showReplyModal && selectedComplaint && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-4 flex items-center justify-between border-b ${selectedComplaint.type === 'Complaint' ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
              <div className="flex items-center gap-2">
                <Edit className={`w-4 h-4 ${selectedComplaint.type === 'Complaint' ? 'text-red-600' : 'text-blue-600'}`} />
                <h3 className="font-black text-sm uppercase tracking-wider">
                  {selectedComplaint.status === 'Resolved' ? 'View Feedback Response' : `Reply to ${selectedComplaint.type}`}
                </h3>
              </div>
              <button onClick={() => setShowReplyModal(false)} className="p-1 hover:bg-muted rounded text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-primary uppercase">{selectedComplaint.userName || "Passenger"}</span>
                  <Badge variant="outline" className="text-[8px] font-bold uppercase py-0">{selectedComplaint.category}</Badge>
                </div>
                <p className="text-xs italic text-muted-foreground">"{selectedComplaint.description}"</p>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase mb-1.5 block">Your Response</label>
                <textarea
                  className="w-full min-h-[120px] bg-secondary border border-border rounded-xl p-3 text-sm focus:ring-2 ring-primary/20 outline-none resize-none"
                  placeholder={selectedComplaint.status === 'Resolved' ? "" : "Type your message to the passenger here..."}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  readOnly={selectedComplaint.status === 'Resolved'}
                />
                {selectedComplaint.status !== 'Resolved' && (
                  <p className="text-[9px] text-muted-foreground mt-2 opacity-60">
                    * Sending a response will automatically mark this issue as **Resolved**.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-muted/20 border-t flex gap-3">
              <Button variant="outline" className="flex-1 font-bold" onClick={() => setShowReplyModal(false)}>
                {selectedComplaint.status === 'Resolved' ? 'Close' : 'Cancel'}
              </Button>
              {selectedComplaint.status !== 'Resolved' && (
                <Button
                  className="flex-1 bg-primary font-black uppercase tracking-wide"
                  disabled={sendingReply || !replyText.trim()}
                  onClick={handleSendReply}
                >
                  {sendingReply ? 'Sending...' : 'Send & Resolve'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout >
  );
}
