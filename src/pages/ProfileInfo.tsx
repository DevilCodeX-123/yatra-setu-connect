import { User, Mail, Phone, Calendar, Shield, MapPin, Save, Camera } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProfileInfo() {
    return (
        <DashboardLayout
            title="Personal Information"
            subtitle="Exhaustive control over your citizen profile"
            sidebarItems={[]}
        >
            <div className="max-w-3xl space-y-8 animate-slide-up">
                {/* Profile Identity */}
                <div className="portal-card p-8 bg-[#1E293B] text-white relative overflow-hidden rounded-[30px] flex flex-col md:flex-row items-center gap-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] -mr-32 -mt-32 rounded-full" />

                    <div className="relative group shrink-0">
                        <div className="w-32 h-32 rounded-[40px] bg-white text-[#1E293B] flex items-center justify-center text-5xl font-black shadow-2xl border-4 border-white/20">
                            JD
                        </div>
                        <button className="absolute bottom-0 right-0 p-2.5 bg-accent text-accent-foreground rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition-all border-4 border-[#1E293B]">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <p className="text-[10px] font-black tracking-[0.4em] text-accent mb-2">Citizen Identity</p>
                        <h2 className="text-4xl font-black mb-4">John Doe</h2>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="flex items-center gap-2 text-xs font-bold text-white/60">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                Aadhar Verified
                            </div>
                        </div>
                    </div>
                </div>

                {/* Identity Form */}
                <div className="portal-card p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input defaultValue="John Doe" className="pl-10 h-12 bg-slate-50 border-none rounded-xl font-bold" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input defaultValue="john.doe@government.in" className="pl-10 h-12 bg-slate-50 border-none rounded-xl font-bold" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400">Mobile Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input defaultValue="+91 98765 43210" className="pl-10 h-12 bg-slate-50 border-none rounded-xl font-bold" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400">Date of Birth</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input defaultValue="1990-05-15" type="date" className="pl-10 h-12 bg-slate-50 border-none rounded-xl font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t space-y-2">
                        <Label className="text-[10px] font-black text-slate-400">Address Override</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-4 w-4 h-4 text-slate-400" />
                            <textarea
                                className="w-full pl-10 pt-3 h-24 bg-slate-50 border-none rounded-xl font-bold text-sm resize-none focus:ring-0 focus-visible:outline-none"
                                defaultValue="Sector 42, Knowledge Park, New Delhi, India 110001"
                            />
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end">
                        <Button className="h-14 px-10 text-[12px] font-black tracking-[0.2em] shadow-xl shadow-primary/20 rounded-2xl group transition-all hover:scale-105 active:scale-95">
                            <Save className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                            Archive Changes
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
