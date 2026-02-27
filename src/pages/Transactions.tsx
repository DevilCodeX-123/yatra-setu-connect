import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Bus, Calendar, Ticket, ArrowRight, User, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { format, differenceInCalendarDays, parseISO, isPast } from "date-fns";

export default function Transactions() {
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

    return (
        <Layout>
            <div className="space-y-6 pb-12 md:pb-0 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl sm:text-3xl text-premium text-primary mb-1">Booked Tickets</h1>
                    <p className="text-[10px] font-bold text-muted-foreground">View and manage your recent booking history.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="border-border shadow-card overflow-hidden bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <p className="text-[10px] font-black text-primary uppercase tracking-wider">Total Investment</p>
                            <CardTitle className="text-3xl font-black text-primary">₹{bookings.reduce((acc, b) => acc + (b.amount || 0), 0).toLocaleString()}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                <Ticket className="w-3 h-3" />
                                <span>{bookings.length} Confirmed Tickets</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border shadow-card overflow-hidden mt-6">
                    <CardHeader className="flex flex-row items-center gap-4 bg-secondary border-b border-border">
                        <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
                            <History className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Recent History</CardTitle>
                            <p className="text-[9px] font-bold text-muted-foreground ">System Sync Active</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-secondary/50">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                                <p className="text-xs font-bold text-muted-foreground">Loading History...</p>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-secondary/50">
                                <div className="p-6 bg-secondary rounded-full mb-4">
                                    <Ticket className="w-12 h-12 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-sm font-bold text-premium mb-1">No Tickets Found</h3>
                                <p className="text-xs text-muted-foreground max-w-xs px-6">You haven't made any bookings yet. Your confirmed tickets will appear here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {bookings.map((booking) => {
                                    const busDate = booking.bus?.date || (booking.date ? format(new Date(booking.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
                                    const departureTime = booking.bus?.departureTime || "00:00";

                                    const getStatus = () => {
                                        try {
                                            const tripDate = parseISO(busDate);
                                            const [hours, minutes] = departureTime.split(':').map(Number);
                                            tripDate.setHours(hours, minutes, 0, 0);

                                            const now = new Date();
                                            if (now > tripDate) return { label: "EXPIRED", color: "bg-secondary text-muted-foreground border-border", icon: History };

                                            const diffMinutes = (tripDate.getTime() - now.getTime()) / (1000 * 60);
                                            if (diffMinutes > 0 && diffMinutes < 180) return { label: "LIVE", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Bus };

                                            return { label: "UPCOMING", color: "bg-primary-light/10 text-primary border-primary/20", icon: Calendar };
                                        } catch (e) {
                                            return { label: "CONFIRMED", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Ticket };
                                        }
                                    };

                                    const status = getStatus();

                                    return (
                                        <div key={booking._id} className="p-4 sm:p-6 hover:bg-secondary/50 transition-colors animate-slide-up group">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="space-y-3 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20 shadow-sm">
                                                            PNR: {booking.pnr}
                                                        </span>
                                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${status.color}`}>
                                                            <status.icon className="w-3 h-3" />
                                                            {status.label}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-secondary rounded-lg group-hover:bg-primary/5 transition-colors">
                                                            <Bus className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-premium leading-tight">
                                                                {booking.bus?.route.from} <ArrowRight className="inline w-3 h-3 mx-1 text-muted-foreground/30" /> {booking.bus?.route.to}
                                                            </h4>
                                                            <p className="text-[10px] font-medium text-muted-foreground opacity-60">{booking.bus?.operator} | {booking.bus?.busNumber}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6 pt-1">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground opacity-40" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-bold text-foreground leading-tight">
                                                                    {booking.bus?.date ? format(parseISO(booking.bus.date), 'dd MMM yyyy') : format(new Date(booking.date), 'dd MMM yyyy')}
                                                                </span>
                                                                <span className="text-[9px] font-medium text-muted-foreground ">Departure: {booking.bus?.departureTime}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 border-l border-border pl-4 sm:pl-0 sm:border-0">
                                                            <User className="w-3.5 h-3.5 text-muted-foreground opacity-40" />
                                                            <span className="text-[11px] font-semibold text-muted-foreground">{booking.passengers.length} Passenger(s)</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 border-border mt-2 sm:mt-0">
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-muted-foreground mb-0.5">Total Paid</p>
                                                        <p className="text-lg font-black text-primary leading-tight">₹{booking.amount}</p>
                                                    </div>
                                                    <Link
                                                        to={`/verify?pnr=${booking.pnr}`}
                                                        className="inline-flex items-center text-[10px] font-black text-primary hover:gap-2 transition-all group-hover:bg-primary group-hover:text-white px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 shadow-sm"
                                                    >
                                                        View Ticket <ChevronRight className="w-3 h-3 ml-1" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
