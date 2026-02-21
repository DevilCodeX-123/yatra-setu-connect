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
  School,
  Route,
  CreditCard,
  Wifi
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./brand/Logo";
import LogoIcon from "./brand/LogoIcon";

const menuGroups = {
  consumer: [
    { title: "Home", url: "/", icon: Home },
    { title: "Transaction", url: "/transactions", icon: History },
    { title: "Account", url: "/account", icon: UserCircle },
    { title: "Available Buses", url: "/buses", icon: Bus },
    { title: "Profile", url: "/profile", icon: User },
    { title: "Past Rides", url: "/profile/past-rides", icon: Route },
    { title: "Employee", url: "/employee", icon: Shield },
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader className="bg-sidebar border-b border-white/5 pt-5 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-white/10 rounded-xl transition-all h-auto py-2">
              <Link to="/" className="flex items-center gap-3">
                <LogoIcon size={36} className="shrink-0 shadow-lg" />
                <div className="flex flex-col gap-0 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="font-bold text-white text-base tracking-tight">Yatra Setu</span>
                  <span className="text-[9px] font-medium text-blue-300 opacity-60">
                    Smart Transport
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="bg-sidebar px-2 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[9px] font-semibold text-blue-300/60 mb-1 px-3">
            {group.toUpperCase()} Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={active}
                      className={`h-10 rounded-xl transition-all duration-200 ${active
                        ? "bg-primary-light text-white shadow-md shadow-blue-600/20"
                        : "text-blue-200/70 hover:text-white hover:bg-white/8"
                        }`}
                    >
                      <Link to={item.url} className="px-3 flex items-center gap-3">
                        <item.icon className="size-4 shrink-0" />
                        <span className="text-xs font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="bg-sidebar border-t border-white/5 p-4">
        <div className="flex items-center gap-2.5 text-[9px] font-semibold text-blue-300/50 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>System Online</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
