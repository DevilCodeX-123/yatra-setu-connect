import { ClipboardList, Bus, Calendar, MapPin, ChevronRight, Clock, QrCode } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const bookings = [
    {
        id: "BOK-001",
        busId: "KA-01-F-1234",
        from: "Bengaluru",
        to: "Mysuru",
        date: "20 Feb 2024",
        time: "06:30 AM",
        seat: "L14",
        status: "Upcoming",
        type: "Express",
        pnr: "YS2024220001"
    },
    {
        id: "BOK-002",
        busId: "KA-01-F-5678",
        from: "Mysuru",
        to: "Bengaluru",
        date: "15 Feb 2024",
        time: "10:00 AM",
        seat: "R05",
        status: "Completed",
        type: "Ordinary",
        pnr: "YS2024150001"
    }
];

export default function ProfileBookings() {
    return (
        <DashboardLayout
            title="My Bookings"
            subtitle="Track your upcoming and past travels"
            sidebarItems={[]}
        >
            <div className="max-w-4xl space-y-6 animate-slide-up">
                <div className="grid gap-4">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="portal-card overflow-hidden hover:shadow-elevated transition-shadow">
                            <div className={`px-4 py-2 flex items-center justify-between ${booking.status === 'Upcoming' ? 'bg-primary/5' : 'bg-slate-50 opacity-70'}`}>
                                <div className="flex items-center gap-2">
                                    <Badge variant={booking.status === 'Upcoming' ? 'default' : 'secondary'} className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest italic">
                                        {booking.status}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{booking.id}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-primary italic uppercase">
                                    <QrCode className="w-3 h-3" />
                                    <span>PNR: {booking.pnr}</span>
                                </div>
                            </div>

                            <div className="p-5 flex flex-col md:flex-row gap-6 md:items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="text-center">
                                            <p className="text-xl font-black text-primary italic leading-none">{booking.from}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Departure</p>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="w-full h-px bg-slate-200" />
                                            <Bus className="w-4 h-4 text-accent my-1" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{booking.type}</span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-black text-primary italic leading-none">{booking.to}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Arrival</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600">{booking.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600">{booking.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600">Seat {booking.seat}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Bus className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600">{booking.busId}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-col gap-2 min-w-[140px]">
                                    <Button className="flex-1 text-[10px] font-black uppercase italic tracking-widest h-10 shadow-lg shadow-primary/20">
                                        View Digital Pass
                                    </Button>
                                    {booking.status === 'Upcoming' && (
                                        <Button variant="outline" className="flex-1 text-[10px] font-black uppercase italic tracking-widest h-10 border-primary text-primary">
                                            Track Live
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
