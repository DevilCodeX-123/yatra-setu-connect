import { useState } from "react";
import {
    Bus, Calendar, Star, Leaf, Wind, ThumbsUp, AlertCircle,
    ChevronDown, ChevronUp, X, Send, Droplets, Zap, Award,
    TrendingUp, User2, History, MapPin
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Home, Settings, HelpCircle } from "lucide-react";

// ============================================================
// Constants
// ============================================================
const CO2_PER_KM = 0.093;   // kg saved per km (vs private car)
const NOX_PER_KM = 0.00082; // kg NOx saved per km

// ============================================================
// Sample / Demo ride data
// ============================================================
const SAMPLE_RIDES = [
    {
        id: "r1",
        pnr: "YS-2501-1234",
        amount: 180,
        date: "15 Jan 2025",
        seats: "12",
        passengers: 1,
        km: 145,
        operator: "KSRTC",
        busNo: "KA-01-F-1234",
        departure: "06:30",
        arrival: "09:15",
        from: "Bengaluru",
        to: "Mysuru",
    },
    {
        id: "r2",
        pnr: "YS-2502-4782",
        amount: 750,
        date: "20 Feb 2025",
        seats: "5, 6",
        passengers: 2,
        km: 352,
        operator: "KSRTC",
        busNo: "KA-01-F-9012",
        departure: "07:30",
        arrival: "13:00",
        from: "Bengaluru",
        to: "Mangaluru",
    },
    {
        id: "r3",
        pnr: "YS-2503-9021",
        amount: 120,
        date: "10 Mar 2025",
        seats: "22",
        passengers: 1,
        km: 145,
        operator: "KSRTC",
        busNo: "KA-01-F-5678",
        departure: "07:00",
        arrival: "09:45",
        from: "Mysuru",
        to: "Bengaluru",
    },
];

// ============================================================
// Sidebar nav items for this page
// ============================================================
const sidebar = [
    { href: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { href: "/profile", label: "Profile", icon: <User2 className="w-4 h-4" /> },
    { href: "/profile/past-rides", label: "Past Rides", icon: <History className="w-4 h-4" /> },
    { href: "/account", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    { href: "/support", label: "Support", icon: <HelpCircle className="w-4 h-4" /> },
];

// ============================================================
// StarRating
// ============================================================
function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
                <button
                    key={s}
                    type="button"
                    onClick={() => onChange?.(s)}
                    onMouseEnter={() => onChange && setHover(s)}
                    onMouseLeave={() => onChange && setHover(0)}
                    className={onChange ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
                >
                    <Star
                        className="w-6 h-6 transition-colors"
                        fill={(hover || value) >= s ? "#f59e0b" : "#e2e8f0"}
                        color={(hover || value) >= s ? "#f59e0b" : "#cbd5e1"}
                    />
                </button>
            ))}
        </div>
    );
}

// ============================================================
// Eco Banner
// ============================================================
function EcoBanner({ totalKm, rides }: { totalKm: number; rides: number }) {
    const co2 = (totalKm * CO2_PER_KM).toFixed(1);
    const nox = (totalKm * NOX_PER_KM * 1000).toFixed(0);
    const trees = (totalKm * CO2_PER_KM / 21).toFixed(1);
    const cars = (totalKm * CO2_PER_KM / 2.31).toFixed(1);

    return (
        <div className="rounded-2xl overflow-hidden shadow-lg shadow-emerald-100 mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                <div className="relative flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Leaf className="w-4 h-4 text-emerald-200" />
                            <span className="text-emerald-200 text-[10px] font-black ">Green Traveler</span>
                        </div>
                        <h2 className="text-2xl font-black text-white">Your Eco Impact</h2>
                        <p className="text-emerald-200 text-xs font-bold mt-0.5">{rides} rides · {totalKm.toLocaleString()} km travelled</p>
                    </div>
                    <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
                        <Award className="w-7 h-7 text-yellow-300" />
                    </div>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 bg-card border-x border-b rounded-b-2xl border-emerald-500/10 dark:border-white/5">
                {[
                    { Icon: Wind, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", val: `${co2} kg`, label: "CO₂ Saved" },
                    { Icon: Leaf, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10", val: trees, label: "Trees Equiv." },
                    { Icon: Droplets, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", val: `${nox}g`, label: "NOx Avoided" },
                    { Icon: Zap, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10", val: cars, label: "Car Trips Saved" },
                ].map((s, i) => (
                    <div key={i} className="p-4 text-center border-r last:border-r-0 border-emerald-500/10 dark:border-white/5 flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center`}>
                            <s.Icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-[9px] font-black text-muted-foreground opacity-50">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Footer note */}
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-white/5 rounded-b-2xl -mt-1 px-5 py-2.5 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    You've saved <strong>{(parseFloat(co2) * 1000).toFixed(0)}g</strong> of CO₂ by choosing public transport. Keep riding!
                </p>
            </div>
        </div>
    );
}

// ============================================================
// Feedback Modal
// ============================================================
type FeedbackTab = "rate" | "suggestion" | "complaint";
type Against = "driver" | "conductor" | "staff" | "bus_condition";

function FeedbackModal({ ride, onClose, onSubmit }: {
    ride: typeof SAMPLE_RIDES[0];
    onClose: () => void;
    onSubmit: (data: { tab: FeedbackTab; rating: number; comment: string; against: Against }) => void;
}) {
    const [tab, setTab] = useState<FeedbackTab>("rate");
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [against, setAgainst] = useState<Against>("driver");
    const [loading, setLoading] = useState(false);

    const labels = ["", "Poor — We're sorry!", "Below average", "Average", "Good journey!", "Excellent! 🌟"];

    async function submit() {
        if (tab === "rate" && !rating) return toast.error("Please select a star rating.");
        if (tab !== "rate" && !comment.trim()) return toast.error("Please describe your feedback.");
        setLoading(true);
        await new Promise(r => setTimeout(r, 600));
        onSubmit({ tab, rating, comment, against });
        setLoading(false);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3" onClick={onClose}>
            <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-[9px] font-black mb-0.5">Ride Feedback</p>
                        <h3 className="text-white font-black text-base ">
                            {ride.from} → {ride.to}
                        </h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border bg-secondary">
                    {([
                        { id: "rate" as const, label: "Rate", Icon: Star },
                        { id: "suggestion" as const, label: "Suggest", Icon: ThumbsUp },
                        { id: "complaint" as const, label: "Complaint", Icon: AlertCircle },
                    ]).map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-black transition-colors border-b-2
                                ${tab === t.id ? "border-primary text-primary bg-card" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                            <t.Icon className="w-3.5 h-3.5" />
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-4">
                    {/* Rate Tab */}
                    {tab === "rate" && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm font-bold text-muted-foreground mb-4">How was your journey?</p>
                                <div className="flex justify-center mb-2">
                                    <StarRating value={rating} onChange={setRating} />
                                </div>
                                <p className="text-xs font-bold text-primary-light h-4">{labels[rating]}</p>
                            </div>
                            <textarea
                                className="w-full border border-border bg-secondary rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 h-20 text-foreground"
                                placeholder="Additional comments (optional)..."
                                value={comment} onChange={e => setComment(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Suggest / Complaint Tabs */}
                    {(tab === "suggestion" || tab === "complaint") && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-muted-foreground opacity-60">
                                {tab === "complaint" ? "Complaint Against" : "Suggestion For"}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { id: "driver" as Against, label: "Driver", emoji: "🚌" },
                                    { id: "conductor" as Against, label: "Conductor", emoji: "🎟️" },
                                    { id: "staff" as Against, label: "Staff / Office", emoji: "👨‍💼" },
                                    { id: "bus_condition" as Against, label: "Bus Condition", emoji: "🔧" },
                                ]).map(o => (
                                    <button key={o.id} onClick={() => setAgainst(o.id)}
                                        className={`p-3 rounded-2xl border-2 text-left transition-all ${against === o.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30 bg-secondary"}`}>
                                        <div className="text-xl mb-1">{o.emoji}</div>
                                        <p className="text-[10px] font-black tracking-wider text-muted-foreground">{o.label}</p>
                                    </button>
                                ))}
                            </div>
                            <textarea
                                className="w-full border border-border bg-secondary rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 h-24 text-foreground"
                                placeholder={`${tab === "complaint" ? "Describe your complaint" : "Share your suggestion"} about the ${against.replace("_", " ")}...`}
                                value={comment} onChange={e => setComment(e.target.value)}
                            />
                        </div>
                    )}

                    <Button onClick={submit} disabled={loading}
                        className="w-full h-12 rounded-2xl font-black tracking-wide gap-2 shadow-lg shadow-primary/20">
                        {loading
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><Send className="w-4 h-4" />Submit {tab}</>
                        }
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Main Page
// ============================================================
export default function ProfilePastRides() {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [modal, setModal] = useState<typeof SAMPLE_RIDES[0] | null>(null);
    const [ratings, setRatings] = useState<Record<string, number>>(() => {
        try { return JSON.parse(localStorage.getItem("ys_ratings") || "{}"); } catch { return {}; }
    });

    const totalKm = SAMPLE_RIDES.reduce((s, r) => s + r.km, 0);

    function handleFeedback(data: { tab: FeedbackTab; rating: number; comment: string; against: Against }) {
        const ride = modal!;
        if (data.tab === "rate" && data.rating) {
            const next = { ...ratings, [ride.id]: data.rating };
            setRatings(next);
            try { localStorage.setItem("ys_ratings", JSON.stringify(next)); } catch { /* ignore */ }
            toast.success(`Rated ${data.rating} star${data.rating > 1 ? "s" : ""}! Thank you.`);
        } else if (data.tab === "complaint") {
            toast.success(`Complaint against ${data.against.replace("_", " ")} filed. We'll respond within 24h.`);
        } else {
            toast.success("Suggestion submitted — thanks for helping us improve!");
        }
    }

    return (
        <DashboardLayout title="Past Rides" subtitle="Completed journeys & your eco impact" sidebarItems={sidebar}>
            <div className="max-w-4xl pb-20 md:pb-0">
                {/* Demo notice */}
                <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-secondary border border-border rounded-2xl">
                    <span className="text-lg">📋</span>
                    <p className="text-xs font-bold text-primary dark:text-primary-light">
                        Sample rides shown for demonstration. Your real completed bookings will appear here automatically.
                    </p>
                </div>

                {/* Eco Banner */}
                <EcoBanner totalKm={totalKm} rides={SAMPLE_RIDES.length} />

                {/* Section header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center gap-2 text-base font-black text-foreground">
                        <History className="w-4 h-4 text-muted-foreground opacity-50" /> Completed Rides
                    </h2>
                    <span className="bg-secondary text-muted-foreground px-3 py-1 rounded-full text-[10px] font-black ">
                        {SAMPLE_RIDES.length} trips
                    </span>
                </div>

                {/* Ride cards */}
                <div className="space-y-4">
                    {SAMPLE_RIDES.map(ride => {
                        const co2 = (ride.km * CO2_PER_KM).toFixed(2);
                        const nox = (ride.km * NOX_PER_KM * 1000).toFixed(0);
                        const userRating = ratings[ride.id] || 0;
                        const open = expanded === ride.id;

                        return (
                            <div key={ride.id} className="bg-card border border-border rounded-3xl shadow-card hover:shadow-elevated transition-all overflow-hidden">
                                {/* Card header strip */}
                                <div className="px-5 py-3 bg-secondary border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-border" />
                                        <span className="text-[9px] font-black text-muted-foreground">Completed</span>
                                        <span className="text-muted-foreground opacity-30 text-sm">·</span>
                                        <span className="text-[10px] font-bold text-foreground opacity-80">₹{ride.amount}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {userRating > 0 && (
                                            <div className="flex items-center gap-1 bg-primary-light/10 px-2 py-0.5 rounded-full border border-primary/20">
                                                <Star className="w-3 h-3 fill-amber-400 text-blue-400" />
                                                <span className="text-[9px] font-black text-primary-light">{userRating}.0</span>
                                            </div>
                                        )}
                                        <span className="text-[9px] font-bold text-muted-foreground opacity-40">PNR {ride.pnr}</span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    {/* Route visual */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div>
                                            <p className="text-xl font-black text-primary leading-none">{ride.from}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground mt-1">{ride.departure}</p>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center gap-1">
                                            <div className="w-full flex items-center gap-1">
                                                <div className="flex-1 h-px bg-border" />
                                                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                                                    <Bus className="w-3.5 h-3.5 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 h-px bg-border" />
                                            </div>
                                            <p className="text-[9px] font-bold text-muted-foreground opacity-60">{ride.km} km</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-primary leading-none">{ride.to}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground mt-1">{ride.arrival}</p>
                                        </div>
                                    </div>

                                    {/* Meta pills */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                                            <Calendar className="w-3.5 h-3.5 opacity-50" /> {ride.date}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                                            <User2 className="w-3.5 h-3.5 opacity-50" /> {ride.passengers} pax
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5 opacity-50" /> Seat {ride.seats}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                            <Leaf className="w-3 h-3" /> {co2} kg CO₂ saved
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-wrap">
                                        <Button size="sm" onClick={() => setModal(ride)}
                                            className="h-9 px-5 rounded-2xl text-[10px] font-black tracking-wide gap-1.5 bg-primary-light hover:bg-primary border-0 shadow-lg shadow-blue-500/20">
                                            <Star className="w-3.5 h-3.5" />
                                            {userRating ? "Edit Feedback" : "Rate & Feedback"}
                                        </Button>
                                        <Button size="sm" variant="outline"
                                            onClick={() => setExpanded(open ? null : ride.id)}
                                            className="h-9 px-4 rounded-2xl text-[10px] font-black tracking-wide gap-1.5 border-border bg-secondary hover:bg-muted">
                                            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            Details
                                        </Button>
                                    </div>

                                    {/* Expanded details */}
                                    {open && (
                                        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2.5">
                                            {[
                                                { label: "Operator", value: ride.operator, bg: "bg-secondary", txt: "text-foreground opacity-80" },
                                                { label: "Bus No.", value: ride.busNo, bg: "bg-secondary", txt: "text-foreground opacity-80" },
                                                { label: "CO₂ Saved", value: `${co2} kg`, bg: "bg-emerald-500/10", txt: "text-emerald-600 dark:text-emerald-400" },
                                                { label: "NOx Avoided", value: `${nox}g`, bg: "bg-teal-500/10", txt: "text-teal-600 dark:text-teal-400" },
                                            ].map((item, i) => (
                                                <div key={i} className={`${item.bg} rounded-2xl p-3`}>
                                                    <p className="text-[9px] font-black text-muted-foreground mb-0.5">{item.label}</p>
                                                    <p className={`text-sm font-black ${item.txt}`}>{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {modal && (
                <FeedbackModal
                    ride={modal}
                    onClose={() => setModal(null)}
                    onSubmit={data => { handleFeedback(data); }}
                />
            )}
        </DashboardLayout>
    );
}
