import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe, ChevronDown, Phone, Moon, Sun } from "lucide-react";
import Logo from "./brand/Logo";
import { Button } from "@/components/ui/button";
import NotificationPanel from "@/components/NotificationPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      { href: "/employee", label: "Employee Panel" },
      { href: "/admin", label: "Admin Panel" },
    ],
  },
  { href: "/school-bus", label: "School Bus" },
  { href: "/emergency", label: "Emergency", danger: true },
];

export default function Navbar({ minimal = false }: { minimal?: boolean }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ys_dark", next ? "1" : "0");
  };

  if (minimal) {
    return (
      <header className="w-full">
        <div className="flex items-center justify-end gap-3">
          <NotificationPanel />
          <button
            onClick={toggleDark}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {dark
              ? <Sun className="w-4 h-4 text-blue-200" />
              : <Moon className="w-4 h-4 text-blue-200" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-xs font-medium text-blue-200 hover:text-white transition-colors">
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
          <Button size="sm" className="text-xs h-8 bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-lg" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Blue brand stripe */}
      <div className="h-1 w-full gov-stripe" />

      {/* Top utility bar */}
      <div className="bg-primary px-4 py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-xs text-blue-200 font-medium">
            Government of India — Ministry of Road Transport &amp; Highways
          </p>
          <div className="flex items-center gap-6">
            <a href="tel:1800" className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white transition-colors font-medium">
              <Phone className="w-3 h-3" />
              Helpline: 1800-XXX-XXXX
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-xs font-semibold text-blue-200 hover:text-white transition-colors">
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

      {/* Main nav — deep blue */}
      <nav className="bg-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo className="h-10" />
          </Link>

          {/* Desktop Nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.children) {
                return (
                  <DropdownMenu key={link.label}>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 transition-all">
                        {link.label} <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[200px]">
                      {link.children.map(child => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link to={child.href} className="text-sm font-medium">{child.label}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              if (link.danger) {
                return (
                  <Link key={link.href} to={link.href}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold text-red-300 hover:text-white hover:bg-red-500/20 border border-red-400/30 transition-all">
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link key={link.href} to={link.href!}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href || "")
                    ? "bg-white/20 text-white font-semibold"
                    : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="hidden lg:flex items-center gap-2">
            <NotificationPanel />
            <button
              onClick={toggleDark}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              {dark
                ? <Sun className="w-4 h-4 text-blue-200" />
                : <Moon className="w-4 h-4 text-blue-200" />}
            </button>
            <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-xl shadow-md px-4 transition-all hover:scale-[1.02]" asChild>
              <Link to="/login">Login</Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {open && (
          <div className="lg:hidden bg-primary border-t border-white/10 animate-slide-up">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                if (link.children) {
                  return (
                    <div key={link.label}>
                      <p className="px-3 py-1.5 text-xs font-semibold text-blue-300">
                        {link.label}
                      </p>
                      {link.children.map(child => (
                        <Link key={child.href} to={child.href}
                          onClick={() => setOpen(false)}
                          className="block px-6 py-2.5 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  );
                }
                return (
                  <Link key={link.href} to={link.href!}
                    onClick={() => setOpen(false)}
                    className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${link.danger
                      ? "text-red-300 hover:bg-red-500/10"
                      : isActive(link.href || "")
                        ? "bg-white/20 text-white font-semibold"
                        : "text-blue-100 hover:text-white hover:bg-white/10"
                      }`}>
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                <button
                  onClick={toggleDark}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 transition-colors"
                >
                  {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {dark ? "Light Mode" : "Dark Mode"}
                </button>
                <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-lg" asChild>
                  <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
