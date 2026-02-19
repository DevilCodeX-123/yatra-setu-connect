import { useState } from "react";
import { CheckCircle, XCircle, Search, QrCode, Bus, Clock, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";

const mockTicket = {
  pnr: "YS20241218001",
  passenger: "Rajesh Kumar",
  from: "Bengaluru",
  to: "Mysuru",
  date: "18 Dec 2024",
  departure: "06:30",
  arrival: "09:15",
  seat: "14",
  bus: "KA-01-F-1234",
  type: "Express",
  status: "CONFIRMED",
  amount: "₹ 180",
  booked: "17 Dec 2024, 10:23 AM",
};

export default function VerifyTicket() {
  const [pnr, setPnr] = useState("");
  const [searched, setSearched] = useState(false);
  const [found, setFound] = useState(false);

  const handleSearch = () => {
    setSearched(true);
    setFound(pnr === "YS20241218001" || pnr === "demo");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl text-premium text-primary">Verify Ticket</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">
            Enter your PNR number to check booking status
          </p>
        </div>

        {/* Search */}
        <div className="portal-card p-5 mb-6">
          <label className="block text-[10px] text-premium opacity-50 mb-2">
            PNR / Booking Reference
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
              <Input
                className="pl-9 font-mono text-sm"
                placeholder="e.g. YS20241218001 (or type 'demo')"
                value={pnr}
                onChange={e => setPnr(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}
              style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              <Search className="w-4 h-4 mr-1" /> Verify
            </Button>
          </div>
          <p className="text-xs mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
            Try PNR: <button onClick={() => setPnr("YS20241218001")} className="underline font-mono">YS20241218001</button>
          </p>
        </div>

        {/* Result */}
        {searched && (
          <div className="animate-slide-up">
            {found ? (
              <div className="portal-card overflow-hidden">
                {/* Status header */}
                <div className="px-5 py-4 flex items-center gap-3"
                  style={{ backgroundColor: "hsl(var(--success-light))" }}>
                  <CheckCircle className="w-6 h-6 text-success" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-success">Ticket Confirmed</p>
                    <p className="text-[10px] font-bold text-success/60 uppercase">Valid for travel on {mockTicket.date}</p>
                  </div>
                  <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-success text-success-foreground">
                    {mockTicket.status}
                  </span>
                </div>

                {/* Ticket details */}
                <div className="p-5">
                  {/* Route display */}
                  <div className="flex items-center gap-4 mb-5 p-4 rounded-lg"
                    style={{ backgroundColor: "hsl(var(--primary-muted))" }}>
                    <div className="text-center">
                      <p className="text-2xl text-premium text-primary">{mockTicket.from}</p>
                      <p className="text-[10px] font-black uppercase opacity-40 text-primary">{mockTicket.departure}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="w-full h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
                      <Bus className="w-5 h-5 my-1" style={{ color: "hsl(var(--accent))" }} />
                      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{mockTicket.type}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl text-premium text-primary">{mockTicket.to}</p>
                      <p className="text-[10px] font-black uppercase opacity-40 text-primary">{mockTicket.arrival}</p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-y-3">
                    {[
                      { icon: User, label: "Passenger", value: mockTicket.passenger },
                      { icon: QrCode, label: "PNR", value: mockTicket.pnr },
                      { icon: Bus, label: "Bus Number", value: mockTicket.bus },
                      { icon: MapPin, label: "Seat", value: `Seat ${mockTicket.seat}` },
                      { icon: Clock, label: "Booked On", value: mockTicket.booked },
                      { icon: CheckCircle, label: "Amount Paid", value: mockTicket.amount },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-2">
                        <item.icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                        <div>
                          <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{item.label}</p>
                          <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-4 border-t flex gap-2" style={{ borderColor: "hsl(var(--border))" }}>
                  <Button variant="outline" size="sm" className="flex-1">Download PDF</Button>
                  <Button size="sm" className="flex-1"
                    style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                    Share Ticket
                  </Button>
                </div>
              </div>
            ) : (
              <div className="portal-card p-6 flex flex-col items-center text-center">
                <XCircle className="w-12 h-12 mb-3 text-danger" />
                <h3 className="font-bold text-base mb-1" style={{ color: "hsl(var(--foreground))" }}>Ticket Not Found</h3>
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  No booking found for PNR "{pnr}". Please check and try again.
                </p>
                <Button className="mt-4" variant="outline" onClick={() => { setSearched(false); setPnr(""); }}>
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
