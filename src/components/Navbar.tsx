import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe, ChevronDown, Phone, Moon, Sun, User as UserIcon, LogOut } from "lucide-react";
import Logo from "./brand/Logo";
import { Button } from "@/components/ui/button";
import NotificationPanel from "@/components/NotificationPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";
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
  const { language, setLanguage, t } = useTranslation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const { isAuthenticated, user, logout } = useAuth();
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
                {languages.find(l => l.code === language)?.label}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              {languages.map(l => (
                <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code as Language)} className="text-sm">
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary font-black text-[10px] cursor-pointer border-2 border-white/20">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'YS'}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="text-xs h-8 bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-lg" asChild>
              <Link to="/login">{t('nav.login')}</Link>
            </Button>
          )}
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
            {t('nav.govName')}
          </p>
          <div className="flex items-center gap-6">
            <a href="tel:1800" className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white transition-colors font-medium">
              <Phone className="w-3 h-3" />
              {t('nav.helpline')}
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-xs font-semibold text-blue-200 hover:text-white transition-colors">
                  <Globe className="w-3 h-3" />
                  {languages.find(l => l.code === language)?.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px]">
                {languages.map(l => (
                  <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code as Language)} className="text-sm">
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
                        {t('nav.portals')} <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[200px]">
                      {link.children.map((child, idx) => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link to={child.href} className="text-sm font-medium">
                            {idx === 0 ? t('nav.passenger') :
                              idx === 1 ? t('nav.driver') :
                                idx === 2 ? t('nav.owner') :
                                  idx === 3 ? t('nav.employee') :
                                    t('nav.admin')}
                          </Link>
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
                    {t('nav.emergency')}
                  </Link>
                );
              }
              return (
                <Link key={link.href} to={link.href!}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href || "")
                    ? "bg-white/20 text-white font-semibold"
                    : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}>
                  {link.href === '/' ? t('nav.home') : link.href === '/booking' ? t('nav.booking') : t('nav.verify')}
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-xs cursor-pointer border border-white/30 hover:bg-white/30 transition-all">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'YS'}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 font-medium">
                    <UserIcon className="w-4 h-4" /> {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 flex items-center gap-2 font-medium">
                  <LogOut className="w-4 h-4" /> {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-xl shadow-md px-4 transition-all hover:scale-[1.02]" asChild>
              <Link to="/login">{t('nav.login')}</Link>
            </Button>
          )}

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
                        {t('nav.portals')}
                      </p>
                      {link.children.map((child, idx) => (
                        <Link key={child.href} to={child.href}
                          onClick={() => setOpen(false)}
                          className="block px-6 py-2.5 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          {idx === 0 ? t('nav.passenger') :
                            idx === 1 ? t('nav.driver') :
                              idx === 2 ? t('nav.owner') :
                                idx === 3 ? t('nav.employee') :
                                  t('nav.admin')}
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
                    {link.href === '/' ? t('nav.home') :
                      link.href === '/booking' ? t('nav.booking') :
                        link.href === '/verify' ? t('nav.verify') :
                          link.href === '/school-bus' ? t('nav.schoolBus') :
                            t('nav.emergency')}
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 transition-colors">
                      <UserIcon className="w-4 h-4" /> {t('nav.profile')}
                    </Link>
                    <button onClick={() => { logout(); setOpen(false); }} className="flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" /> {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-lg w-full" asChild>
                    <Link to="/login" onClick={() => setOpen(false)}>{t('nav.login')}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
