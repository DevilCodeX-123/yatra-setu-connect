import { Link, useLocation } from "react-router-dom";
import { Home, ClipboardList, HelpCircle, User } from "lucide-react";

export default function BottomNav() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
        <Link to={to} className="flex flex-col items-center gap-1 flex-1 py-3 relative group">
            <Icon className={`w-5 h-5 transition-all duration-200 ${isActive(to)
                    ? 'text-primary scale-110'
                    : 'text-slate-400 group-hover:text-primary'
                }`} />
            <span className={`text-[9px] font-semibold tracking-wide ${isActive(to) ? 'text-primary' : 'text-slate-400'
                }`}>
                {label}
            </span>
            {isActive(to) && (
                <div className="absolute top-0 w-8 h-[3px] bg-primary rounded-full animate-in slide-in-from-top duration-300" />
            )}
        </Link>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-border px-2 flex justify-around items-center z-[150] shadow-elevated backdrop-blur-xl md:hidden">
            <NavItem to="/" icon={Home} label="Home" />
            <NavItem to="/booking" icon={ClipboardList} label="Bookings" />
            <NavItem to="/support" icon={HelpCircle} label="Help" />
            <NavItem to="/profile" icon={User} label="My Account" />
        </div>
    );
}
