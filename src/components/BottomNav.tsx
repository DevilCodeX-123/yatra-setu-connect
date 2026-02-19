import { Link, useLocation } from "react-router-dom";
import { Home, ClipboardList, HelpCircle, User } from "lucide-react";

export default function BottomNav() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
        <Link to={to} className="flex flex-col items-center gap-1 flex-1 py-3 group">
            <Icon className={`w-6 h-6 transition-all ${isActive(to) ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive(to) ? 'text-[#1E293B]' : 'text-slate-400'}`}>
                {label}
            </span>
            {isActive(to) && <div className="absolute top-0 w-8 h-[3px] bg-primary rounded-full shadow-[0_2px_10px_rgba(239,68,68,0.3)] animate-in slide-in-from-top duration-300" />}
        </Link>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 flex justify-between items-center z-[150] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] max-w-xl mx-auto backdrop-blur-xl bg-white/90">
            <NavItem to="/" icon={Home} label="Home" />
            <NavItem to="/booking" icon={ClipboardList} label="Bookings" />
            <NavItem to="/support" icon={HelpCircle} label="Help" />
            <NavItem to="/profile" icon={User} label="My Account" />
        </div>
    );
}
