import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Search, QrCode, Bus, Clock, MapPin, User, ShieldCheck, Ticket, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { format } from "date-fns";

export default function VerifyTicket() {
  const [searchParams] = useSearchParams();
  const urlPnr = searchParams.get("pnr");

  const [pnr, setPnr] = useState(urlPnr || "");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

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
      <div className="max-w-2xl mx-auto px-4 py-10 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl text-premium text-primary leading-tight font-black italic uppercase tracking-tighter">Verify Ticket</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Official Yatra Setu Ticket Verification System
          </p>
        </div>

        {/* Search */}
        <div className="portal-card p-6 mb-8 border-primary/10 shadow-lg">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Enter PNR / Booking Reference
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input
                className="pl-10 font-mono text-sm h-11 border-slate-200 focus:border-primary focus:ring-primary/20"
                placeholder="e.g. YS1611438019"
                value={pnr}
                onChange={e => setPnr(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={loading}
              className="h-11 px-6 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>

        {/* Result */}
        {searched && !loading && (
          <div className="animate-slide-up">
            {ticketData ? (
              <div className="portal-card overflow-hidden border-emerald-100 shadow-2xl">
                {/* Status header */}
                <div className="px-6 py-5 flex items-center gap-4 bg-emerald-50 border-b border-emerald-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Travel Document Verified</p>
                    <h3 className="text-base font-black text-premium text-emerald-700 leading-tight">Confirmed Booking</h3>
                    <p className="text-[10px] font-bold text-emerald-500/80 uppercase">Valid for: {ticketData.bus?.date || (ticketData.date ? format(new Date(ticketData.date), 'dd MMM yyyy') : 'N/A')}</p>
                  </div>
                  <span className="hidden sm:block px-4 py-1.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-sm shadow-emerald-200 uppercase">
                    {ticketData.status}
                  </span>
                </div>

                {/* Ticket details */}
                <div className="p-6">
                  {/* Route display */}
                  <div className="flex items-center gap-4 mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                      <Bus className="w-32 h-32 -mr-8 -mt-8" />
                    </div>

                    <div className="text-left z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Departure</p>
                      <p className="text-xl font-black text-premium text-primary leading-tight">{ticketData.bus?.route.from}</p>
                      <p className="text-2xl font-black text-primary/80 mt-1">{ticketData.bus?.departureTime}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center px-4">
                      <div className="w-full relative h-[2px] bg-slate-200">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-white rounded-full border border-slate-200">
                          <Bus className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      <p className="text-[8px] font-black uppercase text-slate-400 mt-4 tracking-widest">Express Service</p>
                    </div>

                    <div className="text-right z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Arrival</p>
                      <p className="text-xl font-black text-premium text-primary leading-tight">{ticketData.bus?.route.to}</p>
                      <p className="text-2xl font-black text-primary/80 mt-1">{ticketData.bus?.arrivalTime}</p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10 px-2">
                    {[
                      { icon: User, label: "Booking Name", value: ticketData.passengers[0]?.name + (ticketData.passengers.length > 1 ? ` +${ticketData.passengers.length - 1}` : "") },
                      { icon: QrCode, label: "PNR Reference", value: ticketData.pnr },
                      { icon: Bus, label: "Vehicle Number", value: ticketData.bus?.busNumber },
                      { icon: MapPin, label: "Seats Reserved", value: ticketData.passengers.map((p: any) => p.seatNumber).join(", ") },
                      { icon: Clock, label: "Booking Date", value: format(new Date(ticketData.createdAt), 'dd MMM yyyy, hh:mm a') },
                      { icon: CheckCircle, label: "Fare Amount", value: `₹ ${ticketData.amount}` },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-3 group">
                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary/5 transition-colors">
                          <item.icon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
                          <p className="text-xs font-bold text-premium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex-1 h-11 border-slate-200 font-bold text-xs uppercase tracking-widest">Download E-Ticket</Button>
                  <Button className="flex-1 h-11 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest">
                    Share Confirmation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="portal-card p-12 flex flex-col items-center text-center border-danger/20 bg-danger/5 shadow-xl">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6 rotate-12">
                  <XCircle className="w-10 h-10 text-danger" />
                </div>
                <h3 className="font-black text-premium text-xl mb-2 text-danger uppercase tracking-tighter">Ticket Not Found</h3>
                <p className="text-xs font-medium text-slate-500 max-w-xs mb-8">
                  We couldn't find any booking associated with PNR <span className="font-mono font-black text-premium">"{pnr}"</span>. Please verify the number and try again.
                </p>
                <Button className="font-black text-xs uppercase tracking-widest px-8" variant="outline" onClick={() => { setSearched(false); setPnr(""); }}>
                  Reset Search
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
