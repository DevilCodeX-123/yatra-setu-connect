import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Bus, Clock, MapPin, Users, Navigation, ArrowRight, CreditCard, Wifi, ShieldCheck, Zap, Coffee, Tv } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/contexts/LanguageContext";
export default function Buses() {
    const { t } = useTranslation();
    const [buses, setBuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBuses = async () => {
            try {
                const data = await api.getBuses();
                setBuses(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch buses:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBuses();
    }, []);

    const getAvailabilityColor = (available: number, total: number) => {
        if (available === 0) return "text-red-600 dark:text-red-400";
        if (available / total < 0.2) return "text-primary dark:text-blue-400";
        return "text-emerald-600 dark:text-emerald-400";
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black mb-1 text-primary">{t('bus.title')}</h1>
                        <p className="text-muted-foreground text-[10px] font-black opacity-60">{t('bus.subtitle')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <Bus className="w-12 h-12 mb-4 animate-bounce text-primary" />
                            <p className="font-black text-xs">{t('bus.fetching')}</p>
                        </div>
                    ) : buses.length === 0 ? (
                        <div className="bg-card border border-border border-dashed rounded-3xl p-20 text-center">
                            <Bus className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="text-muted-foreground font-black text-[10px]">{t('bus.noActive')}</p>
                        </div>
                    ) : (
                        buses.map((bus) => (
                            <div key={bus._id} className="bg-card border border-border rounded-3xl overflow-hidden group hover:border-primary/40 transition-all duration-500 transform hover:-translate-y-1 shadow-card relative">
                                {/* Premium Glass Background Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />

                                <div className="p-5 md:p-7">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        {/* Bus Identity & Amenities */}
                                        <div className="flex-1 min-w-[280px]">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-white shadow-xl shadow-primary/20 transform group-hover:scale-110 transition-transform duration-500">
                                                    <Bus className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                        <h3 className="text-xl font-black leading-none group-hover:text-primary transition-colors text-foreground">
                                                            {bus.operator || "Yatra Setu Express"}
                                                        </h3>
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <ShieldCheck className="w-3 h-3" />
                                                            {t('bus.verified')}
                                                        </Badge>
                                                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-1 rounded-lg text-[10px] font-black">
                                                            <span className="text-[10px]">★</span>
                                                            {(Number(bus.rating) || 4.0).toFixed(1)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="text-[10px] font-black border-primary/20 bg-primary/5 text-primary px-2.5">
                                                            {bus.busType || bus.type || "Universal"}
                                                        </Badge>
                                                        <span className="text-[10px] font-black text-muted-foreground tracking-widest uppercase opacity-70">
                                                            {bus.busNumber}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Real Amenities from DB */}
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {(bus.amenities || []).slice(0, 5).map((amenity: string, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-secondary/50 rounded-lg border border-border/50 text-muted-foreground">
                                                        {amenity.toLowerCase().includes('wifi') && <Wifi className="w-3 h-3 text-primary" />}
                                                        {amenity.toLowerCase().includes('ac') && <Zap className="w-3 h-3 text-blue-500" />}
                                                        {amenity.toLowerCase().includes('water') && <Zap className="w-3 h-3 text-cyan-500" />}
                                                        {amenity.toLowerCase().includes('charge') && <Zap className="w-3 h-3 text-amber-500" />}
                                                        {amenity.toLowerCase().includes('movie') && <Tv className="w-3 h-3 text-purple-500" />}
                                                        {amenity.toLowerCase().includes('blanket') && <ShieldCheck className="w-3 h-3 text-indigo-500" />}
                                                        <span className="text-[9px] font-bold uppercase">{amenity}</span>
                                                    </div>
                                                ))}
                                                {(!bus.amenities || bus.amenities.length === 0) && (
                                                    <div className="text-[9px] font-black text-muted-foreground/40 italic">Standard Amenities</div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border/10">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground">
                                                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                                        <Users className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-foreground leading-none mb-0.5">{bus.totalSeats}</p>
                                                        <p className="opacity-50 uppercase tracking-tighter">{t('bus.seatsTotal')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground">
                                                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                                                        <CreditCard className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-foreground leading-none mb-0.5">₹{bus.price || 500}</p>
                                                        <p className="opacity-50 uppercase tracking-tighter">{t('bus.basePrice')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Route Timeline (Dynamic from DB) */}
                                        <div className="flex items-center justify-between gap-6 flex-1 md:max-w-[340px] py-6 md:py-0 px-4 bg-secondary/20 rounded-2xl border border-border/30 relative overflow-hidden group-hover:bg-secondary/40 transition-colors">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                                            <div className="text-center relative z-10">
                                                <p className="text-2xl font-black text-foreground tracking-tighter">{bus.departureTime || "--:--"}</p>
                                                <p className="text-[10px] font-black text-primary uppercase">{bus.route?.from || t('bus.anywhere')}</p>
                                            </div>

                                            <div className="flex flex-col items-center flex-1 relative z-10 px-2">
                                                <div className="flex items-center gap-1 mb-1 px-2 py-0.5 bg-background/50 rounded-full border border-border/50">
                                                    <Navigation className="w-2.5 h-2.5 text-primary" />
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground">{bus.km || '--'} KM</span>
                                                </div>
                                                <div className="h-0.5 w-full bg-border rounded-full relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-primary/40 animate-pulse" />
                                                    <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-primary bg-background rounded-full border border-primary/20 p-0.5" />
                                                </div>
                                                <p className="text-[8px] font-black text-muted-foreground mt-1 uppercase tracking-widest opacity-60">Live Route</p>
                                            </div>

                                            <div className="text-center relative z-10">
                                                <p className="text-2xl font-black text-foreground tracking-tighter">{bus.arrivalTime || "--:--"}</p>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase">{bus.route?.to || t('bus.anywhere')}</p>
                                            </div>
                                        </div>

                                        {/* Rental Pricing Column */}
                                        <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-6 min-w-[180px]">
                                            <div className="text-right">
                                                <div className="flex items-center gap-1.5 justify-end mb-1">
                                                    <span className="text-[10px] font-black text-accent uppercase tracking-tighter opacity-60">Exclusive Event</span>
                                                    <div className="size-1.5 rounded-full bg-accent animate-pulse" />
                                                </div>
                                                <p className="text-4xl font-black leading-none text-primary flex items-baseline justify-end gap-1">
                                                    <span className="text-lg font-bold">₹</span>{bus.rentalPricePerDay || (bus.price * 20) || 12000}
                                                </p>
                                                <p className="text-[10px] font-black text-muted-foreground opacity-50 mt-1 uppercase tracking-[0.1em]">{t('bus.rentPerDay')}</p>
                                            </div>

                                            <div className="space-y-3 w-full md:w-auto">
                                                <div className="flex items-center justify-between md:justify-end gap-4">
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-foreground leading-none">{bus.rentalCapacity || bus.totalSeats}</p>
                                                        <p className="text-[9px] font-bold text-muted-foreground opacity-50 uppercase tracking-tighter">Capacity</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-emerald-600 leading-none">{bus.mileage || 4.0} KM/L</p>
                                                        <p className="text-[9px] font-bold text-muted-foreground opacity-50 uppercase tracking-tighter">Efficiency</p>
                                                    </div>
                                                </div>
                                                <Button size="lg" className="h-[52px] w-full md:w-44 rounded-2xl text-[11px] font-black shadow-2xl shadow-primary/30 bg-primary hover:bg-primary-dark transition-all duration-300 group-hover:scale-[1.02]" asChild>
                                                    <Link to={`/booking?busId=${bus._id}&type=rental`}>
                                                        <Zap className="mr-2 w-4 h-4 text-accent" />
                                                        {t('bus.rentNow').toUpperCase()}
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
}
