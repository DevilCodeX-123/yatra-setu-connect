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
      <section style={{ backgroundColor: "hsl(var(--primary))" }} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-semibold"
              style={{ backgroundColor: "hsl(var(--accent) / 0.15)", color: "hsl(var(--accent))", border: "1px solid hsl(var(--accent) / 0.3)" }}>
              <Radio className="w-3 h-3 live-pulse" />
              Live Bus Tracking Active
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl leading-tight text-white mb-3 text-premium">
              यात्रा सेतु — Smart Bus Portal
            </h1>
            <p className="text-sm sm:text-base opacity-80 max-w-xl mx-auto" style={{ color: "hsl(0 0% 90%)" }}>
              Book tickets, track buses live, and travel safely across India's public bus network.
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-3xl mx-auto bg-card rounded-xl shadow-elevated p-5 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-1">
                <label className="block text-xs mb-1.5 text-premium opacity-60">
                  From
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  <Input
                    className="pl-9 text-sm"
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
                    <div className="absolute top-full left-0 w-full bg-card border rounded-b-lg shadow-elevated z-50 max-h-40 overflow-y-auto">
                      {fromSuggestions.map(city => (
                        <div
                          key={city}
                          className="px-4 py-2 text-sm hover:bg-primary/5 cursor-pointer text-premium"
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
                <label className="block text-xs mb-1.5 text-premium opacity-60">
                  To
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
                  <Input
                    className="pl-9 text-sm"
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
                    <div className="absolute top-full left-0 w-full bg-card border rounded-b-lg shadow-elevated z-50 max-h-40 overflow-y-auto">
                      {toSuggestions.map(city => (
                        <div
                          key={city}
                          className="px-4 py-2 text-sm hover:bg-primary/5 cursor-pointer text-premium"
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
                <label className="block text-xs mb-1.5 text-premium opacity-60">
                  Date of Travel
                </label>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {upcomingDates.map(({ dateStr, dayName, dayNum }) => (
                    <button
                      key={dateStr}
                      onClick={() => toggleDate(dateStr)}
                      className={`flex flex-col items-center justify-center min-w-[48px] h-12 rounded-xl border transition-all ${selectedDates.includes(dateStr)
                        ? "bg-primary text-white border-primary shadow-md scale-105"
                        : "bg-card text-premium hover:border-primary/50"
                        }`}
                    >
                      <span className="text-[7px] font-black uppercase tracking-tighter opacity-60">
                        {dayName}
                      </span>
                      <span className="text-xs font-bold leading-none mt-0.5">
                        {dayNum}
                      </span>
                    </button>
                  ))}

                  {/* Calendar Toggle */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => (document.getElementById("custom-date-picker") as HTMLInputElement)?.showPicker()}
                      className="flex flex-col items-center justify-center min-w-[48px] h-12 rounded-xl border bg-card text-premium hover:border-primary/50 transition-all"
                      title="Select Custom Date"
                    >
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">Custom</span>
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

                {selectedDates.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedDates.map(d => {
                      const found = upcomingDates.find(ud => ud.dateStr === d);
                      const display = found ? found.dayName : d;
                      return (
                        <div key={d} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-bold">
                          {display}
                          <button onClick={() => toggleDate(d)} className="ml-1 hover:text-danger">×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="md:col-span-1">
                <Button className="w-full text-premium h-11" onClick={handleSearch}
                  style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                  <Search className="w-4 h-4 mr-2" />
                  Search Buses
                </Button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                Advance booking up to 30 days
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                Cancellation available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-b border-border shadow-card">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 md:py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-x divide-border">
            {[
              { label: "Buses Running Today", value: dynamicStats.busesRunningToday.toLocaleString(), icon: Bus },
              { label: "Passengers Served", value: dynamicStats.passengersServed >= 100000 ? `${(dynamicStats.passengersServed / 100000).toFixed(1)} Lakh` : dynamicStats.passengersServed.toLocaleString(), icon: Users },
              { label: "Routes Active", value: dynamicStats.routesActive.toLocaleString(), icon: Navigation },
              { label: "CO₂ Saved (KG)", value: dynamicStats.co2Saved.toLocaleString(), icon: Leaf },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-3 px-4 py-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--primary-muted))" }}>
                  <stat.icon className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-xl leading-tight text-premium text-primary">{stat.value}</p>
                  <p className="text-[10px] leading-tight font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Running Buses - Only shown after search */}
      {searched && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full live-pulse bg-emerald-500" />
                <h2 className="text-lg text-premium text-primary">Search Results</h2>
              </div>
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                Found {liveBuses.length} buses for your route
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {loading ? (
              <div className="text-center py-10 opacity-50">Searching for buses...</div>
            ) : liveBuses.length === 0 ? (
              <div className="portal-card p-10 text-center text-premium text-primary">
                <p className="text-lg mb-2">No buses found for this route.</p>
                <p className="text-xs text-slate-400">Try searching with different cities or dates.</p>
              </div>
            ) : (
              liveBuses.map(bus => (
                <div key={bus._id} className="portal-card p-4 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-elevated transition-shadow">
                  {/* Route info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-premium text-primary">{bus.route.from}</span>
                      <ArrowRight className="w-4 h-4 text-primary opacity-30" />
                      <span className="text-sm text-premium text-primary">{bus.route.to}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter italic bg-primary-muted text-primary">
                        {bus.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <span className="font-mono">{bus.busNumber}</span>
                      <span>•</span>
                      <span>{bus.km} km</span>
                      <span>•</span>
                      <Link to={`/tracking/${bus.busNumber}`} className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                        <Navigation className="w-3 h-3 live-pulse" style={{ color: "hsl(var(--success))" }} />
                        Live Tracking
                      </Link>
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-lg text-premium text-[#1E293B]">{bus.departureTime}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{bus.route.from}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
                      <Bus className="w-3 h-3 my-0.5" style={{ color: "hsl(var(--accent))" }} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg text-premium text-[#1E293B]">{bus.arrivalTime}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{bus.route.to}</p>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="flex flex-col items-center gap-1 min-w-[80px]">
                    <p className="text-xl text-premium" style={{ color: getAvailabilityColor(bus.availableSeats, bus.totalSeats) }}>
                      {bus.availableSeats}
                    </p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>of {bus.totalSeats} seats</p>
                    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "hsl(var(--muted))" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((bus.totalSeats - bus.availableSeats) / bus.totalSeats) * 100)}%`,
                          backgroundColor: getAvailabilityColor(bus.availableSeats, bus.totalSeats)
                        }} />
                    </div>
                  </div>

                  {/* Status & Book */}
                  <div className="flex flex-col items-end gap-2 min-w-[130px]">
                    <span className={`stat-badge ${bus.status === "On Time" ? "bg-success-light text-success" : bus.status === "Full" ? "bg-danger-light text-danger" : "bg-warning-light text-warning"}`}>
                      {bus.status}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/5" asChild>
                        <Link to={`/tracking/${bus.busNumber}`}>Track</Link>
                      </Button>
                      <Button size="sm" disabled={bus.availableSeats === 0}
                        style={{
                          backgroundColor: bus.availableSeats === 0 ? "hsl(var(--muted))" : "hsl(var(--primary))",
                          color: bus.availableSeats === 0 ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))"
                        }}
                        asChild={bus.availableSeats > 0}>
                        {bus.availableSeats > 0 ? <Link to={`/booking?busId=${bus._id}`}>Book Now</Link> : <span>Not Available</span>}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}


      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/booking" className="portal-card p-5 flex items-center gap-4 hover:shadow-elevated transition-shadow group">
            <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: "hsl(var(--primary))" }}>
              <Bus className="w-6 h-6" style={{ color: "hsl(var(--accent))" }} />
            </div>
            <div>
              <h3 className="text-sm text-premium text-primary">Book a Ticket</h3>
              <p className="text-xs text-slate-400 font-medium">Advanced booking & seat selection</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
          </Link>
          <Link to="/verify" className="portal-card p-5 flex items-center gap-4 hover:shadow-elevated transition-shadow group">
            <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: "hsl(var(--success-light))" }}>
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-sm text-premium text-primary">Verify Ticket</h3>
              <p className="text-xs text-slate-400 font-medium">Check booking validity instantly</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
          </Link>
          <Link to="/emergency" className="portal-card p-5 flex items-center gap-4 hover:shadow-elevated transition-shadow group"
            style={{ borderColor: "hsl(var(--danger) / 0.3)" }}>
            <div className="p-3 rounded-xl shrink-0 bg-danger-light">
              <AlertCircle className="w-6 h-6 text-danger" />
            </div>
            <div>
              <h3 className="text-sm text-premium text-danger">Emergency Help</h3>
              <p className="text-xs text-slate-400 font-medium">One-tap police/ambulance alert</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
          </Link>
        </div>
      </section>

      {/* Why Yatra Setu? (Features) */}
      <section style={{ backgroundColor: "hsl(var(--primary-muted))" }} className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl text-premium text-primary mb-2">
              Why Yatra Setu?
            </h2>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Built for India's public transport ecosystem
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(f => (
              <div key={f.title} className="portal-card p-5 text-center hover:shadow-elevated transition-shadow">
                <div className="inline-flex p-3 rounded-xl mb-3"
                  style={{ backgroundColor: "hsl(var(--primary))" }}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm mb-1 text-premium text-primary">{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
