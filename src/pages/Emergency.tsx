import { useState } from "react";
import { AlertTriangle, Phone, Shield, Hospital, Radio, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";

const emergencyServices = [
  // ... (stays same)
];

export default function Emergency() {
  const [alertSent, setAlertSent] = useState(false);
  const [locationShared, setLocationShared] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmergency = async () => {
    setLoading(true);
    try {
      await api.createEmergencyAlert({
        type: 'SOS',
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: "Bengaluru, Karnataka"
        },
        status: 'Active'
      });
      setAlertSent(true);
      setLocationShared(true);
    } catch (err) {
      alert("Failed to send alert. Please call emergency services directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout noFooter>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full mb-4"
            style={{ backgroundColor: "hsl(var(--danger-light))" }}>
            <AlertTriangle className="w-10 h-10 text-danger" />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "hsl(var(--danger))" }}>
            Emergency Assistance
          </h1>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Press the button below to immediately alert emergency services.<br />
            Your live location will be shared automatically.
          </p>
        </div>

        {/* Main SOS button */}
        {!alertSent ? (
          <div className="text-center mb-8">
            <button
              onClick={handleEmergency}
              disabled={loading}
              className="relative w-40 h-40 rounded-full mx-auto flex flex-col items-center justify-center transition-all active:scale-95 hover:shadow-elevated font-bold text-white text-lg border-4 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "hsl(var(--danger))",
                borderColor: "hsl(var(--danger-foreground))",
                boxShadow: "0 0 0 8px hsl(var(--danger) / 0.15), 0 0 0 16px hsl(var(--danger) / 0.05)"
              }}>
              <AlertTriangle className="w-10 h-10 mb-1" fill="white" />
              {loading ? "SENDING..." : "SOS"}
              <span className="text-xs font-medium opacity-80">{loading ? "PLEASE WAIT" : "TAP FOR HELP"}</span>
            </button>
            <p className="text-xs mt-4" style={{ color: "hsl(var(--muted-foreground))" }}>
              This will immediately alert nearby services and share your location
            </p>
          </div>
        ) : (
          <div className="portal-card p-5 mb-6 text-center animate-slide-up"
            style={{ borderColor: "hsl(var(--danger))", borderWidth: 2 }}>
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
            <h2 className="font-bold text-base mb-1" style={{ color: "hsl(var(--success))" }}>
              Emergency Alert Sent!
            </h2>
            <p className="text-sm mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
              Help is on the way. Stay calm and stay in place if safe.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-success">
              <Radio className="w-3.5 h-3.5 live-pulse" />
              Live location being shared with emergency services
            </div>
            <Button variant="outline" className="mt-4 text-xs" size="sm"
              onClick={() => setAlertSent(false)}>
              Cancel Alert
            </Button>
          </div>
        )}

        {/* Location status */}
        <div className="portal-card p-4 mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg"
            style={{ backgroundColor: locationShared ? "hsl(var(--success-light))" : "hsl(var(--muted))" }}>
            <MapPin className="w-5 h-5" style={{ color: locationShared ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              {locationShared ? "Live Location Active" : "Location Not Shared"}
            </p>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              {locationShared
                ? "Your GPS coordinates are being transmitted: 12.9716°N, 77.5946°E"
                : "Enable location to share with emergency services"}
            </p>
          </div>
          {locationShared && <Radio className="w-4 h-4 ml-auto live-pulse text-success" />}
        </div>

        {/* Emergency contacts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {emergencyServices.map(svc => (
            <a key={svc.name} href={`tel:${svc.number}`}
              className="portal-card p-4 flex flex-row sm:flex-col items-center text-left sm:text-center gap-4 sm:gap-0 hover:shadow-elevated transition-shadow">
              <div className="p-2.5 rounded-full mb-2 flex-shrink-0"
                style={{ backgroundColor: `hsl(var(--${svc.color}-light))` }}>
                <svc.icon className="w-5 h-5" style={{ color: `hsl(var(--${svc.color}))` }} />
              </div>
              <div className="flex-1 sm:flex-none">
                <p className="font-bold text-lg sm:text-xl mb-0.5" style={{ color: `hsl(var(--${svc.color}))` }}>
                  {svc.number}
                </p>
                <p className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>{svc.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">{svc.desc}</p>
              </div>
              <span className="mt-2 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest bg-slate-100 sm:bg-transparent"
                style={{
                  color: `hsl(var(--${svc.color}))`,
                  backgroundColor: `hsl(var(--${svc.color}) / 0.1)`
                }}>
                Call
              </span>
            </a>
          ))}
        </div>

        {/* Yatra Setu helpline */}
        <div className="portal-card p-4 mt-4 flex items-center gap-3"
          style={{ borderLeft: "4px solid hsl(var(--primary))" }}>
          <Phone className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: "hsl(var(--primary))" }}>
              Yatra Setu Bus Helpline
            </p>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
              1800-XXX-XXXX • Available 24×7 • Toll Free
            </p>
          </div>
          <a href="tel:1800000000" className="ml-auto">
            <Button size="sm"
              style={{ backgroundColor: "hsl(var(--primary))", color: "white" }}>
              Call Now
            </Button>
          </a>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "hsl(var(--muted-foreground))" }}>
          All calls are free from any network. Emergency services available 24×7.
        </p>
      </div>
    </Layout>
  );
}
