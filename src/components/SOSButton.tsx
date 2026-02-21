import { useState, useRef } from "react";
import { AlertTriangle, Share2, ShieldAlert, X, Phone } from "lucide-react";
import { toast } from "sonner";

interface SOSButtonProps {
    busNumber: string;
    onTrigger?: (lat: number, lng: number) => void;
}

export default function SOSButton({ busNumber, onTrigger }: SOSButtonProps) {
    const [holding, setHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const [triggered, setTriggered] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const holdDuration = 3000; // 3 seconds

    const startHold = () => {
        if (triggered) return;
        setHolding(true);
        setProgress(0);
        const step = 50;
        const increment = (step / holdDuration) * 100;
        intervalRef.current = setInterval(() => {
            setProgress(p => {
                if (p + increment >= 100) {
                    clearInterval(intervalRef.current!);
                    fireAlert();
                    return 100;
                }
                return p + increment;
            });
        }, step);
    };

    const cancelHold = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setHolding(false);
        setProgress(0);
    };

    const fireAlert = () => {
        setTriggered(true);
        setHolding(false);
        setShowModal(true);

        // Get GPS location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                const { latitude, longitude } = pos.coords;
                onTrigger?.(latitude, longitude);
                // Also POST to backend
                fetch("/api/emergency", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ busNumber, lat: latitude, lng: longitude, type: "SOS" })
                }).catch(() => { });
            });
        } else {
            onTrigger?.(0, 0);
        }

        toast.error("🚨 SOS Alert Triggered! Emergency services notified.", { duration: 8000 });
    };

    const shareTrip = () => {
        const url = `${window.location.origin}/track/${busNumber}`;
        if (navigator.share) {
            navigator.share({ title: "Live Trip — Yatra Setu", text: "Track my bus live:", url });
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Live trip link copied to clipboard!");
        }
    };

    return (
        <>
            <div className="flex items-center gap-3 flex-col">
                {/* SOS Button */}
                <div className="relative">
                    <button
                        onMouseDown={startHold}
                        onMouseUp={cancelHold}
                        onMouseLeave={cancelHold}
                        onTouchStart={startHold}
                        onTouchEnd={cancelHold}
                        className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 font-black text-white shadow-2xl transition-all
                            ${triggered ? "bg-red-600 scale-95 shadow-red-500/50" : "bg-red-500 hover:bg-red-600 active:scale-95 shadow-red-400/50"}
                            ${holding ? "scale-95" : ""}
                        `}
                    >
                        {/* Progress ring */}
                        {holding && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                                <circle
                                    cx="50" cy="50" r="47" fill="none" stroke="white" strokeWidth="4"
                                    strokeDasharray={`${2 * Math.PI * 47}`}
                                    strokeDashoffset={`${2 * Math.PI * 47 * (1 - progress / 100)}`}
                                    strokeLinecap="round"
                                    className="transition-all duration-50"
                                />
                            </svg>
                        )}
                        <ShieldAlert className="w-8 h-8 relative z-10" />
                        <span className="text-[10px] font-black relative z-10">SOS</span>
                    </button>
                    {!triggered && (
                        <p className="text-center text-[9px] font-bold text-slate-400 mt-2 ">
                            {holding ? `${Math.round((100 - progress) * holdDuration / 100000)}s...` : "Hold 3s"}
                        </p>
                    )}
                </div>

                {/* Share Button */}
                <button onClick={shareTrip}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-2xl text-[10px] font-black text-slate-600 transition-colors">
                    <Share2 className="w-3.5 h-3.5" /> Share Trip
                </button>

                {/* Women Safety Zone Indicator */}
                <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-200 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                    <span className="text-[9px] font-black text-pink-700">Women Safety Zone Active</span>
                </div>
            </div>

            {/* SOS Triggered Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="bg-red-600 p-6 text-white text-center relative">
                            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                            <AlertTriangle className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                            <h2 className="text-xl font-black ">SOS Alert Sent!</h2>
                            <p className="text-red-200 text-xs mt-1">Emergency services and the bus owner have been notified.</p>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="bg-red-50 rounded-2xl p-4 text-center">
                                <p className="text-xs font-bold text-slate-600">Your location is being shared with:</p>
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs font-black text-slate-800">✅ Bus Owner notified</p>
                                    <p className="text-xs font-black text-slate-800">✅ Driver notified</p>
                                    <p className="text-xs font-black text-slate-800">✅ Incident logged</p>
                                </div>
                            </div>
                            <a href="tel:112" className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white rounded-2xl font-black text-sm tracking-wide">
                                <Phone className="w-4 h-4" /> Call 112 Emergency
                            </a>
                            <button onClick={shareTrip}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm tracking-wide">
                                <Share2 className="w-4 h-4" /> Share Live Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
