import { useState, useEffect } from "react";
import {
  Bus, DollarSign, BarChart2, Users, Edit, Eye, Plus, Calendar, TrendingUp, Package, MapPin
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";

const sidebarItems = [
  { label: "Fleet Overview", icon: <Bus className="w-4 h-4" />, id: "fleet", url: "/owner" },
  { label: "Booking Records", icon: <Calendar className="w-4 h-4" />, id: "bookings", url: "/owner#bookings" },
  { label: "Earnings", icon: <DollarSign className="w-4 h-4" />, id: "earnings", url: "/owner#earnings" },
  { label: "Rent for Event", icon: <Package className="w-4 h-4" />, id: "rent", url: "/owner#rent" },
];

import { api } from "@/lib/api";

export default function OwnerPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeRoot, setActiveTab] = useState("fleet");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.getOwnerDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch owner dashboard", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
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

  const buses = dashboardData?.buses || [];
  const totalEarnings = dashboardData?.totalRevenue || 0;

  const currentSidebarItems = sidebarItems.map(item => ({
    ...item,
    active: activeRoot === item.id,
    href: item.url
  }));

  if (loading) {
    return (
      <DashboardLayout title="Loading Dashboard..." sidebarItems={currentSidebarItems}>
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
                <Button size="sm" onClick={() => toast.info("Add Bus Feature Coming Soon!")}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Bus
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      {["Bus Number", "Name", "Route", "Seats", "Fare (₹)", "Status", "Actions"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {buses.map((bus: any) => (
                      <tr key={bus.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-xs text-primary">{bus.busNumber}</td>
                        <td className="px-4 py-3">{bus.name}</td>
                        <td className="px-4 py-3 text-xs">{bus.route.from} → {bus.route.to}</td>
                        <td className="px-4 py-3">{bus.totalSeats}</td>
                        <td className="px-4 py-3">
                          {editFare === bus._id ? (
                            <div className="flex gap-1">
                              <Input className="w-20 h-7 text-xs" value={fareVal} onChange={e => setFareVal(e.target.value)} />
                              <Button size="sm" className="h-7 text-xs px-2 bg-success text-white"
                                onClick={() => {
                                  toast.success(`Fare updated for ${bus.id}`);
                                  setEditFare(null);
                                }}>Save</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              ₹{bus.fare}
                              <button onClick={() => { setEditFare(bus.id); setFareVal(String(bus.fare)); }}
                                className="p-0.5 rounded hover:bg-primary/10 transition-colors">
                                <Edit className="w-3 h-3 text-primary" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`stat-badge ${bus.status === "Active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                            {bus.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary">
                          ₹{bus.earnings.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => navigate(`/owner/route-selection?busNumber=${bus.id}`)}>
                              <MapPin className="w-3 h-3 mr-1" /> Route
                            </Button>
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
              {earningsData.map(e => (
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
          <div className="portal-card p-5 border-l-4 border-accent">
            <h3 className="font-bold text-sm mb-2 text-primary">
              <Package className="w-4 h-4 inline mr-2 text-accent" />
              Mark Bus for Event Rent
            </h3>
            <p className="text-xs mb-3 text-muted-foreground">
              Make your bus available for school trips, corporate outings, or special events.
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="bg-accent text-accent-foreground" onClick={() => toast.success("Volvo AC marked for Rent!")}>
                Mark KA-01-F-9012 for Rent
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.info("No rental requests yet.")}>View Rent Requests</Button>
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
      </div>
    </DashboardLayout>
  );
}
