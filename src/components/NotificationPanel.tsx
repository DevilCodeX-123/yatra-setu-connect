import { useState, useEffect } from "react";
import { Bell, X, CheckCheck, Bus, AlertTriangle, CreditCard, MapPin, Info } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

interface Notification {
    id: string;
    type: "booking_confirmed" | "stop_near" | "payment_received" | "breakdown" | "panic_alert" | "general";
    title: string;
    message: string;
    read: boolean;
    time: Date;
}

const DEMO_NOTIFS: Notification[] = [
    { id: "n1", type: "booking_confirmed", title: "Booking Confirmed", message: "PNR YS-2501-1234 | Bengaluru → Mysuru | 15 Jan", read: false, time: new Date(Date.now() - 5 * 60000) },
    { id: "n2", type: "stop_near", title: "Next Stop in 5 min", message: "Approaching: Channapatna — be ready to deboard.", read: false, time: new Date(Date.now() - 12 * 60000) },
    { id: "n3", type: "payment_received", title: "Payment Received", message: "₹180 received for seat 12 via UPI.", read: true, time: new Date(Date.now() - 60 * 60000) },
];

const typeIcon = (type: string) => {
    switch (type) {
        case "booking_confirmed": return <Bus className="w-4 h-4 text-primary" />;
        case "stop_near": return <MapPin className="w-4 h-4 text-orange-500" />;
        case "payment_received": return <CreditCard className="w-4 h-4 text-green-600" />;
        case "breakdown": return <AlertTriangle className="w-4 h-4 text-orange-600" />;
        case "panic_alert": return <AlertTriangle className="w-4 h-4 text-red-600" />;
        default: return <Info className="w-4 h-4 text-slate-400" />;
    }
};

const toBg = (type: string) => {
    switch (type) {
        case "panic_alert": return "bg-red-50 border-red-100";
        case "breakdown": return "bg-orange-50 border-orange-100";
        default: return "bg-white border-slate-100";
    }
};

function timeAgo(d: Date) {
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

export default function NotificationPanel() {
    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState<Notification[]>(DEMO_NOTIFS);
    const { on } = useSocket();

    useEffect(() => {
        const unsub = on("bus:breakdown", (data) => {
            setNotifs(prev => [{
                id: Date.now().toString(),
                type: "breakdown",
                title: "Breakdown Alert",
                message: `Bus ${data.busNumber} reported a breakdown. ${data.notes || ""}`,
                read: false,
                time: new Date()
            }, ...prev]);
        });

        const unsubSOS = on("bus:sos", (data) => {
            setNotifs(prev => [{
                id: Date.now().toString(),
                type: "panic_alert",
                title: "🚨 SOS Panic Alert",
                message: `Emergency triggered on bus ${data.busNumber}`,
                read: false,
                time: new Date()
            }, ...prev]);
        });

        return () => { unsub(); unsubSOS(); };
    }, [on]);

    const unread = notifs.filter(n => !n.read).length;

    const markAll = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    const dismiss = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button onClick={() => setOpen(!open)}
                className="relative w-9 h-9 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors">
                <Bell className="w-4 h-4 text-slate-600" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <h3 className="font-black text-slate-800 text-sm">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unread > 0 && (
                                    <button onClick={markAll} className="text-[10px] font-black text-primary flex items-center gap-1">
                                        <CheckCheck className="w-3 h-3" /> Mark all read
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                            {notifs.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-400">No notifications</p>
                                </div>
                            ) : notifs.map(n => (
                                <div key={n.id} className={`flex items-start gap-3 px-4 py-3.5 ${toBg(n.type)} ${!n.read ? "border-l-2 border-l-primary" : ""}`}>
                                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                                        {typeIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-800">{n.title}</p>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">{n.message}</p>
                                        <p className="text-[9px] font-bold text-slate-300 mt-1 ">{timeAgo(n.time)}</p>
                                    </div>
                                    <button onClick={() => dismiss(n.id)} className="flex-shrink-0 text-slate-300 hover:text-slate-500 mt-0.5">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
