import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Calendar, Clock, Users, ArrowRight,
  CheckCircle, Radio, Bus, Leaf, Shield, TrendingUp,
  ChevronRight, Star, AlertCircle, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import Logo from "@/components/brand/Logo";
import LogoIcon from "@/components/brand/LogoIcon";

const features = [
  { icon: Shield, title: "Verified & Safe", desc: "All buses GPS-tracked with driver verification and live monitoring." },
  { icon: Clock, title: "Real-time Updates", desc: "Live bus location, delay alerts and arrival predictions." },
  { icon: Star, title: "Priority Seating", desc: "Reserved seats for women, elderly, disabled and pregnant passengers." },
  { icon: Leaf, title: "Eco Tracking", desc: "Track your carbon footprint savings vs. personal vehicle travel." },
];

export default function Home() {
  const [liveBuses, setLiveBuses] = useState<any[]>([]);
  const [dynamicStats, setDynamicStats] = useState({
    busesRunningToday: 0,
    passengersServed: 0,
    routesActive: 0,
    co2Saved: 0
  });
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [statsData, citiesData] = await Promise.all([
          api.getStats(),
          api.getCities()
        ]);
        setDynamicStats(statsData);
        setAllCities(citiesData);
      } catch (err) {
        console.error("Initialization failed:", err);
      }
    };
    init();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".relative")) {
        setShowFromSuggestions(false);
        setShowToSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Removed initial fetch to show buses only on search

  const handleSearch = async () => {
    if (fromCity && toCity && selectedDates.length > 0) {
      setLoading(true);
      try {
        const data = await api.searchBuses(fromCity, toCity, selectedDates.join(','));
        setLiveBuses(data);
        setSearched(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const today = "2026-02-20"; // Consistent with context

  const getUpcomingDates = () => {
    const dates = [];
    const startDate = new Date(today);
    for (let i = 0; i < 4; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      dates.push({ dateStr, dayName, dayNum });
    }
    return dates;
  };

  const upcomingDates = getUpcomingDates();

  const getStatusColor = (status: string) => {
    if (status === "On Time") return "success";
    if (status === "Full") return "danger";
    return "warning";
  };

  const getAvailabilityColor = (available: number, total: number) => {
    if (available === 0) return "hsl(var(--danger))";
    if (available / total < 0.2) return "hsl(var(--warning))";
    return "hsl(var(--success))";
  };

  return (
    <Layout>
      {/* Hero / Search Section */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)" }}>
        {/* Decorative dot grid */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />

        {/* Blue glow orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] -translate-y-1/2 opacity-60" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-300/15 rounded-full blur-[100px] translate-y-1/2 opacity-40" />

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center mb-12 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold bg-white/10 border border-white/20 text-white backdrop-blur-md">
              <Radio className="w-3.5 h-3.5 live-pulse text-blue-300" />
              Real-time Network Monitoring Active
            </div>

            <div className="flex flex-col items-center gap-6 mb-8">
              <div className="p-4 bg-white/10 rounded-[32px] backdrop-blur-xl border border-white/20 shadow-2xl">
                <LogoIcon size={80} className="shadow-lg" />
              </div>
              <Logo variant="white" className="h-16 md:h-24" />
            </div>

            <p className="text-base sm:text-lg font-medium max-w-2xl mx-auto text-blue-100/80 mt-4">
              India's unified gateway for smart public transport. Seamlessly connect with verified buses, live tracking, and secure digital ticketing.
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-4xl mx-auto bg-card border border-border shadow-2xl rounded-[32px] p-6 md:p-8 backdrop-blur-xl relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-muted-foreground mb-2 ml-1 opacity-60">
                  From
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input
                    className="pl-11 h-14 bg-secondary border border-border rounded-2xl font-black text-[10px] shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Departure city"
                    value={fromCity}
                    onChange={e => {
                      const val = e.target.value;
                      setFromCity(val);
                      if (val.length > 0) {
                        setFromSuggestions(allCities.filter(c => c.toLowerCase().includes(val.toLowerCase())));
                        setShowFromSuggestions(true);
                      } else {
                        setShowFromSuggestions(false);
                      }
                    }}
                    onFocus={() => fromCity && setShowFromSuggestions(true)}
                  />
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                      {fromSuggestions.map(city => (
                        <div
                          key={city}
                          className="px-5 py-3 text-[10px] font-black hover:bg-primary/10 cursor-pointer text-foreground border-b border-border last:border-none"
                          onClick={() => {
                            setFromCity(city);
                            setShowFromSuggestions(false);
                          }}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-1 relative">
                <label className="block text-[10px] font-black text-muted-foreground mb-2 ml-1 opacity-60">
                  To
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input
                    className="pl-11 h-14 bg-secondary border border-border rounded-2xl font-black text-[10px] shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Destination city"
                    value={toCity}
                    onChange={e => {
                      const val = e.target.value;
                      setToCity(val);
                      if (val.length > 0) {
                        setToSuggestions(allCities.filter(c => c.toLowerCase().includes(val.toLowerCase())));
                        setShowToSuggestions(true);
                      } else {
                        setShowToSuggestions(false);
                      }
                    }}
                    onFocus={() => toCity && setShowToSuggestions(true)}
                  />
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                      {toSuggestions.map(city => (
                        <div
                          key={city}
                          className="px-5 py-3 text-[10px] font-black hover:bg-primary/10 cursor-pointer text-foreground border-b border-border last:border-none"
                          onClick={() => {
                            setToCity(city);
                            setShowToSuggestions(false);
                          }}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-muted-foreground mb-2 ml-1 opacity-60">
                  Date of Travel
                </label>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {upcomingDates.map(({ dateStr, dayName, dayNum }) => (
                    <button
                      key={dateStr}
                      onClick={() => toggleDate(dateStr)}
                      className={`flex flex-col items-center justify-center min-w-[54px] h-14 rounded-2xl border transition-all ${selectedDates.includes(dateStr)
                        ? "bg-primary text-white border-primary shadow-lg scale-105"
                        : "bg-secondary text-foreground border-border hover:border-primary/50"
                        }`}
                    >
                      <span className="text-[7px] font-black opacity-60">
                        {dayName}
                      </span>
                      <span className="text-xs font-black leading-none mt-1">
                        {dayNum}
                      </span>
                    </button>
                  ))}

                  {/* Calendar Toggle */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => (document.getElementById("custom-date-picker") as HTMLInputElement)?.showPicker()}
                      className="flex flex-col items-center justify-center min-w-[54px] h-14 rounded-2xl border bg-secondary text-foreground border-border hover:border-primary/50 transition-all"
                    >
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-[7px] font-black mt-1 opacity-60">Custom</span>
                    </button>
                    <Input
                      id="custom-date-picker"
                      type="date"
                      className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                      onChange={(e) => {
                        if (e.target.value) {
                          toggleDate(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-1">
                <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-light font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01]" onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Find Buses
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-[9px] font-black text-muted-foreground opacity-60 border-t border-border pt-4">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Advance booking (30 Days)
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Fast Refund System
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Live Hub Monitoring
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Buses Active", value: dynamicStats.busesRunningToday.toLocaleString(), icon: Bus },
              { label: "Total Bookings", value: dynamicStats.passengersServed >= 100000 ? `${(dynamicStats.passengersServed / 100000).toFixed(1)}L+` : dynamicStats.passengersServed.toLocaleString(), icon: Users },
              { label: "Routes Online", value: dynamicStats.routesActive.toLocaleString(), icon: Navigation },
              { label: "CO₂ Reduced", value: `${(dynamicStats.co2Saved / 1000).toFixed(1)}T`, icon: Leaf },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-4 group">
                <div className="p-3.5 rounded-2xl bg-secondary border border-border group-hover:bg-primary/5 transition-colors">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-black leading-none text-foreground">{stat.value}</p>
                  <p className="text-[10px] font-black text-muted-foreground opacity-40 mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Running Buses - Only shown after search */}
      {searched && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8 border-l-4 border-primary pl-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full live-pulse bg-emerald-500" />
                <h2 className="text-3xl font-black text-foreground">Search Results</h2>
              </div>
              <p className="text-xs font-black text-muted-foreground opacity-60">
                Live availability for <span className="text-primary font-semibold">{fromCity}</span> to <span className="text-blue-600 font-semibold">{toCity}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-20 bg-secondary/50 rounded-3xl border border-dashed border-border">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="font-black text-xs opacity-60">Scanning Network...</p>
                </div>
              </div>
            ) : liveBuses.length === 0 ? (
              <div className="bg-card border border-border p-16 text-center rounded-[32px] shadow-card">
                <div className="max-w-xs mx-auto space-y-4">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bus className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <p className="text-xl font-black text-foreground">No Buses Found</p>
                  <p className="text-[10px] font-black text-muted-foreground opacity-60">We couldn't find any active buses for this specific route and date selection.</p>
                </div>
              </div>
            ) : (
              liveBuses.map(bus => (
                <div key={bus._id} className="bg-card border border-border p-6 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-2xl transition-all rounded-[28px] group">
                  {/* Route info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-secondary rounded-2xl group-hover:bg-primary/5 transition-colors">
                        <Bus className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-foreground">{bus.route.from}</span>
                          <ArrowRight className="w-4 h-4 text-primary/40" />
                          <span className="text-lg font-black text-foreground">{bus.route.to}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="rounded-lg text-[9px] font-black border-border bg-secondary text-muted-foreground">{bus.busNumber}</Badge>
                          <Badge className="rounded-lg text-[9px] font-black bg-primary/10 text-primary border-none">{bus.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="flex items-center gap-10 bg-secondary/30 dark:bg-secondary/10 px-8 py-4 rounded-3xl border border-border/50">
                    <div className="text-center">
                      <p className="text-xl font-black text-foreground leading-none">{bus.departureTime}</p>
                      <p className="text-[9px] font-black text-muted-foreground opacity-40 mt-1.5">{bus.route.from}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 opacity-20">
                      <div className="w-12 h-0.5 bg-foreground rounded-full" />
                      <Clock className="w-3 h-3" />
                      <div className="w-12 h-0.5 bg-foreground rounded-full" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-foreground leading-none">{bus.arrivalTime}</p>
                      <p className="text-[9px] font-black text-muted-foreground opacity-40 mt-1.5">{bus.route.to}</p>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="flex flex-col items-center gap-2 min-w-[120px]">
                    <div className="flex items-end gap-1">
                      <p className="text-2xl font-black leading-none" style={{ color: getAvailabilityColor(bus.availableSeats, bus.totalSeats) }}>
                        {bus.availableSeats}
                      </p>
                      <p className="text-[9px] font-black text-muted-foreground opacity-40 mb-0.5">Seats Left</p>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary border border-border/50 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${((bus.totalSeats - bus.availableSeats) / bus.totalSeats) * 100}%`,
                          backgroundColor: getAvailabilityColor(bus.availableSeats, bus.totalSeats)
                        }} />
                    </div>
                  </div>

                  {/* Status & Book */}
                  <div className="flex flex-col items-end gap-3 min-w-[140px]">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${bus.status === "On Time" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : bus.status === "Full" ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-primary-light/10 text-primary border-primary/20"}`}>
                      {bus.status}
                    </span>
                    <Button
                      className="w-full h-12 rounded-xl bg-primary hover:bg-primary-light font-black text-[10px] shadow-lg shadow-primary/20"
                      disabled={bus.availableSeats === 0}
                      asChild={bus.availableSeats > 0}
                    >
                      {bus.availableSeats > 0 ? <Link to={`/booking?busId=${bus._id}`}>Book Seat</Link> : <span>Coach Full</span>}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}


      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link to="/booking" className="bg-card border border-border p-6 flex items-center gap-5 hover:shadow-2xl transition-all group rounded-[28px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12" />
            <div className="p-4 rounded-2xl shrink-0 bg-primary/10 group-hover:scale-110 transition-transform">
              <Bus className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">Advanced Booking</h3>
              <p className="text-[10px] font-black text-muted-foreground opacity-40 mt-1">Book up to 30 days in advance</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-primary/30 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link to="/verify" className="bg-card border border-border p-6 flex items-center gap-5 hover:shadow-2xl transition-all group rounded-[28px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-12 translate-x-12" />
            <div className="p-4 rounded-2xl shrink-0 bg-emerald-500/10 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">Verify Ticket</h3>
              <p className="text-[10px] font-black text-muted-foreground opacity-40 mt-1">Check PNR validity instantly</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-emerald-500/30 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link to="/emergency" className="bg-card border border-red-500/20 p-6 flex items-center gap-5 hover:shadow-2xl transition-all group rounded-[28px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-12 translate-x-12" />
            <div className="p-4 rounded-2xl shrink-0 bg-red-500/10 group-hover:scale-110 transition-transform text-red-600">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-black text-red-600">Emergency SOS</h3>
              <p className="text-[10px] font-black text-muted-foreground opacity-40 mt-1">One-tap police assistance</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto text-red-500/30 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Why Yatra Setu? (Features) */}
      <section className="bg-secondary/30 dark:bg-secondary/10 py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary mb-4">Core Ecosystem</div>
            <h2 className="text-4xl font-black text-foreground mb-4">
              Why Yatra Setu?
            </h2>
            <p className="text-xs font-black text-muted-foreground opacity-60 max-w-lg mx-auto leading-relaxed">
              India's first unified public transport portal for citizens and operators.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-card border border-border p-8 rounded-[32px] text-center hover:shadow-2xl transition-all group">
                <div className="inline-flex p-4 rounded-2xl mb-6 bg-secondary group-hover:bg-primary group-hover:text-white transition-all">
                  <f.icon className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="text-lg font-black text-foreground mb-3">{f.title}</h3>
                <p className="text-[10px] font-bold text-muted-foreground opacity-60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
