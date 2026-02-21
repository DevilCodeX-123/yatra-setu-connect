import { Link } from "react-router-dom";
import { Bus, Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import logoImg from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(0 0% 88%)" }}>
      {/* Tricolor stripe */}
      <div className="h-1 w-full" style={{
        background: "linear-gradient(to right, hsl(32,100%,50%) 33.33%, white 33.33%, white 66.66%, hsl(145,55%,38%) 66.66%)"
      }} />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoImg} alt="Yatra Setu" className="h-12 w-12 object-contain rounded-full" />
              <div>
                <p className="text-lg font-bold text-white">यात्रा सेतु</p>
                <p className="text-xs opacity-70">Smart Public Bus Network</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed opacity-75">
              A Digital India initiative for seamless, safe and smart public transport connectivity across the nation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm opacity-80">
              {[
                { href: "/", label: "Home" },
                { href: "/booking", label: "Book Ticket" },
                { href: "/verify", label: "Verify Ticket" },
                { href: "/school-bus", label: "School Bus Tracking" },
                { href: "/emergency", label: "Emergency" },
              ].map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="hover:text-accent transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 tracking-wider">Portals</h4>
            <ul className="space-y-2 text-sm opacity-80">
              {[
                { href: "/passenger", label: "Passenger Dashboard" },
                { href: "/driver", label: "Driver Panel" },
                { href: "/owner", label: "Bus Owner Panel" },
                { href: "/admin", label: "Admin Panel" },
              ].map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="hover:text-accent transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 tracking-wider">Contact</h4>
            <ul className="space-y-3 text-sm opacity-80">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--accent))" }} />
                <span>Helpline: 1800-XXX-XXXX<br />(Toll Free, 24×7)</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--accent))" }} />
                <span>support@yatrasetu.gov.in</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--accent))" }} />
                <span>Ministry of Road Transport<br />New Delhi – 110001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3 text-xs opacity-60"
          style={{ borderColor: "hsl(220 40% 28%)" }}>
          <p>© 2024 Yatra Setu — Government of India. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:opacity-100">Privacy Policy</a>
            <a href="#" className="hover:opacity-100">Terms of Use</a>
            <a href="#" className="hover:opacity-100">Accessibility</a>
            <a href="#" className="flex items-center gap-1 hover:opacity-100">
              <ExternalLink className="w-3 h-3" /> Digital India
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
