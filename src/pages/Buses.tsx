import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Bus, Clock, MapPin, Users, Navigation, ArrowRight, CreditCard } from "lucide-react";
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
                setBuses(data);
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
                            <div key={bus._id} className="bg-card border border-border rounded-3xl overflow-hidden group hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-0.5 shadow-card">
                                <div className="p-5 md:p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        {/* Bus Identity */}
                                        <div className="flex-1 min-w-[200px]">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                                                    <Bus className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-black leading-none group-hover:text-primary transition-colors text-foreground">
                                                            {bus.operator || "Yatra Setu Express"}
                                                        </h3>
                                                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded text-[10px] font-black">
                                                            <span className="text-[10px]">★</span>
                                                            {bus.rating?.toFixed(1) || "4.0"}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] font-black border-primary/20 bg-primary/5 text-primary">
                                                            {bus.type}
                                                        </Badge>
                                                        <span className="text-[10px] font-black text-muted-foreground opacity-50">
                                                            No. {bus.busNumber}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-4">
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground">
                                                    <Users className="w-3.5 h-3.5 text-primary" />
                                                    {bus.totalSeats} {t('bus.seatsTotal')}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground">
                                                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                                    {t('bus.basePrice')}: ₹{bus.price || 500}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Route Timeline (Hidden for Rentals) */}
                                        <div className="flex items-center justify-between gap-4 flex-1 md:max-w-[300px] py-4 md:py-0 border-y md:border-y-0 border-dashed border-border/50 opacity-10 grayscale select-none pointer-events-none">
                                            <div className="text-center">
                                                <p className="text-xl font-black text-foreground/40">--:--</p>
                                                <p className="text-[9px] font-black text-muted-foreground uppercase">{t('bus.customRoute')}</p>
                                            </div>
                                            <div className="flex flex-col items-center flex-1">
                                                <ArrowRight className="w-4 h-4 text-primary opacity-30 mb-0.5" />
                                                <div className="h-0.5 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary/30 w-full" />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xl font-black text-foreground/40">--:--</p>
                                                <p className="text-[9px] font-black text-muted-foreground uppercase">{t('bus.byRenter')}</p>
                                            </div>
                                        </div>

                                        {/* Seats & Price */}
                                        <div className="flex flex-row md:flex-col items-center justify-between md:items-end gap-2 pr-2">
                                            <div className="text-right">
                                                <p className="text-2xl font-black leading-none text-emerald-600 dark:text-emerald-400">
                                                    {bus.rentalCapacity || bus.totalSeats}
                                                </p>
                                                <p className="text-[9px] font-black text-muted-foreground opacity-50">{t('bus.eventCapacity')}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1.5 justify-end">
                                                    <p className="text-2xl font-black leading-none text-primary">₹{bus.rentalPricePerDay || 5000}</p>
                                                    <span className="text-xs font-black text-accent">{t('bus.plusPetrol')}</span>
                                                </div>
                                                <p className="text-[9px] font-black text-muted-foreground opacity-50">{t('bus.rentDesc')}</p>
                                                <div className="mt-1 flex items-center gap-1 justify-end">
                                                    <Badge variant="secondary" className="text-[8px] h-4 font-black bg-accent/10 text-accent border-none">
                                                        {bus.mileage || 4.0} {t('bus.mileage')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="flex gap-2">
                                            <Button size="lg" className="h-12 w-full md:w-32 rounded-xl text-xs font-black shadow-lg shadow-primary/20" asChild>
                                                <Link to={`/booking?busId=${bus._id}&type=rental`}>
                                                    {t('bus.rentNow')}
                                                </Link>
                                            </Button>
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
