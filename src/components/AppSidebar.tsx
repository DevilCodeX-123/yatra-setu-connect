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
  Wifi
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./brand/Logo";
import LogoIcon from "./brand/LogoIcon";
import { useTranslation } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

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
      {/* Header */}
      <SidebarHeader className="bg-sidebar border-b border-white/5 pt-5 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-white/10 rounded-xl transition-all h-auto py-2">
              <Link to="/" className="flex items-center gap-3">
                <LogoIcon size={40} className="shrink-0" variant="white" />
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
      </SidebarContent>

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
