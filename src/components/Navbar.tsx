import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe, ChevronDown, Phone, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImg from "@/assets/logo.png";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
];

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/booking", label: "Book Ticket" },
  { href: "/verify", label: "Verify Ticket" },
  {
    label: "Portals",
    children: [
      { href: "/passenger", label: "Passenger Dashboard" },
      { href: "/driver", label: "Driver Panel" },
      { href: "/owner", label: "Bus Owner Panel" },
      { href: "/admin", label: "Admin Panel" },
    ],
  },
  { href: "/school-bus", label: "School Bus" },
  { href: "/emergency", label: "Emergency", danger: true },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50">
      {/* Government stripe */}
      <div className="h-1 w-full" style={{
        background: "linear-gradient(to right, hsl(32,100%,50%) 33.33%, white 33.33%, white 66.66%, hsl(145,55%,38%) 66.66%)"
      }} />

      {/* Top utility bar */}
      <div style={{ backgroundColor: "hsl(var(--primary))" }} className="px-4 py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-xs" style={{ color: "hsl(0 0% 85%)" }}>
            Government of India — Ministry of Road Transport & Highways
          </p>
          <div className="flex items-center gap-4">
            <a href="tel:1800" className="flex items-center gap-1 text-xs hover:underline" style={{ color: "hsl(0 0% 85%)" }}>
              <Phone className="w-3 h-3" /> Helpline: 1800-XXX-XXXX
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "hsl(var(--accent))" }}>
                  <Globe className="w-3 h-3" />
                  {languages.find(l => l.code === lang)?.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px]">
                {languages.map(l => (
                  <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className="text-sm">
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="bg-card border-b border-border shadow-card">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logoImg} alt="Yatra Setu" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-lg font-bold leading-tight" style={{ color: "hsl(var(--primary))" }}>
                यात्रा सेतु
              </p>
              <p className="text-[10px] font-medium leading-tight tracking-wide uppercase" style={{ color: "hsl(var(--muted-foreground))" }}>
                Smart Public Bus Network
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.children) {
                return (
                  <DropdownMenu key={link.label}>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors hover:bg-primary-muted"
                        style={{ color: "hsl(var(--foreground))" }}>
                        {link.label} <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {link.children.map(child => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link to={child.href} className="text-sm">{child.label}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              if (link.danger) {
                return (
                  <Link key={link.href} to={link.href}
                    className="px-3 py-1.5 rounded text-sm font-semibold border transition-colors"
                    style={{
                      color: "hsl(var(--danger))",
                      borderColor: "hsl(var(--danger))",
                      backgroundColor: isActive(link.href || "") ? "hsl(var(--danger-light))" : "transparent"
                    }}>
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link key={link.href} to={link.href!}
                  className="px-3 py-2 rounded text-sm font-medium transition-colors"
                  style={{
                    color: isActive(link.href || "") ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                    backgroundColor: isActive(link.href || "") ? "hsl(var(--primary-muted))" : "transparent",
                    fontWeight: isActive(link.href || "") ? "600" : "500",
                  }}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth Button */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-sm border-primary text-primary" asChild>
              <Link to="/passenger">Login</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button className="lg:hidden p-2 rounded" style={{ color: "hsl(var(--primary))" }} onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden border-t border-border bg-card animate-slide-up">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                if (link.children) {
                  return (
                    <div key={link.label}>
                      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {link.label}
                      </p>
                      {link.children.map(child => (
                        <Link key={child.href} to={child.href}
                          onClick={() => setOpen(false)}
                          className="block px-6 py-2 text-sm font-medium rounded hover:bg-primary-muted transition-colors"
                          style={{ color: "hsl(var(--foreground))" }}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  );
                }
                return (
                  <Link key={link.href} to={link.href!}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-sm font-medium rounded transition-colors"
                    style={{
                      color: link.danger ? "hsl(var(--danger))" : "hsl(var(--foreground))",
                      backgroundColor: isActive(link.href || "") ? "hsl(var(--primary-muted))" : "transparent",
                    }}>
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-border flex gap-2">
                {languages.map(l => (
                  <button key={l.code} onClick={() => setLang(l.code)}
                    className="px-3 py-1 text-xs rounded border transition-colors"
                    style={{
                      backgroundColor: lang === l.code ? "hsl(var(--primary))" : "transparent",
                      color: lang === l.code ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                      borderColor: "hsl(var(--border))"
                    }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
