import { Wrench, ArrowLeft, Construction } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ProfilePlaceholder({ title = "Feature" }: { title?: string }) {
    const navigate = useNavigate();
    return (
        <DashboardLayout
            title={title}
            subtitle="This section is currently being optimized for citizen use"
            sidebarItems={[]}
        >
            <div className="max-w-2xl mx-auto py-20 flex flex-col items-center text-center animate-slide-up">
                <div className="w-24 h-24 rounded-[30px] bg-slate-100 flex items-center justify-center text-primary mb-8 animate-pulse">
                    <Construction className="w-12 h-12" />
                </div>
                <h2 className="text-3xl text-premium text-primary mb-4 italic uppercase tracking-tighter">System Upgrade in Progress</h2>
                <p className="text-sm text-slate-500 max-w-md font-medium leading-relaxed mb-8">
                    The **{title}** module is undergoing a security audit and UI refinement as part of the Yatra Setu 2.0 release. We appreciate your patience as we build a better public transport ecosystem.
                </p>
                <Button onClick={() => navigate(-1)} className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest italic bg-primary shadow-xl shadow-primary/20">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Return to Profile
                </Button>
            </div>
        </DashboardLayout>
    );
}
