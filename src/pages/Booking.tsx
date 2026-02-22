import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, MapPin, Calendar, Users, ChevronLeft, ChevronRight, Check, Bus as BusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { toast } from "sonner";

import { useTranslation } from "@/contexts/LanguageContext";

type Step = "search" | "seats" | "details" | "confirm" | "payment" | "success";

const seatData = Array.from({ length: 42 }, (_, i) => {
  const num = i + 1;
  const types = [
    { range: [1, 4], type: "women", label: "W" },
    { range: [5, 6], type: "elderly", label: "E" },
    { range: [7, 8], type: "disabled", label: "D" },
  ];
  const special = types.find(t => num >= t.range[0] && num <= t.range[1]);
  return {
    num,
    type: special ? special.type : "general",
    label: special ? special.label : `${num}`,
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
  { type: "women", label: "booking.womenReserved" },
  { type: "elderly", label: "booking.elderlyReserved" },
  { type: "disabled", label: "booking.disabledReserved" },
  { type: "general", label: "booking.available" },
  { type: "booked", label: "booking.booked" },
  { type: "selected", label: "booking.yourSelection" },
];

export default function Booking() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const busIdParam = searchParams.get("busId");

  const [step, setStep] = useState<Step>("search");
  const isRental = searchParams.get("type") === "rental";

  const [buses, setBuses] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  // Rental specific state
  const [rentalDate, setRentalDate] = useState("");
  const [rentalStartTime, setRentalStartTime] = useState("09:00");
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [rentalDuration, setRentalDuration] = useState("24"); // in hours
  const [rentalFrom, setRentalFrom] = useState("");
  const [rentalDestination, setRentalDestination] = useState("");
  const [rentalPurpose, setRentalPurpose] = useState("");
  const [estimatedKm, setEstimatedKm] = useState("100");
  const FUEL_PRICE = 100;

  const [boardingStop, setBoardingStop] = useState("");

  const [droppingStop, setDroppingStop] = useState("");
  const [activeLocks, setActiveLocks] = useState<{ seatNumber: number, lockerId: string }[]>([]);
  const [lockerId] = useState(() => {
    const existing = sessionStorage.getItem("lockerId");
    if (existing) return existing;
    const newId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem("lockerId", newId);
    return newId;
  });
  const [pendingSeat, setPendingSeat] = useState<any>(null);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [passengers, setPassengers] = useState<{ seatNum: number; name: string; phone: string; age: string; gender: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [paymentTimer, setPaymentTimer] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    let timer: number;
    if (step === "payment" && paymentTimer > 0) {
      timer = window.setInterval(() => {
        setPaymentTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, paymentTimer]);

  useEffect(() => {
    if (step === "payment") {
      setPaymentTimer(300);
    }
  }, [step]);

  useEffect(() => {
    setPassengers(prev => {
      // Keep existing data for seats that are still selected
      const current = selectedSeats.map(num => {
        const existing = prev.find(p => p.seatNum === num);
        if (existing) return existing;

        const seat = seatData.find(s => s.num === num);
        const isWomenReserved = seat?.type === "women";

        return {
          seatNum: num,
          name: "",
          phone: "+91 ",
          age: "",
          gender: isWomenReserved ? "female" : "male"
        };
      });
      return current;
    });
  }, [selectedSeats]);

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

  const fetchBusRealTime = async (id: string) => {
    try {
      const bus = await api.getBusById(id);
      if (bus) {
        setSelectedBus(bus);
        setActiveLocks(bus.activeLocks || []);
      }
    } catch (err) {
      console.error("Failed to poll bus:", err);
    }
  };

  useEffect(() => {
    if (step === "seats" && selectedBus?._id) {
      const interval = setInterval(() => fetchBusRealTime(selectedBus._id), 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [step, selectedBus?._id]);

  useEffect(() => {
    if (busIdParam && step === "search") {
      const loadDirectBus = async () => {
        setLoading(true);
        try {
          const bus = await api.getBusById(busIdParam);
          if (bus) {
            setSelectedBus(bus);
            setActiveLocks(bus.activeLocks || []);
            setStep("seats");
          }
        } catch (err) {
          console.error("Failed to load direct bus:", err);
        } finally {
          setLoading(false);
        }
      };
      loadDirectBus();
      return;
    }

    if (step === "search") {
      fetchAvailableBuses();
    }
  }, [step, busIdParam]);

  const toggleSeat = async (num: number) => {
    const seat = seatData.find(s => s.num === num);
    const isBooked = selectedBus?.bookedSeats?.includes(num);
    if (!seat || isBooked) return;

    // Check if seat is locked by someone else
    const lock = activeLocks.find(l => l.seatNumber === num);
    if (lock && lock.lockerId !== lockerId) {
      toast.error(t('toasts.seatLocked'));
      return;
    }

    if (selectedSeats.includes(num)) {
      try {
        await api.unlockSeat(selectedBus._id, num, lockerId);
        setSelectedSeats(prev => prev.filter(s => s !== num));
        setActiveLocks(prev => prev.filter(l => l.seatNumber !== num));
      } catch (err) {
        console.error("Failed to unlock seat:", err);
      }
      return;
    }

    try {
      const res = await api.lockSeat(selectedBus._id, num, lockerId);
      if (res.message === "Seat already locked") {
        // Silently refresh rather than blocking with alert
        fetchBusRealTime(selectedBus._id);
        return;
      }
      setSelectedSeats(prev => [...prev, num]);
      setActiveLocks(prev => [...prev, { seatNumber: num, lockerId }]);
    } catch (err) {
      console.error("Failed to lock seat:", err);
      fetchBusRealTime(selectedBus._id);
    }
  };

  const selectedReservedTypes = selectedBus ? Array.from(new Set(
    selectedSeats
      .map(num => seatData.find(s => s.num === num))
      .filter(s => ["women", "elderly", "disabled"].includes(s?.type || ""))
      .map(s => s?.type)
  )) : [];

  const isConfirmationRequired = selectedReservedTypes.length > 0;

  const calculatePrice = () => {
    if (!selectedBus || !boardingStop || !droppingStop) return 0;
    const stops = selectedBus.route.stops;
    const startIndex = stops.findIndex((s: any) => s.name === boardingStop);
    const endIndex = stops.findIndex((s: any) => s.name === droppingStop);

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      return selectedBus.price * selectedSeats.length;
    }

    const segmentPrice = 120; // Price per stop-to-stop segment
    const numSegments = endIndex - startIndex;
    return (selectedBus.price + (numSegments * segmentPrice)) * selectedSeats.length;
  };

  const calculateFuelCost = () => {
    const km = Number(estimatedKm) || 0;
    const totalKm = isRoundTrip ? (km * 2) : (km * 1.5);
    const mileage = selectedBus?.mileage || 4.0;
    return (totalKm / mileage) * FUEL_PRICE;
  };

  const rentalFuelCost = calculateFuelCost();
  const rentalBasePrice = (Number(rentalDuration) || 0) * (selectedBus?.rentalPricePerHour || 500);
  const totalPrice = isRental ? rentalBasePrice : calculatePrice();
  const rentalGrandTotal = totalPrice + rentalFuelCost;

  useEffect(() => {
    if (!isConfirmationRequired) {
      setConfirmationChecked(false);
    }
  }, [isConfirmationRequired]);

  const handleBooking = async () => {
    setLoading(true);
    try {
      if (isRental) {
        const result = await api.createRentalRequest({
          busId: selectedBus._id,
          startDate: rentalDate,
          endDate: rentalDate,
          startTime: rentalStartTime,
          isRoundTrip: isRoundTrip,
          fromLocation: rentalFrom,
          destination: rentalDestination,
          purpose: rentalPurpose,
          estimatedKm: Number(estimatedKm),
          hoursRequested: Number(rentalDuration),
          amount: totalPrice
        });
        setBookingResult(result);
        setStep("success");
      } else {
        const result = await api.createBooking({
          busId: selectedBus._id,
          passengers: passengers.map(p => ({
            name: p.name,
            age: Number(p.age),
            gender: p.gender,
            seatNumber: p.seatNum.toString()
          })),
          date: new Date(),
          fromStop: boardingStop,
          toStop: droppingStop,
          amount: totalPrice
        });
        setBookingResult(result);
        setStep("success");
      }
      setSelectedSeats([]);
    } catch (err) {
      toast.error(t('toasts.bookingError'));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    t('booking.steps.search'),
    t('booking.steps.seats'),
    t('booking.steps.details'),
    t('booking.steps.confirm'),
    t('booking.steps.payment')
  ];
  const stepKeys: Step[] = ["search", "seats", "details", "confirm", "payment"];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl text-premium text-primary font-black ">{t('booking.title')}</h1>
          <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground mt-1 opacity-60">{t('booking.subtitle')}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-4 scrollbar-none justify-start md:justify-center">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all`}
                  style={{
                    backgroundColor: stepKeys.indexOf(step) >= i ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                    borderColor: stepKeys.indexOf(step) >= i ? "hsl(var(--primary))" : "hsl(var(--border))",
                    color: stepKeys.indexOf(step) >= i ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))"
                  }}>
                  {stepKeys.indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-[9px] font-black mt-1 whitespace-nowrap"
                  style={{ color: stepKeys.indexOf(step) >= i ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))", opacity: stepKeys.indexOf(step) >= i ? 1 : 0.4 }}>
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
          <div className="bg-card border border-border p-6 animate-slide-up rounded-3xl shadow-card">
            <h2 className="text-xs font-black text-primary mb-4 ">{t('booking.routeSelection')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('booking.from')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
                  <Input className="pl-9 bg-secondary border-border text-foreground" value={searchFrom} onChange={e => setSearchFrom(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('booking.to')}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
                  <Input className="pl-9 bg-secondary border-border text-foreground" value={searchTo} onChange={e => setSearchTo(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('booking.date')}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-9 bg-secondary border-border text-foreground"
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <Button className="w-full mb-6 font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" onClick={fetchAvailableBuses} disabled={loading}>
              {loading ? t('booking.searching') : t('booking.searchBuses')}
            </Button>

            {/* Bus selection */}
            <div className="space-y-3 mt-4">
              <h3 className="text-[10px] font-black text-foreground opacity-50 mb-2">{t('booking.availableBuses')}</h3>
              {buses.length === 0 && !loading && (
                <p className="text-center py-10 opacity-40 font-black text-xs">{t('booking.noBuses')}</p>
              )}
              {buses.map(bus => (
                <div key={bus._id} className={`bg-card border p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:shadow-elevated transition-all rounded-2xl ${selectedBus?._id === bus._id ? 'border-primary' : 'border-border'}`}
                  onClick={() => {
                    setSelectedBus(bus);
                    setStep("seats");
                  }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-foreground ">{bus.route.from} → {bus.route.to}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black bg-primary/10 text-primary">
                        {bus.type}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono opacity-40 text-muted-foreground">{bus.busNumber}</span>
                  </div>
                  <div className="flex justify-between sm:justify-start gap-4 sm:gap-6 text-sm py-2 sm:py-0 border-y sm:border-0 border-border">
                    <div className="text-center sm:text-left">
                      <p className="font-black text-lg text-foreground">{bus.departureTime}</p>
                      <p className="text-[9px] font-black text-muted-foreground opacity-40">{t('booking.dep')}</p>
                    </div>
                    <div className="flex items-center opacity-30">
                      <div className="w-8 sm:w-12 h-px bg-primary" />
                      <BusIcon className="w-3 h-3 mx-1 text-primary" />
                      <div className="w-8 sm:w-12 h-px bg-primary" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="font-black text-lg text-foreground">{bus.arrivalTime}</p>
                      <p className="text-[9px] font-black text-muted-foreground opacity-40">{t('booking.arr')}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:justify-center gap-1">
                    <div className="text-left sm:text-center">
                      <p className="font-black text-lg leading-none text-emerald-600 dark:text-emerald-400">{bus.availableSeats}</p>
                      <p className="text-[8px] font-black text-muted-foreground opacity-40">{t('booking.seats')}</p>
                    </div>
                    <div className="text-right sm:text-center">
                      <p className="font-black text-lg leading-none text-primary">₹{bus.price}</p>
                      <p className="text-[8px] font-black text-muted-foreground opacity-40">{t('booking.fare')}</p>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <Button size="sm" className="w-full sm:w-auto font-black " onClick={(e) => { e.stopPropagation(); setSelectedBus(bus); setStep("seats"); }}>
                      {t('booking.select')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Seat Selection or Rental Info */}
        {step === "seats" && (
          <div className="bg-card border border-border p-6 animate-slide-up rounded-3xl shadow-card">
            {isRental ? (
              <div className="space-y-6">
                <h2 className="text-xs font-black text-primary ">{t('booking.rentalInquiry')}</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('rental.travelDate')}</label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={rentalDate}
                        onChange={e => setRentalDate(e.target.value)}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('rental.pickupTime')}</label>
                      <Input type="time" value={rentalStartTime} onChange={e => setRentalStartTime(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('rental.duration')}</label>
                      <Input type="number" value={rentalDuration} onChange={e => setRentalDuration(e.target.value)} placeholder="e.g. 24" className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('rental.estimatedKm')}</label>
                      <Input type="number" value={estimatedKm} onChange={e => setEstimatedKm(e.target.value)} placeholder="KM" className="bg-secondary border-border" />
                      <p className="text-[8px] font-bold text-muted-foreground mt-1 italic">
                        {isRoundTrip ? `${t('rental.roundTrip')}: ${Number(estimatedKm) * 2} KM ${t('rental.total')}` : `${t('rental.oneWay')}: ${Number(estimatedKm) * 1.5} KM ${t('rental.total')}`}
                      </p>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('rental.tripType')}</label>
                      <div className="flex bg-secondary p-1 rounded-xl border border-border">
                        <button
                          onClick={() => setIsRoundTrip(true)}
                          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${isRoundTrip ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}
                        >
                          {t('rental.roundTrip')}
                        </button>
                        <button
                          onClick={() => setIsRoundTrip(false)}
                          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${!isRoundTrip ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground'}`}
                        >
                          {t('rental.oneWay')}
                        </button>
                      </div>
                    </div>
                    <div />
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('rental.fromLocation')}</label>
                      <Input value={rentalFrom} onChange={e => setRentalFrom(e.target.value)} placeholder={t('rental.pickupPlaceholder')} className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('rental.toLocation')}</label>
                      <Input value={rentalDestination} onChange={e => setRentalDestination(e.target.value)} placeholder={t('rental.dropPlaceholder')} className="bg-secondary border-border" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('rental.purpose')}</label>
                      <Input value={rentalPurpose} onChange={e => setRentalPurpose(e.target.value)} placeholder={t('rental.purposePlaceholder')} className="bg-secondary border-border" />
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[10px] font-black text-primary uppercase mb-3">Estimated Bill</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-muted-foreground">Renting Price ({rentalDuration}h):</span>
                        <span className="text-foreground">₹{totalPrice}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-muted-foreground">Petrol Price ({isRoundTrip ? Number(estimatedKm) * 2 : Number(estimatedKm) * 1.5}km total):</span>
                        <span className="text-accent">₹{rentalFuelCost}</span>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <div className="flex justify-between text-sm font-black">
                        <span className="text-primary">Total:</span>
                        <span className="text-primary">₹{rentalGrandTotal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <Button variant="outline" size="sm" className="font-black text-[9px] border-border" onClick={() => setStep("search")}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button disabled={!rentalDate || !rentalFrom || !rentalDestination || !rentalPurpose || !estimatedKm || !rentalStartTime || !rentalDuration}
                      onClick={() => setStep("confirm")}
                      className="h-10 px-6 font-black shadow-lg shadow-primary/20">
                      Review Request <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Existing Seat Selection Logic
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-black text-primary ">{t('booking.steps.seats')}</h2>
                  <span className="text-[10px] font-black text-muted-foreground opacity-60">
                    {selectedSeats.length} {t('booking.selected')}
                  </span>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-5">
                  {legendItems.map(l => (
                    <div key={l.type} className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground opacity-60">
                      <div className="w-5 h-5 rounded border-2 flex items-center justify-center text-[9px] font-bold"
                        style={{
                          backgroundColor: seatColors[l.type].bg,
                          borderColor: seatColors[l.type].border,
                          color: seatColors[l.type].text,
                        }}>
                        {l.type === "selected" ? "✓" : ""}
                      </div>
                      <span>{t(l.label)}</span>
                    </div>
                  ))}
                </div>

                {/* Bus layout */}
                <div className="flex flex-col items-center">
                  <div className="flex gap-2 overflow-x-auto pb-6 justify-center w-full">
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(6, 40px)" }}>
                      {seatData.map(seat => {
                        const isSelected = selectedSeats.includes(seat.num);
                        const locker = activeLocks.find(l => l.seatNumber === seat.num);
                        const isLockedByOthers = locker && locker.lockerId !== lockerId;
                        const isBooked = selectedBus?.bookedSeats?.includes(seat.num);

                        let type = seat.type;
                        if (isBooked || isLockedByOthers) type = "booked";

                        const colors = isSelected ? seatColors.selected : seatColors[type];
                        return (
                          <button
                            key={seat.num}
                            onClick={() => toggleSeat(seat.num)}
                            disabled={isBooked || isLockedByOthers}
                            className="w-10 h-10 rounded border-2 text-[10px] font-black transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
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

                  {isConfirmationRequired && (
                    <div className="w-full mt-2 animate-slide-up">
                      <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center gap-4">
                        <div
                          onClick={() => setConfirmationChecked(!confirmationChecked)}
                          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all duration-300 ${confirmationChecked
                            ? "bg-primary border-primary shadow-lg shadow-primary/20"
                            : "bg-card border-border hover:border-primary/50"
                            }`}
                        >
                          {confirmationChecked && <Check className="w-4 h-4 text-white stroke-[4px]" />}
                        </div>
                        <p className="text-[10px] font-black text-foreground leading-tight">
                          {t('booking.seatConfirmationPrefix')}
                          <span className="font-black text-primary mx-1 ">
                            {selectedReservedTypes.map((t_key, i) => {
                              const label = t_key === "women" ? t('booking.womenReserved') : t_key === "elderly" ? t('booking.elderlyReserved') : t('booking.disabledReserved');
                              return i === 0 ? label : i === selectedReservedTypes.length - 1 ? ` ${t('booking.and')} ${label}` : `, ${label}`;
                            }).join("")}
                          </span>
                          {t('booking.seatConfirmationSuffix')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stop Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-6 border-t border-border mt-4">
                  <div>
                    <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('booking.boardingPoint')}</label>
                    <select
                      className="w-full h-11 px-3 border border-border bg-secondary rounded-xl text-xs font-bold text-foreground focus:border-primary transition-colors"
                      value={boardingStop}
                      onChange={e => {
                        const val = e.target.value;
                        setBoardingStop(val);
                        if (selectedBus && val) {
                          const boardIdx = selectedBus.route.stops.findIndex((s: any) => s.name === val);
                          const dropIdx = selectedBus.route.stops.findIndex((s: any) => s.name === droppingStop);
                          if (dropIdx !== -1 && dropIdx <= boardIdx) {
                            setDroppingStop("");
                          }
                        }
                      }}
                    >
                      <option value="">{t('booking.selectBoarding')}</option>
                      {selectedBus?.route?.stops?.map((s: any) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('booking.droppingPoint')}</label>
                    <select
                      className="w-full h-11 px-3 border border-border bg-secondary rounded-xl text-xs font-bold text-foreground focus:border-primary transition-colors"
                      value={droppingStop}
                      onChange={e => setDroppingStop(e.target.value)}
                    >
                      <option value="">{t('booking.selectDropping')}</option>
                      {selectedBus?.route?.stops?.filter((_: any, idx: number) => {
                        if (!boardingStop) return true;
                        const boardIdx = selectedBus.route.stops.findIndex((bs: any) => bs.name === boardingStop);
                        return idx > boardIdx;
                      }).map((s: any) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Button variant="outline" size="sm" className="font-black text-[9px] border-border" onClick={() => setStep("search")}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> {t('common.back')}
                  </Button>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground opacity-60 mb-2">
                      {selectedSeats.length} {t('booking.seats')} | {t('booking.total')}: <span className="font-black text-primary ">₹{totalPrice}</span>
                    </p>
                    <Button disabled={selectedSeats.length === 0 || !boardingStop || !droppingStop || (isConfirmationRequired && !confirmationChecked)}
                      onClick={() => setStep("details")}
                      className="h-10 px-6 font-black shadow-lg shadow-primary/20">
                      {t('common.continue')} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Passenger Details */}
        {step === "details" && (
          <div className="bg-card border border-border p-6 animate-slide-up space-y-8 rounded-3xl shadow-card">
            <h2 className="text-xs font-black text-primary ">{t('booking.passengerInfo')}</h2>

            {passengers.map((passenger, index) => {
              const seat = seatData.find(s => s.num === passenger.seatNum);
              const isWomenReserved = seat?.type === "women";

              return (
                <div key={passenger.seatNum} className="space-y-4 pb-6 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-md">
                      {passenger.seatNum}
                    </span>
                    <span className="text-[10px] font-black text-muted-foreground opacity-60">{t('booking.passengerForSeat')} {passenger.seatNum}</span>
                    {isWomenReserved && (
                      <span className="text-[8px] font-black bg-pink-500/10 text-pink-600 dark:text-pink-400 px-3 py-1 rounded-full ml-auto border border-pink-500/20 ">{t('booking.womenReserved')}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('booking.fullName')}</label>
                      <Input
                        className="bg-secondary border-border"
                        placeholder={t('booking.namePlaceholder')}
                        value={passenger.name}
                        onChange={e => {
                          const newPass = [...passengers];
                          newPass[index].name = e.target.value;
                          setPassengers(newPass);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('booking.mobileNumber')}</label>
                      <Input
                        className="bg-secondary border-border font-mono text-xs"
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={passenger.phone}
                        onChange={e => {
                          let val = e.target.value;
                          if (!val.startsWith("+91")) val = "+91 " + val.replace(/\D/g, "");
                          const digitsOnly = val.replace(/\D/g, "").substring(2);
                          if (digitsOnly.length <= 10) {
                            const newPass = [...passengers];
                            newPass[index].phone = "+91 " + digitsOnly;
                            setPassengers(newPass);
                          }
                        }}
                      />
                      {passenger.phone && passenger.phone.replace(/\D/g, "").substring(2).length > 0 && passenger.phone.replace(/\D/g, "").substring(2).length < 10 && (
                        <p className="text-[9px] text-red-600 dark:text-red-400 mt-1 font-black ">{t('booking.invalidNumber')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('booking.age')}</label>
                      <Input
                        className="bg-secondary border-border"
                        type="number"
                        placeholder={t('booking.agePlaceholder')}
                        min="1"
                        max="120"
                        value={passenger.age}
                        onChange={e => {
                          const val = e.target.value;
                          if (val.length <= 3) {
                            const newPass = [...passengers];
                            newPass[index].age = val;
                            setPassengers(newPass);
                          }
                        }}
                      />
                      {passenger.age && (parseInt(passenger.age) < 1 || parseInt(passenger.age) > 120) && (
                        <p className="text-[9px] text-red-600 dark:text-red-400 mt-1 font-black ">{t('booking.invalidAge')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground opacity-50 mb-1.5">{t('booking.gender')}</label>
                      <select
                        className={`w-full h-10 px-3 border rounded-xl text-xs font-bold bg-secondary border-border text-foreground transition-all ${isWomenReserved ? "cursor-not-allowed opacity-50" : ""}`}
                        value={passenger.gender}
                        disabled={isWomenReserved}
                        onChange={e => {
                          const newPass = [...passengers];
                          newPass[index].gender = e.target.value;
                          setPassengers(newPass);
                        }}>
                        <option value="male">{t('booking.male')}</option>
                        <option value="female">{t('booking.female')}</option>
                        <option value="other">{t('booking.other')}</option>
                      </select>
                      {isWomenReserved && (
                        <p className="text-[8px] text-primary/60 mt-1 font-black ">{t('booking.genderLocked')}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" size="sm" className="font-black text-[9px] border-border" onClick={() => setStep("seats")}>
                <ChevronLeft className="w-4 h-4 mr-1" /> {t('common.back')}
              </Button>
              <Button onClick={() => setStep("confirm")}
                disabled={passengers.some(p =>
                  !p.name ||
                  p.phone.replace(/\D/g, "").substring(2).length !== 10 ||
                  !p.age ||
                  parseInt(p.age) < 1 ||
                  parseInt(p.age) > 120
                )}
                className="h-10 px-6 font-black shadow-lg shadow-primary/20">
                {t('booking.reviewBooking')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && (
          <div className="animate-slide-up space-y-4">
            <div className="bg-card border border-border p-6 rounded-3xl shadow-card">
              <h2 className="text-xs font-black text-primary mb-4">{isRental ? t('booking.rentalRequestSummary') : t('booking.bookingSummary')}</h2>
              <div className="space-y-4">
                {isRental ? (
                  <>
                    {[
                      [t('booking.busOperator'), selectedBus.operator],
                      [t('booking.busNo'), `${selectedBus.busNumber} (${selectedBus.type})`],
                      [t('rental.travelDate'), `${rentalDate} @ ${rentalStartTime}`],
                      [t('rental.tripType'), isRoundTrip ? t('rental.roundTrip') : t('rental.oneWay')],
                      [t('rental.fromLocation'), rentalFrom],
                      [t('rental.toLocation'), rentalDestination],
                      [t('rental.duration'), `${rentalDuration} ${t('common.hours')}`],
                      [t('booking.tripDistance'), `${estimatedKm} ${t('booking.km')}`],
                      [t('booking.totalKm'), `${isRoundTrip ? Number(estimatedKm) * 2 : Number(estimatedKm) * 1.5} ${t('booking.km')}`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-[10px] font-black text-muted-foreground opacity-50">{label}</span>
                        <span className="text-xs font-black text-foreground">{value}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      [t('booking.route'), `${selectedBus.route.from} → ${selectedBus.route.to}`],
                      [t('booking.busNo'), `${selectedBus.busNumber} (${selectedBus.type})`],
                      [t('booking.dep'), selectedBus.departureTime],
                      [t('booking.droppingPoint'), droppingStop],
                      [t('booking.seats'), selectedSeats.join(", ")],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-[10px] font-black text-muted-foreground opacity-50">{label}</span>
                        <span className="text-xs font-black text-foreground">{value}</span>
                      </div>
                    ))}

                    <div className="pt-2">
                      <span className="text-[9px] font-black text-muted-foreground block mb-3 opacity-40">{t('booking.passengerList')}</span>
                      <div className="space-y-2">
                        {passengers.map(p => (
                          <div key={p.seatNum} className="flex items-center justify-between p-3 bg-secondary rounded-xl border border-border">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-foreground ">{p.name}</span>
                              <span className="text-[9px] font-black text-muted-foreground opacity-50">{p.gender} • {p.age} {t('booking.yrs')} • {p.phone}</span>
                            </div>
                            <span className="w-6 h-6 rounded bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center border border-primary/20 shadow-sm">
                              {p.seatNum}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between py-4 mt-4 border-t-2 border-dashed border-border">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-primary">{t('booking.totalEstimate')}</span>
                    {isRental && (
                      <span className="text-[8px] font-black text-muted-foreground italic">
                        ({t('booking.baseFare')} ₹{totalPrice} + {t('booking.petrol')} ₹{rentalFuelCost})
                      </span>
                    )}
                  </div>
                  <span className="text-xl font-black text-primary">₹{isRental ? rentalGrandTotal : totalPrice}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" className="font-black text-[9px] border-border" onClick={() => setStep(isRental ? "seats" : "details")}>
                <ChevronLeft className="w-4 h-4 mr-1" /> {t('common.back')}
              </Button>
              <Button onClick={handleBooking} disabled={loading} className="h-10 px-6 font-black shadow-lg shadow-primary/20">
                {loading ? t('common.loading') : (isRental ? t('booking.submitRentalRequest') : t('booking.confirmAndBook'))}
                {!loading && <Check className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Payment */}
        {step === "payment" && selectedBus && (
          <div className="animate-slide-up space-y-4 max-w-md mx-auto">
            <div className="bg-card border border-border p-8 text-center border-primary/20 shadow-xl overflow-hidden relative rounded-3xl">
              <div className="absolute top-0 right-0 p-3 bg-primary/5 text-primary text-[10px] font-black border-l border-b border-primary/20">
                {t('payment.secureGateway')}
              </div>

              <h2 className="text-xl font-black text-foreground mb-1 ">{t('payment.scanAndPay')}</h2>
              <p className="text-[9px] text-muted-foreground font-black mb-6 opacity-60 ">{t('payment.upiSubtitle')}</p>

              <div className="bg-white p-4 rounded-2xl shadow-inner border border-border inline-block mb-6 relative group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${selectedBus.ownerUPI || '8302391227-2@ybl'}&pn=${selectedBus.operator}&am=${totalPrice}&cu=INR&tn=YatraSetuBooking`)}`}
                  alt={t('payment.qrAlt')}
                  className="w-48 h-48 mx-auto"
                />
                <div className="absolute inset-0 border-2 border-primary/20 rounded-2xl pointer-events-none group-hover:border-primary/40 transition-colors"></div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-primary ">₹{totalPrice}</span>
                  <span className="text-[9px] font-black text-muted-foreground opacity-40">{t('payment.payableAmount')}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-secondary rounded-xl border border-border">
                    <span className="text-[8px] font-black text-muted-foreground block mb-1 opacity-40">{t('payment.receiver')}</span>
                    <span className="text-[10px] font-black text-foreground truncate block ">{selectedBus.operator}</span>
                  </div>
                  <div className="p-3 bg-secondary rounded-xl border border-border">
                    <span className="text-[8px] font-black text-muted-foreground block mb-1 opacity-40">{t('payment.upiId')}</span>
                    <span className="text-[10px] font-black text-foreground truncate block ">{selectedBus.ownerUPI || '8302391227-2@ybl'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-6 text-primary dark:text-blue-400 bg-primary-light/10 py-2 rounded-lg border border-primary/20">
                <span className="text-[10px] font-black ">{t('payment.expiresIn')}:</span>
                <span className="text-sm font-mono font-black ">{Math.floor(paymentTimer / 60)}:{(paymentTimer % 60).toString().padStart(2, '0')}</span>
              </div>

              <p className="text-[9px] text-muted-foreground mb-6 opacity-40 font-black ">{t('payment.doNotRefresh')}</p>

              <Button
                size="lg"
                className="w-full h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] font-black "
                onClick={handleBooking}
                disabled={loading || paymentTimer <= 0}
              >
                {loading ? t('payment.verifying') : t('payment.confirmButton')}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setStep("confirm")}
                className="text-[9px] font-black text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 opacity-60"
              >
                <ChevronLeft className="w-3 h-3" /> {t('payment.editBooking')}
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="bg-card border border-border p-10 text-center animate-scale-in rounded-3xl shadow-card">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <Check className="w-10 h-10 shadow-sm" />
            </div>
            <h2 className="text-2xl font-black text-primary mb-2 ">{isRental ? t('booking.successRental') : t('booking.successBooking')}</h2>
            <p className="text-muted-foreground text-xs mb-8 font-black opacity-60">
              {isRental ? t('booking.rentalSuccessDesc') : t('booking.bookingSuccessDesc')}
            </p>

            <div className="bg-secondary rounded-2xl p-6 mb-8 text-left border border-border">
              <div className="flex justify-between mb-4">
                <span className="text-[10px] font-black text-muted-foreground opacity-40">{t('booking.pnrNumber')}</span>
                <span className="text-sm font-mono font-black text-primary ">{bookingResult?.pnr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-muted-foreground opacity-40">{isRental ? t('booking.totalAmount') : t('booking.totalPaid')}</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 ">₹{bookingResult?.amount}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="font-black text-[9px] border-border" asChild>
                <Link to="/"> {t('common.backToHome')}</Link>
              </Button>
              <Button className="font-black text-[9px] " asChild>
                <Link to={isRental ? "/profile/bookings" : "/verify"}>
                  {isRental ? t('booking.myRequests') : t('booking.verifyTicket')}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout >
  );
}
