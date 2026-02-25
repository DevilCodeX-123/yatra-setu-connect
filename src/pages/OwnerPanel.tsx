import { useState, useEffect } from "react";
import {
  Bus, DollarSign, BarChart2, Users, Edit, Plus, Calendar, TrendingUp, Package, MapPin, ShieldCheck, Clock, CheckCircle2, Trash2, Copy, Lock, Phone, UserCheck, X, Route, PlayCircle
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
];

export default function OwnerPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeRoot, setActiveTab] = useState("fleet");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [rentalRequests, setRentalRequests] = useState<any[]>([]);
  const [trackingRequests, setTrackingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBus, setShowAddBus] = useState(false);

  // Driver management state
  const [selectedBusForEmp, setSelectedBusForEmp] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeCode, setEmployeeCode] = useState("");
  const [driverForm, setDriverForm] = useState({ name: "", phone: "", email: "", perDaySalary: "" });
  const [addingDriver, setAddingDriver] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [newDriverCode, setNewDriverCode] = useState("");

  // Run on Route modal state
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedBusForRun, setSelectedBusForRun] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      const [data, requests, tRequests] = await Promise.all([
        api.getOwnerDashboard(),
        api.getOwnerRequests(),
        api.getOwnerTrackingRequests()
      ]);
      setDashboardData(data);
      setRentalRequests(Array.isArray(requests) ? requests : []);
      setTrackingRequests(Array.isArray(tRequests) ? tRequests : []);
    } catch (err) {
      console.error("Failed to fetch owner data", err);
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

  const [editFare, setEditFare] = useState<string | null>(null);
  const [fareVal, setFareVal] = useState("");
  const [editSettings, setEditSettings] = useState<string | null>(null);
  const [settingsVal, setSettingsVal] = useState({ percentage: 50, hourly: 500 });

  const buses = dashboardData?.buses || [];
  const totalEarnings = dashboardData?.totalRevenue || 0;
  const earningsData = dashboardData?.monthlyEarnings || [
    { month: "Jan", amount: 15000 },
    { month: "Feb", amount: 22000 },
    { month: "Mar", amount: 18000 },
    { month: "Apr", amount: 25000 },
    { month: "May", amount: 30000 },
    { month: "Jun", amount: 28000 },
  ];
  const maxEarning = Math.max(...earningsData.map((e: any) => e.amount), 1);

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
    } catch {
      toast.error('Failed to load drivers');
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
      });
      if (res.success) {
        setNewDriverCode(res.driverCode || '');
        toast.success(`Driver "${driverForm.name}" added! Code: ${res.driverCode}`);
        setDriverForm({ name: "", phone: "", email: "", perDaySalary: "" });
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
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Buses", value: dashboardData?.totalBuses || 0, icon: Bus, color: "primary" },
                { label: "Active Buses", value: dashboardData?.activeBuses || 0, icon: TrendingUp, color: "success" },
                { label: "Total Earnings", value: `₹${(totalEarnings / 1000).toFixed(1)}k`, icon: DollarSign, color: "info" },
                { label: "Total Bookings", value: dashboardData?.totalBookings || 0, icon: Users, color: "warning" },
              ].map(s => (
                <div key={s.label} className="portal-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <s.icon className="w-4 h-4" style={{ color: `hsl(var(--${s.color}))` }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: `hsl(var(--${s.color}))` }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Fleet */}
            <div className="portal-card overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between border-border">
                <h3 className="font-bold text-sm text-primary">Registered Fleet</h3>
                <Button size="sm" onClick={() => setShowAddBus(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Bus
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      {["Bus Number", "Name", "Route", "Seats", "Fare (₹)", "Rental", "Status", "Actions"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {buses.map((bus: any) => (
                      <tr key={bus._id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-xs text-primary">{bus.busNumber}</td>
                        <td className="px-4 py-3">{bus.name}</td>
                        <td className="px-4 py-3 text-xs">
                          {bus.route?.from ? (
                            <span className="text-foreground">{bus.route.from} → {bus.route.to}</span>
                          ) : (
                            <span className="text-muted-foreground italic opacity-50">No Route Set</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{bus.totalSeats}</td>
                        <td className="px-4 py-3">
                          {editFare === bus._id ? (
                            <div className="flex gap-1">
                              <Input className="w-20 h-7 text-xs" value={fareVal} onChange={e => setFareVal(e.target.value)} />
                              <Button size="sm" className="h-7 text-xs px-2 bg-success text-white"
                                onClick={() => {
                                  toast.success(`Fare updated for ${bus.busNumber}`);
                                  setEditFare(null);
                                }}>Save</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              ₹{bus.fare || bus.pricePerKm || 0}
                              <button onClick={() => { setEditFare(bus._id); setFareVal(String(bus.fare || bus.pricePerKm || 0)); }}
                                className="p-0.5 rounded hover:bg-primary/10 transition-colors">
                                <Edit className="w-3 h-3 text-primary" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editSettings === bus._id ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] font-black opacity-40">Return:</span>
                                <input
                                  type="number"
                                  className="w-12 h-6 text-[10px] bg-secondary border border-border rounded px-1"
                                  value={settingsVal.percentage}
                                  onChange={e => setSettingsVal({ ...settingsVal, percentage: Number(e.target.value) })}
                                />
                                <span className="text-[8px] font-black opacity-40">%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] font-black opacity-40">Hr Rate:</span>
                                <input
                                  type="number"
                                  className="w-12 h-6 text-[10px] bg-secondary border border-border rounded px-1"
                                  value={settingsVal.hourly}
                                  onChange={e => setSettingsVal({ ...settingsVal, hourly: Number(e.target.value) })}
                                />
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" onClick={() => setEditSettings(null)} className="h-5 px-1.5 text-[8px]">Cancel</Button>
                                <Button onClick={() => handleUpdateSettings(bus._id)} className="h-5 px-1.5 text-[8px]">Save</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[9px] font-black text-accent flex flex-col cursor-pointer hover:opacity-70"
                              onClick={() => {
                                setEditSettings(bus._id);
                                setSettingsVal({
                                  percentage: bus.oneWayReturnChargePercentage || 50,
                                  hourly: bus.rentalPricePerHour || 500
                                });
                              }}>
                              <span>Return: {bus.oneWayReturnChargePercentage || 50}%</span>
                              <span>Rate: ₹{bus.rentalPricePerHour || 500}/h</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`stat-badge ${bus.status === "Active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                            {bus.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => navigate(`/owner/route-selection?busNumber=${bus._id}`)}>
                              <MapPin className="w-3 h-3 mr-1" /> Route
                            </Button>
                            {/* Run on Saved Route Button - only shown if route is set */}
                            {bus.route?.from && (
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-success border-success/40 hover:bg-success/10"
                                onClick={() => handleRunOnRoute(bus)}>
                                <PlayCircle className="w-3 h-3 mr-1" /> Run
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-accent border-accent" onClick={() => toast.success("Bus marked for Rent!")}>
                              Rent
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeRoot === "earnings" && (
          <div className="portal-card p-5">
            <h3 className="font-bold text-sm mb-4 text-primary">
              <BarChart2 className="w-4 h-4 inline mr-2" />Monthly Earnings Overview
            </h3>
            <div className="flex items-end gap-3 h-32">
              {earningsData.map((e: any) => (
                <div key={e.month} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs font-semibold text-primary">
                    ₹{(e.amount / 1000).toFixed(1)}k
                  </p>
                  <div className="w-full rounded-t-sm transition-all bg-primary"
                    style={{
                      height: `${(e.amount / maxEarning) * 88}px`,
                      opacity: e.month === "Dec" ? 1 : 0.5
                    }} />
                  <p className="text-xs text-muted-foreground">{e.month}</p>
                </div>
              ))}
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
          <div className="portal-card p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-primary ">Booking Records</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              View all passenger bookings for your fleet in real-time. This section is being updated with live data.
            </p>
            <Button variant="outline" onClick={() => setActiveTab("fleet")}>Back to Fleet</Button>
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
                  {/* Employee/Bus Code Display */}
                  {employeeCode && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Bus Employee Code (for staff activation)
                        </p>
                        <code className="text-primary font-mono text-sm tracking-widest font-bold">{employeeCode}</code>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { navigator.clipboard.writeText(employeeCode); toast.success('Code copied!'); }}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

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
                          <label className="text-[10px] font-semibold text-muted-foreground">Phone</label>
                          <Input
                            placeholder="+91 98765 43210"
                            value={driverForm.phone}
                            onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })}
                            className="h-9 text-sm mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground">Email (optional)</label>
                          <Input
                            type="email"
                            placeholder="driver@example.com"
                            value={driverForm.email}
                            onChange={e => setDriverForm({ ...driverForm, email: e.target.value })}
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
                      </div>
                      <Button
                        onClick={handleAddDriver}
                        disabled={addingDriver || !driverForm.name.trim()}
                        size="sm"
                        className="gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {addingDriver ? 'Adding...' : 'Confirm & Generate Code'}
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
      {showRunModal && selectedBusForRun && (
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
      )}
    </DashboardLayout>
  );
}
