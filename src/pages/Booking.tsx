import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Calendar, Users, ChevronLeft, ChevronRight, Check, Bus as BusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";

type Step = "search" | "seats" | "details" | "confirm" | "success";

const seatData = Array.from({ length: 42 }, (_, i) => {
  const num = i + 1;
  const types = [
    { range: [1, 4], type: "women", label: "W" },
    { range: [5, 6], type: "elderly", label: "E" },
    { range: [7, 8], type: "disabled", label: "D" },
  ];
  const special = types.find(t => num >= t.range[0] && num <= t.range[1]);
  const booked = [3, 6, 9, 10, 15, 18, 21, 24, 27, 35, 38].includes(num);
  return {
    num,
    type: booked ? "booked" : special ? special.type : "general",
    label: special ? special.label : `${num}`,
    available: !booked,
  };
});

const seatColors: Record<string, { bg: string; text: string; border: string }> = {
  women: { bg: "hsl(var(--seat-women) / 0.15)", text: "hsl(var(--seat-women))", border: "hsl(var(--seat-women))" },
  elderly: { bg: "hsl(var(--seat-elderly) / 0.15)", text: "hsl(var(--seat-elderly))", border: "hsl(var(--seat-elderly))" },
  disabled: { bg: "hsl(var(--seat-disabled) / 0.15)", text: "hsl(var(--seat-disabled))", border: "hsl(var(--seat-disabled))" },
  general: { bg: "hsl(var(--seat-general) / 0.12)", text: "hsl(var(--seat-general))", border: "hsl(var(--seat-general))" },
  booked: { bg: "hsl(var(--seat-booked) / 0.15)", text: "hsl(var(--seat-booked))", border: "hsl(var(--seat-booked))" },
  selected: { bg: "hsl(var(--primary))", text: "hsl(var(--primary-foreground))", border: "hsl(var(--primary))" },
};

const legendItems = [
  { type: "women", label: "Women Reserved" },
  { type: "elderly", label: "Elderly Reserved" },
  { type: "disabled", label: "Disabled Reserved" },
  { type: "general", label: "Available" },
  { type: "booked", label: "Booked" },
  { type: "selected", label: "Your Selection" },
];

export default function Booking() {
  const [step, setStep] = useState<Step>("search");
  const [buses, setBuses] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [formData, setFormData] = useState({ name: "", phone: "", age: "", gender: "male" });
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const [searchFrom, setSearchFrom] = useState("Bengaluru");
  const [searchTo, setSearchTo] = useState("Mysuru");
  const [searchDate, setSearchDate] = useState("");

  const fetchAvailableBuses = async () => {
    setLoading(true);
    try {
      const data = await api.searchBuses(searchFrom, searchTo, searchDate);
      setBuses(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === "search") {
      fetchAvailableBuses();
    }
  }, [step]);

  const toggleSeat = (num: number) => {
    const seat = seatData.find(s => s.num === num);
    if (!seat?.available) return;
    setSelectedSeats(prev =>
      prev.includes(num) ? prev.filter(s => s !== num) : prev.length < 4 ? [...prev, num] : prev
    );
  };

  const handleBooking = async () => {
    setLoading(true);
    try {
      const passengers = selectedSeats.map(seat => ({
        name: formData.name, // Simplified for demo, usually one entry per seat
        age: Number(formData.age),
        gender: formData.gender,
        seatNumber: seat.toString()
      }));

      const result = await api.createBooking({
        busId: selectedBus._id,
        passengers,
        date: new Date(),
        amount: selectedSeats.length * selectedBus.price
      });
      setBookingResult(result);
      setStep("success");
    } catch (err) {
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Search", "Select Seat", "Passenger Details", "Confirm"];
  const stepKeys: Step[] = ["search", "seats", "details", "confirm"];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl text-premium text-primary">Book Bus Ticket</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Online Advance Ticket Booking — Yatra Setu Portal</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-4 scrollbar-none justify-start md:justify-center">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all`}
                  style={{
                    backgroundColor: stepKeys.indexOf(step) >= i ? "hsl(var(--primary))" : "hsl(var(--muted))",
                    borderColor: stepKeys.indexOf(step) >= i ? "hsl(var(--primary))" : "hsl(var(--border))",
                    color: stepKeys.indexOf(step) >= i ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))"
                  }}>
                  {stepKeys.indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-[10px] mt-1 whitespace-nowrap text-premium"
                  style={{ color: stepKeys.indexOf(step) >= i ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-12 md:w-20 h-0.5 mt-[-12px] mx-1"
                  style={{ backgroundColor: (stepKeys.indexOf(step) > i || step === "success") ? "hsl(var(--primary))" : "hsl(var(--border))" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Search */}
        {step === "search" && (
          <div className="portal-card p-6 animate-slide-up">
            <h2 className="text-sm text-premium text-primary mb-4">Route Selection</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[10px] text-premium opacity-50 mb-1.5">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  <Input className="pl-9" value={searchFrom} onChange={e => setSearchFrom(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-premium opacity-50 mb-1.5">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
                  <Input className="pl-9" value={searchTo} onChange={e => setSearchTo(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-premium opacity-50 mb-1.5">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  <Input type="date" className="pl-9" value={searchDate} onChange={e => setSearchDate(e.target.value)} />
                </div>
              </div>
            </div>
            <Button className="w-full mb-6" onClick={fetchAvailableBuses} disabled={loading}>
              {loading ? "Searching..." : "Search Available Buses"}
            </Button>

            {/* Bus selection */}
            <div className="space-y-3 mt-4">
              <h3 className="text-sm text-premium text-primary">Available Buses</h3>
              {buses.length === 0 && !loading && (
                <p className="text-center py-4 opacity-50">No buses found for this route.</p>
              )}
              {buses.map(bus => (
                <div key={bus._id} className={`portal-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:shadow-elevated transition-shadow ${selectedBus?._id === bus._id ? 'border-primary' : ''}`}
                  onClick={() => {
                    setSelectedBus(bus);
                    setStep("seats");
                  }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm sm:text-base text-premium text-primary leading-tight">{bus.route.from} → {bus.route.to}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter italic bg-primary-muted text-primary flex-shrink-0">
                        {bus.type}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60 uppercase tracking-widest">{bus.busNumber}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start gap-4 sm:gap-6 text-sm py-2 sm:py-0 border-y sm:border-0 border-slate-100">
                    <div className="text-center sm:text-left">
                      <p className="font-bold text-base sm:text-lg">{bus.departureTime}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Dep</p>
                    </div>
                    <div className="flex items-center opacity-30">
                      <div className="w-8 sm:w-12 h-px bg-slate-400" />
                      <BusIcon className="w-3 h-3 mx-1" />
                      <div className="w-8 sm:w-12 h-px bg-slate-400" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-bold text-base sm:text-lg">{bus.arrivalTime}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Arr</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:justify-center gap-1">
                    <div className="text-left sm:text-center">
                      <p className="font-bold text-lg text-success leading-none">{bus.availableSeats}</p>
                      <p className="text-[9px] uppercase font-bold text-slate-400">Seats</p>
                    </div>
                    <div className="text-right sm:text-center">
                      <p className="font-bold text-lg text-primary leading-none">₹{bus.price}</p>
                      <p className="text-[9px] uppercase font-bold text-slate-400">Fare</p>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <Button size="sm" className="w-full sm:w-auto" onClick={(e) => { e.stopPropagation(); setSelectedBus(bus); setStep("seats"); }}>
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Seat Selection */}
        {step === "seats" && (
          <div className="portal-card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "hsl(var(--primary))" }}>Select Your Seat(s)</h2>
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {selectedSeats.length} selected (max 4)
              </span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-5">
              {legendItems.map(l => (
                <div key={l.type} className="flex items-center gap-1.5 text-xs">
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center text-[9px] font-bold"
                    style={{
                      backgroundColor: seatColors[l.type].bg,
                      borderColor: seatColors[l.type].border,
                      color: seatColors[l.type].text,
                    }}>
                    {l.type === "selected" ? "✓" : ""}
                  </div>
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Bus layout (Conceptual) */}
            <div className="flex gap-2 overflow-x-auto pb-6 justify-center">
              <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(6, 40px)" }}>
                {seatData.map(seat => {
                  const isSelected = selectedSeats.includes(seat.num);
                  const colors = isSelected ? seatColors.selected : seatColors[seat.type];
                  return (
                    <button
                      key={seat.num}
                      onClick={() => toggleSeat(seat.num)}
                      disabled={!seat.available}
                      className="w-10 h-10 rounded border-2 text-[10px] font-bold transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    >
                      {seat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep("search")}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="text-right">
                <p className="text-sm mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Seats: {selectedSeats.join(", ") || "—"} | Total: ₹{selectedSeats.length * (selectedBus?.price || 0)}
                </p>
                <Button disabled={selectedSeats.length === 0} onClick={() => setStep("details")}
                  style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Passenger Details */}
        {step === "details" && (
          <div className="portal-card p-6 animate-slide-up">
            <h2 className="text-base font-semibold mb-4" style={{ color: "hsl(var(--primary))" }}>Passenger Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Full Name</label>
                <Input placeholder="As per Aadhaar / ID" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Mobile Number</label>
                <Input type="tel" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Age</label>
                <Input type="number" placeholder="Age" value={formData.age} onChange={e => setFormData(p => ({ ...p, age: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Gender</label>
                <select className="w-full h-9 px-3 border rounded-md text-sm"
                  style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
                  value={formData.gender}
                  onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep("seats")}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep("confirm")}
                disabled={!formData.name || !formData.phone}
                style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                Review Booking <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && (
          <div className="animate-slide-up space-y-4">
            <div className="portal-card p-6">
              <h2 className="text-base font-semibold mb-4" style={{ color: "hsl(var(--primary))" }}>Booking Summary</h2>
              <div className="space-y-3">
                {[
                  ["Route", `${selectedBus.route.from} → ${selectedBus.route.to}`],
                  ["Bus No.", `${selectedBus.busNumber} (${selectedBus.type})`],
                  ["Departure", selectedBus.departureTime],
                  ["Seats", selectedSeats.join(", ")],
                  ["Passenger", formData.name || "—"],
                  ["Mobile", formData.phone || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: "hsl(var(--border))" }}>
                    <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
                    <span className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2">
                  <span className="text-base font-bold" style={{ color: "hsl(var(--primary))" }}>Total Amount</span>
                  <span className="text-xl font-bold" style={{ color: "hsl(var(--primary))" }}>₹ {selectedSeats.length * selectedBus.price}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep("details")}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button size="lg" onClick={handleBooking} disabled={loading}
                style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                <Check className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : `Confirm & Pay ₹${selectedSeats.length * selectedBus.price}`}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="portal-card p-10 text-center animate-scale-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black italic text-primary mb-2 uppercase tracking-tighter">Booking Successful!</h2>
            <p className="text-slate-400 text-sm mb-8">Your ticket has been confirmed and stored in the database.</p>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left border border-slate-100">
              <div className="flex justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PNR Number</span>
                <span className="text-sm font-mono font-black text-primary">{bookingResult?.pnr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Paid</span>
                <span className="text-sm font-black text-emerald-600">₹{bookingResult?.amount}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
              <Button asChild>
                <Link to="/verify">Verify Ticket</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
