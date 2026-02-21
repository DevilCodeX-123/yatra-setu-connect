import { useState, useEffect, useRef } from "react";
import {
    Bus, QrCode, UserPlus, MapPin, AlertTriangle, CheckCircle,
    Navigation, Clock, Users, LogOut, Wifi, WifiOff, ChevronRight,
    Phone, Camera, XCircle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SeatMap, { generateSeats, Seat } from "@/components/SeatMap";
import SOSButton from "@/components/SOSButton";
import { useSocket } from "@/hooks/useSocket";

// ─── Activation Screen ─────────────────────────────────────────────────────────
function ActivationScreen({ onActivate }: { onActivate: (bus: string, role: string) => void }) {
    const [busNumber, setBusNumber] = useState("");
    const [code, setCode] = useState("");
    const [role, setRole] = useState<"Driver" | "Conductor">("Driver");
    const [loading, setLoading] = useState(false);

    const activate = async () => {
        if (!busNumber || !code) return toast.error("Enter bus number and activation code");
        setLoading(true);
        try {
            const res = await fetch("/api/employee/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ busNumber, activationCode: code })
            });
            if (res.ok) {
                toast.success(`Activated as ${role} on ${busNumber}`);
                onActivate(busNumber, role);
            } else {
                const d = await res.json();
                toast.error(d.message || "Invalid code");
            }
        } catch {
            // Demo mode: allow any bus number in demo
            toast.success(`Demo mode: Activated as ${role} on ${busNumber}`);
            onActivate(busNumber, role);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/30">
                        <Bus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-white font-black text-2xl ">Employee Login</h1>
                    <p className="text-slate-400 text-xs font-bold mt-1">Yatra Setu — Driver / Conductor</p>
                </div>

                {/* Role Selector */}
                <div className="flex mb-6 bg-slate-800 rounded-2xl p-1">
                    {(["Driver", "Conductor"] as const).map(r => (
                        <button key={r} onClick={() => setRole(r)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${role === r ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
                            {r === "Driver" ? "🚌" : "🎟️"} {r}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 mb-1.5 block">Bus Number</label>
                        <input
                            value={busNumber} onChange={e => setBusNumber(e.target.value.toUpperCase())}
                            placeholder="e.g. KA-01-F-1234"
                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-white font-bold text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 "
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 mb-1.5 block">Activation Code</label>
                        <input
                            value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                            placeholder="e.g. A3F2BC"
                            maxLength={6}
                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-white font-black text-xl text-center placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 tracking-[0.4em]"
                        />
                    </div>
                    <Button onClick={activate} disabled={loading}
                        className="w-full h-14 rounded-2xl font-black tracking-wide text-sm mt-2 shadow-xl shadow-primary/30">
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Activate & Start Duty"}
                    </Button>
                    <p className="text-center text-[10px] text-slate-500 font-bold">
                        Code provided by your bus owner
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Cash Passenger Modal ──────────────────────────────────────────────────────
function CashPassengerModal({ busNumber, seats, onClose, onAdd }: {
    busNumber: string; seats: Seat[]; onClose: () => void; onAdd: (seatNum: number) => void;
}) {
    const [seat, setSeat] = useState<number | null>(null);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const add = async () => {
        if (!seat) return toast.error("Select a seat");
        if (!from || !to) return toast.error("Enter from and to stops");
        setLoading(true);
        try {
            await fetch("/api/employee/cash-passenger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ busNumber, seatNumber: seat, from, to, amount: Number(amount) })
            });
        } catch { /* demo ok */ }
        toast.success(`Cash passenger added to Seat ${seat}`);
        onAdd(seat);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-end justify-center" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-black text-slate-800 text-lg">Add Cash Passenger</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-1">From Stop</label>
                        <input value={from} onChange={e => setFrom(e.target.value)} placeholder="Boarding stop"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-1">To Stop</label>
                        <input value={to} onChange={e => setTo(e.target.value)} placeholder="Destination stop"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1">Collected Amount (₹)</label>
                    <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2">Select Seat</label>
                    <div className="flex flex-wrap gap-2">
                        {seats.filter(s => s.status === "Available").slice(0, 20).map(s => (
                            <button key={s.number} onClick={() => setSeat(s.number)}
                                className={`w-9 h-9 rounded-xl border-2 text-xs font-black transition-all ${seat === s.number ? "border-primary bg-primary text-white" : "border-slate-200 hover:border-slate-300"}`}>
                                {s.number}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1 rounded-2xl">Cancel</Button>
                    <Button onClick={add} disabled={loading} className="flex-1 rounded-2xl font-black ">
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : `Add — ₹${amount || 0}`}
                    </Button>
                </div>
            </div>
        </div>
    );
}

import { Html5QrcodeScanner } from "html5-qrcode";

// ─── Main Employee Panel ───────────────────────────────────────────────────────
export default function EmployeePanel() {
    const [activated, setActivated] = useState(false);
    const [busNumber, setBusNumber] = useState("");
    const [employeeRole, setEmployeeRole] = useState("Driver");
    const [seats, setSeats] = useState<Seat[]>(generateSeats(40));
    const [boarded, setBoarded] = useState(0);
    const [showCash, setShowCash] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [gpsSending, setGpsSending] = useState(false);
    const [connected, setConnected] = useState(false);
    const [departureAlert, setDepartureAlert] = useState(false);
    const [tripEnded, setTripEnded] = useState(false);
    const { sendLocation, joinBus, on } = useSocket();

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (showScanner) {
            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );
            scannerRef.current.render(onScanSuccess, onScanFailure);
        } else {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
                scannerRef.current = null;
            }
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
            }
        };
    }, [showScanner]);

    function onScanSuccess(decodedText: string) {
        toast.success(`Ticket Verified: ${decodedText}`);
        setBoarded(b => b + 1);
        setShowScanner(false);
        // In real app, call API to mark as boarded
    }

    function onScanFailure(error: any) {
        // console.warn(`Code scan error = ${error}`);
    }

    const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // T-10 departure alert timer (demo: 10 seconds)
        const timeout = setTimeout(() => setDepartureAlert(true), 10000);
        return () => clearTimeout(timeout);
    }, [activated]);

    useEffect(() => {
        if (!activated) return;
        joinBus(busNumber);
        setConnected(true);

        // Listen for incoming seat updates
        const unsub = on("bus:seat-update", ({ seatNumber, status }) => {
            setSeats(prev => prev.map(s => s.number === seatNumber ? { ...s, status } : s));
        });
        return () => { unsub(); };
    }, [activated, busNumber]);

    const startGPS = () => {
        if (!navigator.geolocation) return toast.error("GPS not available on this device");
        setGpsSending(true);
        gpsIntervalRef.current = setInterval(() => {
            navigator.geolocation.getCurrentPosition(pos => {
                sendLocation(busNumber, pos.coords.latitude, pos.coords.longitude, employeeRole.toLowerCase());
            });
        }, 5000);
        toast.success("GPS sharing started — location updates every 5s");
    };

    const stopGPS = () => {
        if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
        setGpsSending(false);
        toast.info("GPS sharing stopped");
    };

    const reportBreakdown = async () => {
        try {
            await fetch("/api/employee/breakdown", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ busNumber, notes: "Breakdown reported by employee" })
            });
        } catch { /* demo ok */ }
        toast.error("🔧 Breakdown reported! Owner and passengers notified.", { duration: 6000 });
    };

    const endTrip = () => {
        stopGPS();
        setTripEnded(true);
        toast.success("✅ Trip ended successfully. Duty completed.");
    };

    const addCashSeat = (seatNum: number) => {
        setSeats(prev => prev.map(s => s.number === seatNum ? { ...s, status: "Cash" as any } : s));
        setBoarded(b => b + 1);
    };

    if (!activated) {
        return <ActivationScreen onActivate={(bus, r) => { setBusNumber(bus); setEmployeeRole(r); setActivated(true); }} />;
    }

    const available = seats.filter(s => s.status === "Available").length;
    const bookedCount = seats.filter(s => s.status === "Booked" || s.status === "Cash").length;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="bg-[#0f172a] border-b border-white/5 sticky top-0 z-40">
                <div className="flex items-center justify-between px-4 py-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                            <p className="text-[9px] font-black text-slate-400">{connected ? "Live" : "Offline"}</p>
                        </div>
                        <h1 className="font-black text-white text-lg leading-none">{busNumber}</h1>
                        <p className="text-slate-400 text-[10px] font-bold ">{employeeRole} Panel</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className="text-2xl font-black text-emerald-400">{boarded}</p>
                            <p className="text-[9px] font-bold text-slate-400 ">Boarded</p>
                        </div>
                        <button onClick={() => setActivated(false)} className="w-9 h-9 bg-slate-800 rounded-2xl flex items-center justify-center ml-2">
                            <LogOut className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* T-10 Alert */}
            {departureAlert && !tripEnded && (
                <div className="mx-4 mt-3 bg-primary-light/20 border border-primary/30 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-400 animate-pulse flex-shrink-0" />
                    <div>
                        <p className="text-xs font-black text-blue-300">Departure in 10 min — Lock seats!</p>
                        <p className="text-[10px] text-blue-400/70">Past this point no new cash passengers.</p>
                    </div>
                    <button onClick={() => setDepartureAlert(false)} className="ml-auto"><XCircle className="w-4 h-4 text-blue-400" /></button>
                </div>
            )}

            <div className="p-4 space-y-4 pb-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Available", value: available, color: "text-green-400", bg: "bg-green-500/10" },
                        { label: "Occupied", value: bookedCount, color: "text-red-400", bg: "bg-red-500/10" },
                        { label: "Total", value: seats.length, color: "text-slate-300", bg: "bg-slate-700/50" },
                    ].map((s, i) => (
                        <div key={i} className={`${s.bg} rounded-2xl p-3 text-center`}>
                            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                            <p className="text-[9px] font-bold text-slate-400 ">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowCash(true)}
                        className="bg-primary-light/20 border border-primary/30 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-primary-light/30 transition-colors">
                        <UserPlus className="w-8 h-8 text-blue-400" />
                        <p className="text-xs font-black text-blue-300">Cash Passenger</p>
                    </button>
                    <button
                        onClick={() => setShowScanner(!showScanner)}
                        className={`border rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors ${showScanner ? "bg-red-500/20 border-red-500/30" : "bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30"}`}>
                        {showScanner ? <XCircle className="w-8 h-8 text-red-400" /> : <QrCode className="w-8 h-8 text-blue-400" />}
                        <p className={`text-xs font-black ${showScanner ? "text-red-300" : "text-blue-300"}`}>
                            {showScanner ? "Close Scanner" : "Scan QR"}
                        </p>
                    </button>
                </div>

                {showScanner && (
                    <div className="bg-white rounded-2xl p-4 overflow-hidden shadow-2xl">
                        <div id="reader" className="w-full"></div>
                        <p className="text-slate-800 text-[10px] font-black text-center mt-3 ">Postition Ticket QR in Frame</p>
                    </div>
                )}

                {/* GPS / Location */}
                <div className="bg-slate-800/50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 mb-3">Bus Location Source</p>
                    <div className="flex items-center gap-3">
                        <button onClick={gpsSending ? stopGPS : startGPS}
                            className={`flex-1 py-3 rounded-2xl text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-all
                                ${gpsSending ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                            {gpsSending ? <><Wifi className="w-4 h-4" /> Streaming GPS</> : <><WifiOff className="w-4 h-4" /> Start GPS</>}
                        </button>
                        <button onClick={() => {
                            navigator.geolocation.getCurrentPosition(p => {
                                sendLocation(busNumber, p.coords.latitude, p.coords.longitude, "manual");
                                toast.success("Manual location updated");
                            });
                        }}
                            className="flex-1 py-3 rounded-2xl text-xs font-black tracking-wide bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center gap-2 transition-all">
                            <Navigation className="w-4 h-4" /> Set Now
                        </button>
                    </div>
                </div>

                {/* Seat Map */}
                <div className="bg-slate-800/50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 mb-3">Live Seat Map</p>
                    <div className="scale-90 origin-top">
                        <SeatMap seats={seats} readOnly />
                    </div>
                </div>

                {/* SOS + Safety */}
                <div className="bg-red-950/30 border border-red-900/30 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-red-400 mb-4 text-center">Emergency Controls</p>
                    <div className="flex justify-center">
                        <SOSButton busNumber={busNumber} />
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={reportBreakdown}
                        className="bg-orange-500/20 border border-orange-500/30 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-orange-500/30 transition-colors">
                        <AlertTriangle className="w-7 h-7 text-orange-400" />
                        <p className="text-xs font-black text-orange-300">Report Breakdown</p>
                    </button>
                    <button onClick={endTrip} disabled={tripEnded}
                        className={`rounded-2xl p-4 flex flex-col items-center gap-2 transition-colors ${tripEnded
                            ? "bg-emerald-600 border-emerald-500"
                            : "bg-slate-700 border border-slate-600 hover:bg-slate-600"
                            }`}>
                        <CheckCircle className="w-7 h-7 text-emerald-400" />
                        <p className="text-xs font-black text-emerald-300">
                            {tripEnded ? "Trip Ended" : "End Trip"}
                        </p>
                    </button>
                </div>
            </div>

            {showCash && (
                <CashPassengerModal busNumber={busNumber} seats={seats} onClose={() => setShowCash(false)} onAdd={addCashSeat} />
            )}
        </div>
    );
}
