import { Users, UserPlus, Trash2, Edit2, ShieldCheck, Phone, Mail } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const passengers = [
    { id: 1, name: "Anita Doe", age: 32, gender: "Female", relation: "Spouse", status: "Verified" },
    { id: 2, name: "Junior Doe", age: 8, gender: "Male", relation: "Child", status: "Verified" },
    { id: 3, name: "Robert Smith", age: 65, gender: "Male", relation: "Friend", status: "Pending" }
];

export default function ProfilePassengers() {
    return (
        <DashboardLayout
            title="Saved Passengers"
            subtitle="Manage your co-passengers for faster booking"
            sidebarItems={[]}
        >
            <div className="max-w-4xl space-y-6 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg text-premium text-primary">Your Passenger List</h3>
                    <Button className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest italic bg-accent text-accent-foreground shadow-lg shadow-accent/20">
                        <UserPlus className="w-4 h-4 mr-2" /> Add New
                    </Button>
                </div>

                <div className="grid gap-4">
                    {passengers.map((p) => (
                        <div key={p.id} className="portal-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-black italic text-primary uppercase tracking-tighter">{p.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        {p.gender} • {p.age} Yrs • {p.relation}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <Badge variant={p.status === 'Verified' ? 'default' : 'secondary'} className={`rounded-full px-3 text-[8px] font-black uppercase tracking-tighter ${p.status === 'Verified' ? 'bg-emerald-500' : ''}`}>
                                        {p.status}
                                    </Badge>
                                    {p.status === 'Verified' && (
                                        <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 mt-1 uppercase">
                                            <ShieldCheck className="w-3 h-3" /> Identity Confirmed
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl border-slate-200 hover:text-primary">
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl border-slate-200 hover:text-danger hover:bg-danger/5 hover:border-danger/30">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Note */}
                <div className="portal-card p-6 bg-slate-50 border-none rounded-3xl flex gap-4 items-start">
                    <div className="p-2 bg-white rounded-xl text-primary shadow-sm shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Government Mandate</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            As per government regulations, any passenger listed here must have a valid identity card for travel verification. Verified passengers benefit from 1-click insurance coverage on all trips.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
