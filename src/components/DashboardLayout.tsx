import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface SidebarItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: ReactNode;
  subtitle: string;
  sidebarItems: SidebarItem[];
  accentColor?: string;
}

export default function DashboardLayout({ children, title, subtitle, sidebarItems, accentColor }: DashboardLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex h-16 items-center gap-4 px-6 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary" />
            <div className="h-4 w-px bg-slate-200 hidden md:block" />
            <div className="hidden md:block">
              <h1 className="text-sm font-black text-black dark:text-white uppercase tracking-tight">{title}</h1>
              <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>
          <Navbar minimal />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background/50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
