import { useEffect, useState } from "react";
import { ClipboardList, Bus, Calendar, MapPin, ChevronRight, Clock, QrCode, User, ArrowRight, History, Ticket } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { Link } from "react-router-dom";

export default function ProfileBookings() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await api.getBookings();
                setBookings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch bookings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const getStatus = (busDate: string, departureTime: string) => {
        try {
            const tripDate = parseISO(busDate);
            const [hours, minutes] = departureTime.split(':').map(Number);
            tripDate.setHours(hours, minutes, 0, 0);

            const now = new Date();
            if (now > tripDate) return { label: "Expired", color: "bg-slate-100 text-slate-400 border-slate-200", icon: History, variant: "secondary" as const };

            const diff = differenceInCalendarDays(tripDate, now);
            if (diff === 0) return { label: "Today", color: "bg-amber-50 text-primary border-amber-100", icon: Clock, variant: "default" as const };
            if (diff === 1) return { label: "Tomorrow", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Calendar, variant: "default" as const };
            return { label: `${diff} Days Left`, color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Calendar, variant: "default" as const };
        } catch (e) {
            return { label: "Confirmed", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Ticket, variant: "default" as const };
        }
    };

    return (
        <DashboardLayout
            title="My Bookings"
            subtitle="Track your upcoming and past travels"
            sidebarItems={[]}
        >
            <div className="max-w-4xl space-y-6 animate-slide-up pb-24 md:pb-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-xs font-bold text-slate-400">Fetching Bookings...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="portal-card p-12 text-center text-slate-400">
                        <Bus className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-bold ">No Bookings Found</p>
                        <p className="text-xs mt-1 ">Plan your first trip to see it here!</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {bookings.map((booking) => {
                            const busDate = booking.bus?.date || format(new Date(booking.date), 'yyyy-MM-dd');
                            const departureTime = booking.bus?.departureTime || "00:00";
                            const status = getStatus(busDate, departureTime);

                            return (
                                <div key={booking._id} className={`portal-card overflow-hidden hover:shadow-elevated transition-all group ${status.label === "Expired" ? "opacity-75" : ""}`}>
                                    <div className={`px-4 py-3 flex items-center justify-between ${status.label === "Expired" ? "bg-slate-50" : "bg-primary/5"}`}>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={status.variant} className={`rounded-full px-3 py-1 text-[9px] font-black flex items-center gap-1.5 ${status.color}`}>
                                                <status.icon className="w-3 h-3" />
                                                {status.label}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-slate-400 ">₹{booking.amount} Paid</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-primary ">
                                            <QrCode className="w-3 h-3" />
                                            <span>PNR: {booking.pnr}</span>
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-6 relative">
                                                <div className="text-left">
                                                    <p className="text-xl font-black text-primary leading-none">{booking.bus?.route.from}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1.5">{booking.bus?.departureTime}</p>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center px-4">
                                                    <div className="w-full h-[2px] bg-slate-100 relative">
                                                        <Bus className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-accent bg-white px-0.5" />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-primary leading-none">{booking.bus?.route.to}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1.5">{booking.bus?.arrivalTime}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                                <div className="flex items-center gap-2 group/info">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover/info:text-primary transition-colors" />
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {booking.bus?.date ? format(parseISO(booking.bus.date), 'dd MMM yyyy') : format(new Date(booking.date), 'dd MMM yyyy')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-600">{booking.passengers.length} Passenger(s)</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-600">Seats: {booking.passengers.map((p: any) => p.seatNumber).join(", ")}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Bus className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-600 truncate max-w-[80px]">{booking.bus?.operator}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col gap-2 min-w-[150px]">
                                            <Link to={`/verify?pnr=${booking.pnr}`} className="flex-1">
                                                <Button className="w-full text-[10px] font-black h-11 shadow-lg shadow-primary/20">
                                                    View E-Ticket
                                                </Button>
                                            </Link>
                                            {status.label !== "Expired" && (
                                                <Button variant="outline" className="flex-1 text-[10px] font-black h-11 border-primary text-primary hover:bg-primary/5">
                                                    Track Live
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
