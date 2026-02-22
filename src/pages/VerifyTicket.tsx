import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Search, QrCode, Bus, Clock, MapPin, User, ShieldCheck, Ticket, ChevronRight, History, Share2, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { format, differenceInCalendarDays, parseISO } from "date-fns";

import { useTranslation } from "@/contexts/LanguageContext";

export default function VerifyTicket() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const urlPnr = searchParams.get("pnr");

  const [pnr, setPnr] = useState(urlPnr || "");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: t('verify.shareTitle'),
      text: `${t('verify.shareTextPrefix')}${ticketData.bus?.route.from}${t('verify.shareTextTo')}${ticketData.bus?.route.to}${t('verify.shareTextPnr')}${ticketData.pnr}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSearch = async (targetPnr?: string) => {
    const searchPnr = targetPnr || pnr;
    if (!searchPnr) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await api.verifyTicket(searchPnr);
      if (data && !data.message) {
        setTicketData(data);
      } else {
        setTicketData(null);
      }
    } catch (err) {
      console.error("Verification failed:", err);
      setTicketData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlPnr) {
      handleSearch(urlPnr);
    }
  }, [urlPnr]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12 pb-24 min-h-screen bg-background">
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl text-premium text-primary leading-tight font-black ">{t('verify.title')}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-[2px] w-8 bg-primary-light" />
            <p className="text-[10px] font-black tracking-[0.3em] text-muted-foreground opacity-60 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              {t('verify.systemLabel')}
            </p>
          </div>
        </div>

        {/* Search Panel */}
        <div className="bg-card border border-border p-8 mb-10 rounded-[32px] shadow-elevated relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-focus-within:bg-primary/10" />

          <label className="block text-[10px] font-black tracking-[0.2em] text-muted-foreground mb-4 ml-1 opacity-60">
            {t('verify.pnrLabel')}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors opacity-40" />
              <Input
                className="pl-12 font-black text-xs h-14 rounded-2xl border-border bg-secondary focus:border-primary focus:ring-primary/20 text-foreground shadow-sm"
                placeholder={t('verify.pnrPlaceholder')}
                value={pnr}
                onChange={e => setPnr(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary-light text-white font-black shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {loading ? t('verify.verifying') : t('verify.verifyBtn')}
            </Button>
          </div>
        </div>

        {/* Result Section */}
        {searched && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {ticketData ? (() => {
              const busDate = ticketData.bus?.date || format(new Date(ticketData.date), 'yyyy-MM-dd');
              const departureTime = ticketData.bus?.departureTime || "00:00";

              const getStatus = () => {
                try {
                  const tripDate = parseISO(busDate);
                  const [hours, minutes] = departureTime.split(':').map(Number);
                  tripDate.setHours(hours, minutes, 0, 0);

                  const now = new Date();
                  if (now > tripDate) return {
                    label: t('verify.statusExpired'),
                    color: "bg-secondary text-muted-foreground border-border",
                    headerBg: "bg-secondary",
                    icon: History,
                    sub: t('verify.expiredSub'),
                    textColor: "text-muted-foreground",
                    iconColor: "text-muted-foreground/40"
                  };

                  const diff = differenceInCalendarDays(tripDate, now);
                  const common = {
                    icon: CheckCircle,
                    textColor: "text-emerald-500",
                    iconColor: "text-emerald-500",
                    label: t('verify.statusConfirmed'),
                    color: "bg-emerald-500 text-white shadow-emerald-500/20",
                    headerBg: "bg-emerald-500/5"
                  };

                  if (diff === 0) return {
                    ...common,
                    icon: Clock,
                    sub: t('verify.statusTravelingToday'),
                    textColor: "text-primary-light",
                    iconColor: "text-primary-light",
                    headerBg: "bg-primary-light/5",
                    color: "bg-primary-light text-white shadow-blue-500/20"
                  };
                  if (diff === 1) return { ...common, sub: t('verify.statusTravelingTomorrow') };
                  return { ...common, sub: `${diff} ${t('verify.days')}` };
                } catch (e) {
                  return {
                    label: t('verify.statusConfirmed'),
                    color: "bg-emerald-500 text-white shadow-emerald-500/20",
                    headerBg: "bg-emerald-500/5",
                    icon: CheckCircle,
                    sub: t('verify.validTravelDoc'),
                    textColor: "text-emerald-500",
                    iconColor: "text-emerald-500"
                  };
                }
              };

              const status = getStatus();

              return (
                <div className="bg-card border border-border overflow-hidden shadow-elevated rounded-[40px] print:shadow-none print:border print:m-0 print:rounded-none printable-ticket">
                  {/* Premium Status Header */}
                  <div className={`px-8 py-8 flex items-center gap-6 border-b border-border relative ${status.headerBg}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none rotate-12">
                      <ShieldCheck className="w-24 h-24" />
                    </div>

                    <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center shadow-card border border-border/50 transition-transform">
                      <status.icon className={`w-10 h-10 ${status.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-[10px] font-black tracking-[0.3em] mb-1 opacity-60 ${status.textColor}`}>{t('verify.certificateVerified')}</p>
                      <h3 className={`text-2xl font-black leading-none ${status.textColor}`}>{status.label} {t('verify.booking')}</h3>
                      <p className={`text-[10px] font-black tracking-[0.1em] mt-1.5 opacity-80 ${status.textColor}`}>{status.sub}</p>
                    </div>
                    <div className={`hidden sm:flex items-center px-5 py-2 rounded-full text-[10px] font-black shadow-lg border ${status.color}`}>
                      {status.label}
                    </div>
                  </div>

                  {/* Ticket Core Content */}
                  <div className="p-8">
                    {/* Dynamic Route Visual */}
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-4 mb-10 p-8 rounded-[32px] bg-secondary/50 border border-border relative overflow-hidden group">
                      <div className="absolute -bottom-4 -right-4 p-4 opacity-[0.03] pointer-events-none rotate-12">
                        <Bus className="w-48 h-48" />
                      </div>

                      <div className="flex-1 text-center md:text-left z-10 w-full">
                        <p className="text-[10px] font-black text-muted-foreground tracking-[0.2em] mb-2 opacity-50">{t('verify.routeDeparture')}</p>
                        <p className="text-2xl font-black text-primary leading-none">{ticketData.bus?.route.from}</p>
                        <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                          <Clock className="w-3.5 h-3.5 text-foreground opacity-30" />
                          <p className="text-xl font-black text-foreground opacity-90">{ticketData.bus?.departureTime}</p>
                        </div>
                      </div>

                      <div className="w-full md:w-32 flex flex-col items-center justify-center px-4 py-2">
                        <div className="w-full relative h-[4px] bg-border rounded-full overflow-hidden">
                          <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                        </div>
                        <div className="mt-2 p-2 bg-card rounded-xl border border-border shadow-sm">
                          <Bus className="w-5 h-5 text-primary opacity-60" />
                        </div>
                        <p className="text-[8px] font-black text-muted-foreground mt-3 tracking-[0.3em] opacity-40">{t('verify.expressLine')}</p>
                      </div>

                      <div className="flex-1 text-center md:text-right z-10 w-full">
                        <p className="text-[10px] font-black text-muted-foreground tracking-[0.2em] mb-2 opacity-50">{t('verify.routeArrival')}</p>
                        <p className="text-2xl font-black text-primary leading-none">{ticketData.bus?.route.to}</p>
                        <div className="flex items-center justify-center md:justify-end gap-2 mt-2">
                          <p className="text-xl font-black text-foreground opacity-90">{ticketData.bus?.arrivalTime}</p>
                          <Clock className="w-3.5 h-3.5 text-foreground opacity-30" />
                        </div>
                      </div>
                    </div>

                    {/* Technical Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4">
                      {[
                        { icon: User, label: t('verify.passengerLabel'), value: ticketData.passengers[0]?.name + (ticketData.passengers.length > 1 ? ` +${ticketData.passengers.length - 1}` : ""), color: "text-primary" },
                        { icon: QrCode, label: t('verify.pnrRefLabel'), value: ticketData.pnr, color: "text-primary-light" },
                        { icon: Bus, label: t('verify.fleetIdLabel'), value: ticketData.bus?.busNumber, color: "text-foreground" },
                        { icon: MapPin, label: t('verify.seatLabel'), value: ticketData.passengers.map((p: any) => p.seatNumber).join(", "), color: "text-emerald-500" },
                        { icon: Clock, label: t('verify.validatedLabel'), value: format(new Date(ticketData.createdAt), 'dd MMM, hh:mm a'), color: "text-foreground" },
                        { icon: CheckCircle, label: t('verify.fareLabel'), value: `₹ ${ticketData.amount}`, color: "text-primary" },
                      ].map(item => (
                        <div key={item.label} className="flex flex-col gap-2 group">
                          <div className="flex items-center gap-2">
                            <item.icon className="w-3.5 h-3.5 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[9px] font-black tracking-[0.2em] text-muted-foreground opacity-50">{item.label}</p>
                          </div>
                          <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Footbar */}
                  <div className="px-8 py-8 bg-secondary border-t border-border flex flex-col sm:flex-row gap-4 print:hidden">
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="flex-1 h-14 border-border bg-card font-black text-[10px] tracking-[0.2em] gap-3 hover:bg-muted rounded-2xl shadow-sm transition-all"
                    >
                      <Download className="w-5 h-5" />
                      {t('verify.exportPdf')}
                    </Button>
                    <Button
                      onClick={handleShare}
                      className="flex-1 h-14 bg-foreground text-background hover:opacity-90 font-black text-[10px] tracking-[0.2em] gap-3 shadow-lg shadow-black/10 rounded-2xl transition-all active:scale-95"
                    >
                      {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
                      {copied ? t('verify.linkCopied') : t('verify.shareLink')}
                    </Button>
                  </div>
                </div>
              );
            })() : (
              <div className="bg-red-500/5 border border-red-500/20 p-16 flex flex-col items-center text-center rounded-[40px] shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20" />
                <div className="w-20 h-20 bg-card rounded-[24px] flex items-center justify-center shadow-elevated mb-8 rotate-3 border border-red-500/10">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="font-black text-red-500 text-3xl mb-3 ">{t('verify.failedTitle')}</h3>
                <p className="text-[10px] font-black text-muted-foreground opacity-60 max-w-xs mb-10 ">
                  {t('verify.failedPrefix')} <span className="text-foreground border-b border-muted-foreground">"{pnr}"</span> {t('verify.failedDesc')}
                </p>
                <Button className="font-black text-[10px] tracking-[0.2em] h-12 px-10 rounded-xl border-border bg-card hover:bg-muted transition-all" variant="outline" onClick={() => { setSearched(false); setPnr(""); }}>
                  {t('verify.retryBtn')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
