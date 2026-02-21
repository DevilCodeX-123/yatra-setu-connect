import {
    ChevronRight, ClipboardList, User, Users, Train, Wallet,
    CreditCard, FileText, Tag, UserPlus, Info, Star, HelpCircle,
    Settings, Flag, CircleDollarSign, Languages, Palette, Bell,
    UserSquare2, History, Home, Bus, CreditCard as PaymentIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";

const sidebarItems = [
    { href: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
    { href: "/transactions", label: "Transaction", icon: <History className="w-4 h-4" /> },
    { href: "/account", label: "Account", icon: <Settings className="w-4 h-4" /> },
    { href: "/lentings", label: "Lentings", icon: <Bus className="w-4 h-4" /> },
    { href: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { href: "/support", label: "Support", icon: <HelpCircle className="w-4 h-4" /> },
];

export default function Profile() {
    const MenuItem = ({ icon: Icon, label, subtitle, trailing, to = "#" }: { icon: any; label: string; subtitle?: string; trailing?: string; to?: string }) => (
        <Link to={to} className="portal-card flex items-center justify-between p-4 mb-2 hover:bg-slate-50 transition-all cursor-pointer group active:scale-[0.99] border-l-4 border-l-transparent hover:border-l-primary group block">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-black text-[#1E293B] uppercase tracking-tighter italic group-hover:text-primary transition-colors">{label}</p>
                    {subtitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {trailing && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{trailing}</span>}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </div>
        </Link>
    );

    const SectionHeader = ({ label }: { label: string }) => (
        <div className="pt-8 pb-4 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-black italic text-[#1E293B] uppercase tracking-tighter">{label}</h2>
        </div>
    );

    return (
        <DashboardLayout
            title="Profile & Settings"
            subtitle="Manage your personal dashboard"
            sidebarItems={sidebarItems}
        >
            <div className="max-w-5xl space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Profile Card Overlay Style */}
                <div className="portal-card p-10 mb-8 bg-[#1E293B] text-white relative overflow-hidden rounded-[40px]">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] -mr-40 -mt-40 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[80px] -ml-32 -mb-32 rounded-full" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-28 h-28 rounded-[35px] bg-white text-[#1E293B] flex items-center justify-center text-4xl font-black italic shadow-2xl border-4 border-white/20">
                            JD
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-1">John Doe</h1>
                            <p className="text-sm font-bold text-emerald-400 uppercase tracking-[0.3em] mb-4">Premium Gold Traveler</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Active Status</span>
                                </div>
                                <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID:</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">YS-442-JD</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:ml-auto flex gap-3">
                            <Link to="/profile/info" className="h-12 px-6 bg-white text-[#1E293B] rounded-2xl text-[10px] font-black uppercase flex items-center justify-center tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                                Edit Profile
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
                    <div className="space-y-4">
                        {/* My Details */}
                        <SectionHeader label="My details" />
                        <MenuItem icon={ClipboardList} label="Bookings" to="/profile/bookings" />
                        <MenuItem icon={History} label="Past Rides" subtitle="Completed journeys & eco impact" to="/profile/past-rides" />
                        <MenuItem icon={User} label="Personal information" to="/profile/info" />
                        <MenuItem icon={Users} label="Passengers" to="/profile/passengers" />
                        <MenuItem icon={Train} label="IRCTC details" to="/profile/irctc" />

                        {/* Payments */}
                        <SectionHeader label="Payments" />
                        <MenuItem icon={Wallet} label="Yatra Wallet" to="/profile/wallet" />
                        <MenuItem icon={PaymentIcon} label="Payment methods" to="/profile/wallet" />
                        <MenuItem icon={FileText} label="GST details" to="/profile/gst" />
                    </div>

                    <div className="space-y-4">
                        {/* More */}
                        <SectionHeader label="System & Support" />
                        <MenuItem icon={Tag} label="Active Offers" to="/profile/offers" />
                        <MenuItem icon={UserPlus} label="Referrals" to="/profile/referrals" />
                        <MenuItem icon={Info} label="Know about Yatra Setu" to="/profile/about" />
                        <MenuItem icon={Star} label="Rate experience" to="/profile/rate" />
                        <MenuItem icon={HelpCircle} label="Help & Support" to="/support" />
                        <MenuItem icon={Settings} label="Account settings" to="/account" />

                        {/* Preferences */}
                        <SectionHeader label="Preferences" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="portal-card p-4 flex flex-col items-center text-center gap-2">
                                <Languages className="w-5 h-5 text-primary" />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Language</p>
                                <p className="text-xs font-black text-[#1E293B] uppercase italic">English</p>
                            </div>
                            <div className="portal-card p-4 flex flex-col items-center text-center gap-2">
                                <Palette className="w-5 h-5 text-blue-500" />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Theme</p>
                                <p className="text-xs font-black text-[#1E293B] uppercase italic">Classic Light</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-24 flex flex-col items-center gap-4 opacity-10">
                    <div className="w-20 h-1 bg-[#1E293B] rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-[1em]">Yatra Setu Portal</p>
                </div>

            </div>
        </DashboardLayout>
    );
}
