import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useTranslation } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import LogoIcon from "./brand/LogoIcon";
import { InvitationPoll } from "./InvitationPoll";

interface LayoutProps {
  children: ReactNode;
  noFooter?: boolean;
}

export default function Layout({ children, noFooter }: LayoutProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-40 bg-white dark:bg-[#020617] backdrop-blur-md border-b border-slate-200 dark:border-white/5">
        <div className="flex h-16 items-center gap-4 px-6 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary" />
            <div className="h-6 w-px bg-slate-200" />
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <LogoIcon size={32} variant="full" />
              <div className="hidden md:flex flex-col leading-none">
                <p className="text-[10px] font-black tracking-[0.2em] !text-black dark:!text-white uppercase transition-colors">Yatra Setu</p>
                <p className="text-[7px] font-bold !text-slate-600 dark:!text-slate-400 uppercase tracking-tighter transition-colors">Official Portal</p>
              </div>
            </Link>
          </div>
          <Navbar minimal />
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 bg-slate-50/50 dark:bg-[#020617]">{children}</main>
      {!noFooter && <Footer />}
      <InvitationPoll />
    </div>
  );
}
