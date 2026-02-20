import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Bus, Calendar, Ticket, ArrowRight, User, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";

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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">View and manage your recent booking history.</p>
                </div>
                <Card className="border-primary/10 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 bg-slate-50/50 border-b">
                        <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm">
                            <History className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Recent History</CardTitle>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">System Sync Active</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/20">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading History...</p>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/20">
                                <div className="p-6 bg-slate-100 rounded-full mb-4">
                                    <Ticket className="w-12 h-12 text-slate-300" />
                                </div>
                                <h3 className="text-sm font-bold text-premium mb-1">No Tickets Found</h3>
                                <p className="text-xs text-slate-400 max-w-xs px-6">You haven't made any bookings yet. Your confirmed tickets will appear here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {bookings.map((booking) => (
                                    <div key={booking._id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors animate-slide-up group">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20 uppercase tracking-tighter shadow-sm">
                                                        PNR: {booking.pnr}
                                                    </span>
                                                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                                                        Confirmed
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary/5 transition-colors">
                                                        <Bus className="w-4 h-4 text-slate-500 group-hover:text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-premium leading-tight">
                                                            {booking.bus?.route.from} <ArrowRight className="inline w-3 h-3 mx-1 text-slate-400" /> {booking.bus?.route.to}
                                                        </h4>
                                                        <p className="text-[10px] font-medium text-slate-500">{booking.bus?.operator} | {booking.bus?.busNumber}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6 pt-1">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-[11px] font-semibold text-slate-600">
                                                            {booking.bus?.date || (booking.date ? format(new Date(booking.date), 'dd MMM yyyy') : 'N/A')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 border-l border-slate-100 pl-4 sm:pl-0 sm:border-0">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-[11px] font-semibold text-slate-600">{booking.passengers.length} Passenger(s)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 mt-2 sm:mt-0">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Paid</p>
                                                    <p className="text-lg font-black text-primary leading-tight">₹{booking.amount}</p>
                                                </div>
                                                <Link
                                                    to={`/verify?pnr=${booking.pnr}`}
                                                    className="inline-flex items-center text-[10px] font-black uppercase text-primary hover:gap-2 transition-all group-hover:bg-primary group-hover:text-white px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5"
                                                >
                                                    View Ticket <ChevronRight className="w-3 h-3 ml-1" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
