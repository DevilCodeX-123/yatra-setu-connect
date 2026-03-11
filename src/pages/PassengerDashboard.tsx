import { useState, useEffect } from "react";
import { MapPin, Bus, Route, Leaf, User, CreditCard, ArrowRight, RefreshCw, BarChart2, Zap, Radio } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  { href: "/passenger", label: "Overview", icon: <User className="size-4" /> },
  { href: "/booking", label: "Book Ticket", icon: <Bus className="size-4" /> },
  { href: "/verify", label: "My Tickets", icon: <CreditCard className="size-4" /> },
  { href: "/profile/past-rides", label: "Past Rides", icon: <Route className="size-4" /> },
];

interface Booking {
  _id: string;
  pnr: string;
  date: string;
  amount: number;
  status: string;
  paymentMethod: string;
  passengers: { name: string; seatNumber: string }[];
  bus?: {
    _id: string;
    busNumber: string;
    name?: string;
    status?: string;
    route?: { from?: string; to?: string };
  };
}

const carKmEmission = 0.185;
const busKmEmission = 0.035;

export default function PassengerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalKm, setTotalKm] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getBookings();
      const bk: Booking[] = Array.isArray(data) ? data : (data.bookings || []);
      setBookings(bk);
      // Estimate total km from bookings
      setTotalKm(bk.filter(b => b.status === "Completed").length * 120);
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const completedTrips = bookings.filter(b => ["Completed", "Confirmed", "Boarded"].includes(b.status));
  const activeTrip = bookings.find(b => b.status === "Boarded" || (b.status === "Confirmed" && b.bus?.status === "Active"));

  const co2Saved = ((carKmEmission - busKmEmission) * totalKm).toFixed(1);
  const fuelSaved = (totalKm * 0.08).toFixed(1);

  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <DashboardLayout
      title="Travel Control Center"
      subtitle="Manage your journey & carbon footprint"
      sidebarItems={sidebarItems}>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

        {/* Live Trip Card (Premium Gradient) */}
        {activeTrip && (
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-primary to-indigo-900 p-6 text-white shadow-2xl shadow-primary/20 ring-1 ring-white/20">
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <Radio className="size-3 animate-pulse text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Live Activity</span>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <Bus className="size-7" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tighter opacity-70">Current Journey</h3>
                  <p className="text-2xl font-black">{activeTrip.bus?.busNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 justify-between bg-black/20 backdrop-blur-sm p-4 rounded-3xl border border-white/5">
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-black uppercase opacity-60 mb-1">From</p>
                  <p className="text-lg font-black">{activeTrip.bus?.route?.from || "Origin"}</p>
                </div>
                <Zap className="size-5 text-emerald-400 opacity-50" />
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-black uppercase opacity-60 mb-1">To</p>
                  <p className="text-lg font-black">{activeTrip.bus?.route?.to || "Destination"}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500 text-white border-0 font-black text-[10px]">{activeTrip.status}</Badge>
                  <span className="text-xs font-bold opacity-70 italic">Bus is active and on-route</span>
                </div>
                <Link to={`/tracking/${activeTrip.bus?.busNumber}`}>
                  <Button variant="secondary" className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-6 gap-2 bg-white text-primary hover:bg-white/90">
                    Track Live <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 rounded-[32px] shadow-sm">
          <div className="size-16 rounded-[20px] bg-primary flex items-center justify-center text-xl font-black text-primary-foreground shadow-lg shadow-primary/20">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-black tracking-tight">{user?.name || "Passenger"}</h2>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-emerald-500/30 text-emerald-600 bg-emerald-50">Verified</Badge>
            </div>
            <p className="text-xs font-bold text-muted-foreground opacity-60">
              {user?.phone ? `+91 ${user.phone} • ` : ""}{user?.email}
            </p>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
              <Link to="/profile/info"><Button variant="secondary" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase">Edit Profile</Button></Link>
              <Link to="/profile/wallet"><Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase px-4 ring-1 ring-border">Manage Wallet</Button></Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Trips", value: loading ? "…" : String(completedTrips.length), icon: Bus, color: "text-primary", bg: "bg-primary/5" },
            { label: "Distance", value: loading ? "…" : `${totalKm} KM`, icon: Route, color: "text-blue-500", bg: "bg-blue-500/5" },
            { label: "CO₂ Saved", value: loading ? "…" : `${co2Saved} KG`, icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-500/5" },
            { label: "Fuel Saved", value: loading ? "…" : `${fuelSaved} L`, icon: BarChart2, color: "text-amber-500", bg: "bg-amber-500/5" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border p-5 rounded-3xl transition-all hover:bg-secondary/50 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="size-4" />
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-muted-foreground opacity-40">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${stat.color.replace('text', 'bg')} w-2/3 opacity-20`} />
              </div>
            </div>
          ))}
        </div>

        {/* History Table */}
        <div className="bg-card border border-border overflow-hidden rounded-[32px] shadow-sm">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Recent Bookings</h3>
            <Link to="/profile/bookings">
              <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase h-8 hover:bg-primary/10 text-primary">View Full History</Button>
            </Link>
          </div>

          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="size-6 animate-spin mx-auto text-primary opacity-20" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="size-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                  <Bus className="size-8 text-muted-foreground opacity-20" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">Ready for your next adventure?</p>
                <Link to="/booking">
                  <Button className="rounded-2xl font-black uppercase tracking-widest text-xs h-11 px-8">Book a Bus Now</Button>
                </Link>
              </div>
            ) : (
              bookings.slice(0, 5).map(b => (
                <div key={b._id} className="px-6 py-5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center font-black text-[10px] ${b.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/5 text-primary'}`}>
                      {b.status === 'Completed' ? <CheckCircle2 className="size-5" /> : <Bus className="size-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black text-foreground">
                        <span>{b.bus?.route?.from || "Unknown"}</span>
                        <ArrowRight className="size-3 text-muted-foreground opacity-40" />
                        <span>{b.bus?.route?.to || "Unknown"}</span>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground mt-0.5 tracking-tighter uppercase">
                        PNR: {b.pnr} · {new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-foreground mb-1">₹{b.amount}</p>
                    <Badge className={`text-[9px] font-black uppercase tracking-widest py-0.5 px-2 ${b.status === "Completed" ? "bg-emerald-500/10 text-emerald-600 border-0" :
                        b.status === "Cancelled" ? "bg-red-500/10 text-red-500 border-0" :
                          "bg-blue-500/10 text-blue-600 border-0"
                      }`}>
                      {b.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
