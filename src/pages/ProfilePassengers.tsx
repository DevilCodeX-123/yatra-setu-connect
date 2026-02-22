import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Edit2, ShieldCheck, Phone, Mail, User, BookOpen, AlertCircle, HeartPulse } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ProfilePassengers() {
    const [passengers, setPassengers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        gender: "Male",
        relation: "Friend",
        phone: "",
        email: "",
        identityType: "Aadhar",
        identityNumber: "",
        emergencyContact: ""
    });

    const fetchPassengers = async () => {
        try {
            const profile = await api.getProfile();
            setPassengers(profile.savedPassengers || []);
        } catch (err) {
            toast.error("Failed to load passengers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPassengers();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.age || !formData.phone) {
            return toast.error("Please fill required fields");
        }
        try {
            await api.addPassenger({
                ...formData,
                age: Number(formData.age)
            });
            toast.success("Passenger added successfully");
            setShowAddDialog(false);
            setFormData({
                name: "",
                age: "",
                gender: "Male",
                relation: "Friend",
                phone: "",
                email: "",
                identityType: "Aadhar",
                identityNumber: "",
                emergencyContact: ""
            });
            fetchPassengers();
        } catch (err) {
            toast.error("Failed to add passenger");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this passenger?")) return;
        try {
            await api.deletePassenger(id);
            toast.success("Passenger removed");
            fetchPassengers();
        } catch (err) {
            toast.error("Failed to remove passenger");
        }
    };

    return (
        <DashboardLayout
            title="Saved Passengers"
            subtitle="Manage your co-passengers for faster booking"
            sidebarItems={[]}
        >
            <div className="max-w-4xl space-y-6 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-primary uppercase tracking-wider">Your Passenger List</h3>

                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                        <DialogTrigger asChild>
                            <Button className="rounded-xl h-10 text-[10px] font-black bg-primary text-white shadow-lg shadow-primary/20">
                                <UserPlus className="w-4 h-4 mr-2" /> Add New Passenger
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[32px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black text-primary">Add Passenger Info</DialogTitle>
                                <DialogDescription className="text-[10px] font-black text-muted-foreground opacity-50 uppercase tracking-widest">
                                    Fill in complete details for faster booking
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAdd} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase opacity-60">Full Name *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Anita Doe"
                                            className="bg-secondary/50 border-border rounded-xl h-11 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase opacity-60">Phone Number *</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="9988776655"
                                            className="bg-secondary/50 border-border rounded-xl h-11 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase opacity-60">Age *</Label>
                                        <Input
                                            type="number"
                                            value={formData.age}
                                            onChange={e => setFormData({ ...formData, age: e.target.value })}
                                            placeholder="25"
                                            className="bg-secondary/50 border-border rounded-xl h-11 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase opacity-60">Gender</Label>
                                        <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                                            <SelectTrigger className="bg-secondary/50 border-border rounded-xl h-11 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase opacity-60">Relation</Label>
                                        <Input
                                            value={formData.relation}
                                            onChange={e => setFormData({ ...formData, relation: e.target.value })}
                                            placeholder="Spouse"
                                            className="bg-secondary/50 border-border rounded-xl h-11 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase opacity-60">Identity ID Type</Label>
                                        <Select value={formData.identityType} onValueChange={v => setFormData({ ...formData, identityType: v })}>
                                            <SelectTrigger className="bg-secondary/50 border-border rounded-xl h-11 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Aadhar">Aadhar Card</SelectItem>
                                                <SelectItem value="PAN">PAN Card</SelectItem>
                                                <SelectItem value="Voter ID">Voter ID</SelectItem>
                                                <SelectItem value="Driving License">Driving License</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase opacity-60">ID Number</Label>
                                        <Input
                                            value={formData.identityNumber}
                                            onChange={e => setFormData({ ...formData, identityNumber: e.target.value })}
                                            placeholder="XXXX-XXXX-XXXX"
                                            className="bg-secondary/50 border-border rounded-xl h-11 text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase opacity-60">Emergency Contact (Optional)</Label>
                                    <Input
                                        value={formData.emergencyContact}
                                        onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                                        placeholder="Name / Number"
                                        className="bg-secondary/50 border-border rounded-xl h-11 text-xs"
                                    />
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="submit" className="w-full h-12 rounded-2xl font-black bg-primary shadow-xl shadow-primary/20">
                                        Save Passenger Information
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : passengers.length === 0 ? (
                        <div className="portal-card py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <Users className="w-8 h-8" />
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase">No saved passengers found</p>
                        </div>
                    ) : (
                        passengers.map((p) => (
                            <div key={p._id} className="portal-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[24px] bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all border border-slate-200/50">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-primary ">{p.name}</h4>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                {p.gender} • {p.age} Yrs • {p.relation}
                                            </p>
                                            <p className="flex items-center gap-1.5 text-[10px] font-black text-primary tracking-tighter">
                                                <Phone className="w-3 h-3 text-primary/40" /> {p.phone}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-[9px] font-black text-emerald-600 uppercase">{p.identityType}: {p.identityNumber || 'Un-linked'}</span>
                                            </div>
                                            {p.emergencyContact && (
                                                <div className="flex items-center gap-1.5">
                                                    <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                                                    <span className="text-[9px] font-black text-red-500 uppercase">Emergency: {p.emergencyContact}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2">
                                    <Badge variant={p.status === 'Verified' ? 'default' : 'secondary'} className={`rounded-full px-3 text-[8px] font-black tracking-widest ${p.status === 'Verified' ? 'bg-emerald-500 uppercase' : 'uppercase'}`}>
                                        {p.status || 'Verified'}
                                    </Badge>

                                    <div className="flex gap-2">
                                        <Button onClick={() => handleDelete(p._id)} variant="outline" size="icon" className="w-10 h-10 rounded-xl border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Secure Note */}
                <div className="p-8 bg-[#1E293B] text-white rounded-[40px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                    <div className="flex gap-6 items-start relative z-10">
                        <div className="p-4 bg-white/10 rounded-2xl text-emerald-400 backdrop-blur-md border border-white/10">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h5 className="text-sm font-black text-white mb-2 tracking-wide uppercase">Safe & Encrypted Storage</h5>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-bold max-w-lg">
                                Your passenger data is encrypted and stored securely according to Yatra Setu Safety Protocols. This information is only used to pre-fill booking forms for your convenience and to comply with government travel mandates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
