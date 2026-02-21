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
  HandCoins,
  User,
  HelpCircle,
  MoreHorizontal,
  Bus,
  Navigation,
  AlertCircle,
  Users,
  DollarSign,
  Package,
  Calendar,
  TrendingUp,
  Shield,
  School,
  Route,
  CreditCard
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const menuGroups = {
  consumer: [
    { title: "Home", url: "/", icon: Home },
    { title: "Transaction", url: "/transactions", icon: History },
    { title: "Account", url: "/account", icon: UserCircle },
    { title: "Lentings", url: "/lentings", icon: HandCoins },
    { title: "Profile", url: "/profile", icon: User },
    { title: "Past Rides", url: "/profile/past-rides", icon: Route },
    { title: "Support", url: "/support", icon: HelpCircle },
  ],
  passenger: [
    { title: "Overview", url: "/passenger", icon: User },
    { title: "Book Ticket", url: "/booking", icon: Bus },
    { title: "My Tickets", url: "/verify", icon: CreditCard },
    { title: "Travel History", url: "#history", icon: History },
  ],
  driver: [
    { title: "Today's Route", url: "/driver", icon: Navigation },
    { title: "Passenger List", url: "#passengers", icon: Users },
    { title: "Stop Alerts", url: "#alerts", icon: AlertCircle },
  ],
  owner: [
    { title: "Fleet Overview", url: "/owner", icon: Bus },
    { title: "Booking Records", url: "#bookings", icon: Calendar },
    { title: "Earnings", url: "#earnings", icon: DollarSign },
    { title: "Rent for Event", url: "#rent", icon: Package },
  ],
  admin: [
    { title: "Overview", url: "/admin", icon: TrendingUp },
    { title: "All Buses", url: "#buses", icon: Bus },
    { title: "Drivers & Owners", url: "#drivers", icon: Users },
    { title: "Routes", url: "#routes", icon: Route },
    { title: "School Buses", url: "#school", icon: School },
    { title: "Event Buses", url: "#events", icon: Shield },
  ]
};

export function AppSidebar() {
  const location = useLocation();

  const getActiveGroup = () => {
    if (location.pathname.startsWith('/passenger')) return 'passenger';
    if (location.pathname.startsWith('/driver')) return 'driver';
    if (location.pathname.startsWith('/owner')) return 'owner';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'consumer';
  };

  const group = getActiveGroup();
  const items = menuGroups[group];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      <SidebarHeader className="bg-[#1E293B] border-b border-white/5 pt-6 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-white/5">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Bus className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-black italic uppercase tracking-tighter text-white">Yatra Setu</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 opacity-60 group-data-[collapsible=icon]:hidden">Smart Network</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-[#1E293B] px-3 pt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 px-3">
            {group.toUpperCase()} Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={location.pathname === item.url}
                    className={`h-11 rounded-xl transition-all ${location.pathname === item.url ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                  >
                    <Link to={item.url} className="px-3">
                      <item.icon className="size-4" />
                      <span className="text-xs font-black uppercase tracking-widest italic">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-[#1E293B] border-t border-white/5 p-4">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/30 group-data-[collapsible=icon]:hidden">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Online</span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
