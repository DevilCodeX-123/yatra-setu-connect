import { Link } from "react-router-dom";
import { Bus, Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import logoImg from "@/assets/logo_new.png";
import { useTranslation } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useTranslation();
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
            <div className="flex items-center mb-4">
              <img src={logoImg} alt="Yatra Setu" className="h-16 w-auto object-contain" />
            </div>
            <p className="text-xs leading-relaxed opacity-75">
              {t('footer.digitalIndiaDesc')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 tracking-wider">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              {[
                { href: "/", label: t('nav.home') },
                { href: "/booking", label: t('nav.booking') },
                { href: "/verify", label: t('nav.verify') },
                { href: "/school-bus", label: t('nav.schoolBus') },
                { href: "/emergency", label: t('nav.emergency') },
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
            <h4 className="text-sm font-semibold text-white mb-3 tracking-wider">{t('footer.portals')}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              {[
                { href: "/passenger", label: t('nav.passenger') },
                { href: "/driver", label: t('nav.driver') },
                { href: "/owner", label: t('nav.owner') },
                { href: "/admin", label: t('nav.admin') },
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
            <h4 className="text-sm font-semibold text-white mb-3 tracking-wider">{t('footer.contact')}</h4>
            <ul className="space-y-3 text-sm opacity-80">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--accent))" }} />
                <span>{t('nav.helpline')}<br />{t('footer.tollFree')}</span>
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
          <p>{t('footer.copyright')}</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:opacity-100">{t('footer.privacy')}</a>
            <a href="#" className="hover:opacity-100">{t('footer.terms')}</a>
            <a href="#" className="hover:opacity-100">{t('footer.accessibility')}</a>
            <a href="#" className="flex items-center gap-1 hover:opacity-100">
              <ExternalLink className="w-3 h-3" /> Digital India
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
