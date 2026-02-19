import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface LayoutProps {
  children: ReactNode;
  noFooter?: boolean;
}

export default function Layout({ children, noFooter }: LayoutProps) {
  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="flex h-16 items-center gap-4 px-6 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary" />
            <div className="h-4 w-px bg-slate-200 hidden md:block" />
            <div className="hidden md:block">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Yatra Setu Portal</p>
            </div>
          </div>
          <Navbar minimal />
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 bg-slate-50/50">{children}</main>
      {!noFooter && <Footer />}
    </div>
  );
}
