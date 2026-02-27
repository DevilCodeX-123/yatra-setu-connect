import { useEffect, useState } from "react";
import { ClipboardList, Bus, Calendar, MapPin, ChevronRight, Clock, QrCode, User, ArrowRight, History, Ticket, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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

    const confirmedRentals = bookings.filter(b => b.bookingType === 'FullBus' && b.status === 'Confirmed');
    const otherBookings = bookings.filter(b => !(b.bookingType === 'FullBus' && b.status === 'Confirmed'));

    return (
        <DashboardLayout
            title="My Bookings"
            subtitle="Track your upcoming and past travels"
            sidebarItems={[]}
        >
            <div className="max-w-4xl space-y-10 animate-slide-up pb-24 md:pb-0">
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
                    <>
                        {/* --- Confirmed Rentals Section --- */}
                        {confirmedRentals.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Your Confirmed Rentals</h3>
                                </div>
                                <div className="grid gap-6">
                                    {confirmedRentals.map((booking) => (
                                        <BookingCard key={booking._id} booking={booking} isConfirmedRental getStatus={getStatus} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- Other Bookings Section --- */}
                        <div className="space-y-4">
                            {confirmedRentals.length > 0 && (
                                <div className="flex items-center gap-2 px-1 pt-4">
                                    <ClipboardList className="w-5 h-5 text-slate-400" />
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-tighter">Other Bookings & Inquiries</h3>
                                </div>
                            )}
                            <div className="grid gap-6">
                                {otherBookings.map((booking) => (
                                    <BookingCard key={booking._id} booking={booking} getStatus={getStatus} />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

function BookingCard({ booking, isConfirmedRental = false, getStatus }: { booking: any, isConfirmedRental?: boolean, getStatus: any }) {
    const isRental = booking.bookingType === 'FullBus';
    const busDate = booking.bus?.date || (isRental ? booking.rentalDetails?.startDate : format(new Date(booking.date), 'yyyy-MM-dd'));
    const departureTime = booking.bus?.departureTime || "00:00";

    const statusInfo = isRental ? {
        label: booking.status,
        color: booking.status === 'Accepted' ? 'bg-blue-50 text-blue-600 border-blue-100' :
            booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                booking.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                    'bg-amber-50 text-amber-600 border-amber-100',
        icon: isRental ? Bus : Calendar,
        variant: 'default' as const
    } : getStatus(busDate, departureTime);

    const handlePayAdvance = async (amount: number) => {
        if (window.confirm(`Confirm paying ₹${amount} as advance to book this rental?`)) {
            try {
                await api.payAdvance(booking._id);
                toast.success("Advance Paid! Booking Confirmed.");
                window.location.reload();
            } catch (err) {
                toast.error("Payment failed");
            }
        }
    };

    return (
        <div className={`portal-card overflow-hidden hover:shadow-elevated transition-all group ${statusInfo.label === "Expired" || statusInfo.label === "Rejected" ? "opacity-75" : ""} ${isConfirmedRental ? "border-l-4 border-l-emerald-500 shadow-md shadow-emerald-100" : ""}`}>
            <div className={`px-4 py-3 flex items-center justify-between ${isConfirmedRental ? "bg-emerald-50/50" : statusInfo.label === "Expired" ? "bg-slate-50" : "bg-primary/5"}`}>
                <div className="flex items-center gap-3">
                    <Badge variant={statusInfo.variant} className={`rounded-full px-3 py-1 text-[9px] font-black flex items-center gap-1.5 ${statusInfo.color}`}>
                        <statusInfo.icon className="w-3 h-3" />
                        {statusInfo.label}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400 ">
                        {isRental ? `Total: ₹${booking.amount}` : `₹${booking.amount} Paid`}
                    </span>
                    {isRental && booking.status === 'Confirmed' && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black">Deposit Paid</Badge>
                    )}
                    {isRental && booking.status === 'Accepted' && booking.advanceAmount > 0 && (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[8px] font-black">Advance Due: ₹{booking.advanceAmount}</Badge>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-primary ">
                    <QrCode className="w-3 h-3" />
                    <span>{isRental ? 'REQ' : 'PNR'}: {booking.pnr}</span>
                </div>
            </div>

            <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center">
                <div className="flex-1">
                    {isRental ? (
                        <div className="mb-4">
                            <p className="text-xl font-black text-primary leading-none uppercase">{booking.rentalDetails?.fromLocation || 'Pickup'} → {booking.rentalDetails?.destination}</p>
                            <div className="flex flex-wrap gap-4 mt-2">
                                <p className="text-[10px] font-bold text-slate-400">Purpose: {booking.rentalDetails?.purpose} • Pickup: {booking.rentalDetails?.startTime || '09:00'} ({booking.rentalDetails?.isRoundTrip ? 'Round' : 'One-Way'})</p>
                                <p className="text-[10px] font-black text-accent uppercase tracking-wider bg-accent/5 px-2 py-0.5 rounded">
                                    {booking.rentalDetails?.estimatedKm} KM ({booking.rentalDetails?.totalFuelKm || (booking.rentalDetails?.isRoundTrip ? booking.rentalDetails?.estimatedKm * 2 : booking.rentalDetails?.estimatedKm * 1.5)} KM total) • {booking.rentalDetails?.hoursRequested || 24}h • Total: ₹{booking.amount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ) : (
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
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        <div className="flex items-center gap-2 group/info" title="Departure Date">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover/info:text-primary transition-colors" />
                            <span className="text-xs font-bold text-slate-600">
                                {isRental ? (booking.rentalDetails?.startDate && format(new Date(booking.rentalDetails.startDate), 'dd MMM yyyy')) : (booking.bus?.date ? format(parseISO(booking.bus.date), 'dd MMM yyyy') : format(new Date(booking.date), 'dd MMM yyyy'))}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Bus className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{booking.bus?.operator || (isRental ? 'Private Rental' : 'Transport')}</span>
                        </div>
                        {!isRental && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600">Seats: {booking.passengers?.map((p: any) => p.seatNumber).join(", ")}</span>
                            </div>
                        )}
                        {isRental && (
                            <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600">Full Bus Rental</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex md:flex-col gap-2 min-w-[150px]">
                    {isConfirmedRental ? (
                        <>
                            <Link to={`/tracking/${booking.bus?._id}`}>
                                <Button className="w-full text-[10px] font-black h-11 bg-primary text-white shadow-lg shadow-primary/20 flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" /> Track Live Location
                                </Button>
                            </Link>
                            <Link to={`/profile/chat/${booking._id}`}>
                                <Button className="w-full text-[10px] font-black h-11 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 flex items-center gap-2" variant="outline">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Chat with Owner
                                </Button>
                            </Link>
                        </>
                    ) : !isRental ? (
                        <>
                            <Link to={`/verify?pnr=${booking.pnr}`} className="flex-1">
                                <Button className="w-full text-[10px] font-black h-11 shadow-lg shadow-primary/20">
                                    View E-Ticket
                                </Button>
                            </Link>
                            {statusInfo.label !== "Expired" && (
                                <Button variant="outline" className="flex-1 text-[10px] font-black h-11 border-primary text-primary hover:bg-primary/5">
                                    Track Live
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            {booking.status === 'Accepted' && (
                                <Button onClick={() => handlePayAdvance(booking.advanceAmount || booking.amount * 0.5)} className="w-full text-[10px] font-black h-11 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
                                    Pay Advance (₹{booking.advanceAmount || booking.amount * 0.5})
                                </Button>
                            )}
                            {booking.status === 'Confirmed' && (
                                <div className="space-y-2">
                                    <Button variant="outline" className="w-full text-[10px] font-black h-11 border-emerald-500 text-emerald-600 bg-emerald-50" disabled>
                                        Booking Confirmed
                                    </Button>
                                    <Link to={`/profile/chat/${booking._id}`}>
                                        <Button className="w-full text-[10px] font-black h-9 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" variant="outline">
                                            Chat with Owner
                                        </Button>
                                    </Link>
                                    <Link to={`/tracking/${booking.bus?._id}`}>
                                        <Button className="w-full text-[10px] font-black h-9 bg-accent text-white" variant="link">
                                            Track Rental
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            {booking.status === 'PendingOwner' && (
                                <div className="p-2 text-center bg-amber-50 rounded-xl border border-amber-100">
                                    <p className="text-[9px] font-black text-amber-700 uppercase">Wait for Owner</p>
                                    <p className="text-[8px] text-amber-600 italic">Reviewing your request...</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
