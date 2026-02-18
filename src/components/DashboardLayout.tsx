import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { cn } from "@/lib/utils";

interface SidebarItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  sidebarItems: SidebarItem[];
  accentColor?: string;
}

export default function DashboardLayout({ children, title, subtitle, sidebarItems, accentColor }: DashboardLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0"
          style={{ backgroundColor: "hsl(var(--sidebar-background))" }}>
          {/* Panel Header */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-1"
              style={{ color: "hsl(var(--sidebar-foreground))" }}>
              {subtitle}
            </p>
            <h2 className="text-base font-bold" style={{ color: "hsl(var(--sidebar-foreground))" }}>
              {title}
            </h2>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {sidebarItems.map(item => {
              const active = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all"
                  style={{
                    backgroundColor: active ? "hsl(var(--sidebar-accent))" : "transparent",
                    color: active ? "hsl(var(--sidebar-primary))" : "hsl(var(--sidebar-foreground))",
                  }}>
                  <span className="w-4 h-4 shrink-0">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-5 py-4 border-t text-xs opacity-50" style={{ borderColor: "hsl(var(--sidebar-border))", color: "hsl(var(--sidebar-foreground))" }}>
            Yatra Setu Portal v2.4
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 overflow-auto">
          {/* Page header */}
          <div className="px-6 py-5 border-b bg-card"
            style={{ borderColor: "hsl(var(--border))" }}>
            <h1 className="text-xl font-bold" style={{ color: "hsl(var(--primary))" }}>{title}</h1>
            <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{subtitle}</p>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
