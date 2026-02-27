import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Home,
  History,
  UserCircle,
  User,
  HelpCircle,
  Bus,
  Navigation,
  AlertCircle,
  Users,
  DollarSign,
  Package,
  Calendar,
  TrendingUp,
  Shield,
  Edit,
  School,
  Building2,
  Route,
  CreditCard,
  Wifi,
  Lock,
  KeyRound
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./brand/Logo";
import LogoIcon from "./brand/LogoIcon";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const menuGroups = {
  consumer: [
    { title: "sidebar.home", url: "/", icon: Home },
    { title: "sidebar.transaction", url: "/transactions", icon: History },
    { title: "sidebar.buses", url: "/buses", icon: Bus },
    { title: "sidebar.pastRides", url: "/profile/past-rides", icon: Route },
    { title: "Profile", url: "/account", icon: UserCircle },
    { title: "sidebar.orgTracking", url: "/official-tracking", icon: Building2 },
    { title: "sidebar.support", url: "/support", icon: HelpCircle },
  ],
  passenger: [
    { title: "sidebar.overview", url: "/passenger", icon: User },
    { title: "sidebar.bookTicket", url: "/booking", icon: Bus },
    { title: "sidebar.myTickets", url: "/verify", icon: CreditCard },
    { title: "sidebar.travelHistory", url: "#history", icon: History },
  ],
  driver: [
    { title: "sidebar.todayRoute", url: "/driver", icon: Navigation },
    { title: "sidebar.passengerList", url: "#passengers", icon: Users },
    { title: "sidebar.stopAlerts", url: "#alerts", icon: AlertCircle },
  ],
  owner: [
    { title: "sidebar.fleet", url: "/owner", icon: Bus },
    { title: "sidebar.bookingRecords", url: "/owner#bookings", icon: Calendar },
    { title: "sidebar.earnings", url: "/owner#earnings", icon: DollarSign },
    { title: "sidebar.rent", url: "/owner#rent", icon: Package },
    { title: "Tracking Requests", url: "/owner#tracking", icon: Shield },
    { title: "Employees", url: "/owner#employees", icon: Users },
    { title: "Feedback", url: "/owner#complaints", icon: Edit },
  ],
  admin: [
    { title: "sidebar.overview", url: "/admin", icon: TrendingUp },
    { title: "sidebar.allBuses", url: "#buses", icon: Bus },
    { title: "sidebar.driversOwners", url: "#drivers", icon: Users },
    { title: "sidebar.routes", url: "#routes", icon: Route },
    { title: "sidebar.schoolBuses", url: "#school", icon: School },
    { title: "sidebar.eventBuses", url: "#events", icon: Shield },
  ]
};

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { role } = useAuth();
  const [isStaffRegistered, setIsStaffRegistered] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activationData, setActivationData] = useState({
    busNumber: "",
    driverCode: ""
  });

  const handleActivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (activationData.busNumber.toUpperCase() === "YS-101" && activationData.driverCode === "2026") {
      setIsStaffRegistered(true);
      setIsDialogOpen(false);
      toast.success("Duty Activated! Driver Panel is now live.");
    } else {
      toast.error("Invalid Bus Number or Driver Code.");
    }
  };

  const getActiveGroup = () => {
    // If user is Owner, prioritize the owner sidebar group so management links stay visible
    if (role === 'Owner' || role === 'Owner+Employee') return 'owner';
    if (role === 'Admin') return 'admin';
    if (role === 'Driver') return 'driver';

    if (location.pathname.startsWith('/passenger')) return 'passenger';
    if (location.pathname.startsWith('/driver')) return 'driver';
    if (location.pathname.startsWith('/owner')) return 'owner';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'consumer';
  };

  const group = getActiveGroup();
  const items = menuGroups[group];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header - Theme-Aware Branding Zone */}
      <SidebarHeader className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5 pt-5 pb-4 transition-colors">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-slate-100/50 rounded-xl transition-all h-auto py-2">
              <Link to="/" className="flex items-center gap-3">
                <LogoIcon size={32} className="shrink-0" variant="full" />
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-black !text-black dark:!text-white tracking-[0.2em] uppercase transition-colors">Yatra Setu</span>
                  <span className="text-[8px] font-bold !text-slate-600 dark:!text-slate-400 uppercase tracking-tighter mt-0.5 transition-colors">Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="bg-sidebar px-2 pt-4">
        {group === 'owner' ? (
          <>
            {/* Passenger Section for Owner */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[9px] font-semibold text-blue-300/60 mb-1 px-3 uppercase">
                {t('sidebar.passenger')} {t('sidebar.nav')}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {[
                    { title: "sidebar.home", url: "/", icon: Home },
                    { title: "sidebar.transaction", url: "/transactions", icon: History },
                    { title: "sidebar.bookTicket", url: "/booking", icon: Bus },
                    { title: "sidebar.buses", url: "/buses", icon: Navigation },
                    { title: "sidebar.myTickets", url: "/verify", icon: CreditCard },
                    { title: "sidebar.pastRides", url: "/profile/past-rides", icon: Route },
                    { title: "sidebar.profile", url: "/account", icon: UserCircle },
                    { title: "sidebar.orgTracking", url: "/official-tracking", icon: Building2 },
                    { title: "sidebar.support", url: "/support", icon: HelpCircle },
                  ].map((item) => {
                    const active = location.pathname === item.url;
                    const translatedTitle = t(item.title);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          tooltip={translatedTitle}
                          isActive={active}
                          className={`h-10 rounded-xl transition-all duration-200 ${active
                            ? "bg-primary-light text-white shadow-md shadow-blue-600/20"
                            : "text-blue-200/70 hover:text-white hover:bg-white/8"
                            }`}
                        >
                          <Link to={item.url} className="px-3 flex items-center gap-3">
                            <item.icon className="size-4 shrink-0" />
                            <span className="text-xs font-medium">{translatedTitle}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Management Section for Owner */}
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-[9px] font-semibold text-blue-300/60 mb-1 px-3 uppercase">
                {t('sidebar.management')}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {items.map((item) => {
                    const active = location.pathname === item.url || (item.url.startsWith('#') && location.hash === item.url);
                    const translatedTitle = t(item.title);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          tooltip={translatedTitle}
                          isActive={active}
                          className={`h-10 rounded-xl transition-all duration-200 ${active
                            ? "bg-primary-light text-white shadow-md shadow-blue-600/20"
                            : "text-blue-200/70 hover:text-white hover:bg-white/8"
                            }`}
                        >
                          <Link to={item.url} className="px-3 flex items-center gap-3">
                            <item.icon className="size-4 shrink-0" />
                            <span className="text-xs font-medium">{translatedTitle}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[9px] font-semibold text-blue-300/60 mb-1 px-3 uppercase">
              {group} {t('sidebar.nav')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {items.map((item) => {
                  const active = location.pathname === item.url;
                  const translatedTitle = t(item.title);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={translatedTitle}
                        isActive={active}
                        className={`h-10 rounded-xl transition-all duration-200 ${active
                          ? "bg-primary-light text-white shadow-md shadow-blue-600/20"
                          : "text-blue-200/70 hover:text-white hover:bg-white/8"
                          }`}
                      >
                        <Link to={item.url} className="px-3 flex items-center gap-3">
                          <item.icon className="size-4 shrink-0" />
                          <span className="text-xs font-medium">{translatedTitle}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Global Management Section for Staff */}
        {(role === 'Employee' || role === 'Driver' || role === 'Conductor' || true) && (
          <SidebarGroup className="mt-4 border-t border-white/5 pt-4">
            <SidebarGroupLabel className="text-[9px] font-black text-blue-300/40 mb-2 px-3 uppercase tracking-[0.2em]">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {!isStaffRegistered ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setIsDialogOpen(true)}
                      className="h-11 rounded-xl text-blue-200/70 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/5 mx-1"
                    >
                      <div className="px-2 flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                          <Shield className="size-4" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-tight">Start Job (Activation)</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="h-11 rounded-xl text-white bg-blue-600/20 hover:bg-blue-600/30 transition-all border border-blue-500/20 mx-1"
                    >
                      <Link to="/employee" className="px-2 flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                          <Navigation className="size-4" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-tight">Driver Panel</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Staff Activation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white rounded-[32px] overflow-hidden">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 mb-2">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Job Activation</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400">
              Enter your assigned bus number and driver code to start your duty.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleActivation} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bus-number" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Assigned Bus Number</Label>
                <div className="relative">
                  <Bus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <Input
                    id="bus-number"
                    placeholder="e.g. YS-101"
                    value={activationData.busNumber}
                    onChange={(e) => setActivationData({ ...activationData, busNumber: e.target.value })}
                    className="h-12 bg-white/5 border-white/10 text-white pl-11 rounded-xl focus:ring-blue-600/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver-code" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Driver Activation Code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <Input
                    id="driver-code"
                    type="password"
                    placeholder="••••••"
                    value={activationData.driverCode}
                    onChange={(e) => setActivationData({ ...activationData, driverCode: e.target.value })}
                    className="h-12 bg-white/5 border-white/10 text-white pl-11 rounded-xl focus:ring-blue-600/50"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-start pt-2">
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
              >
                START JOB NOW
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <SidebarFooter className="bg-sidebar border-t border-white/5 p-4">
        <div className="flex items-center gap-2.5 text-[9px] font-semibold text-blue-300/50 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('sidebar.systemOnline')}</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar >
  );
}
