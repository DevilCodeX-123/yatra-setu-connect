import { User, Mail, Phone, Calendar, Shield, MapPin, Save, Camera } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/LanguageContext";

export default function ProfileInfo() {
    const { t } = useTranslation();
    const { user: authUser, updateUser: updateAuthUser } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        age: "",
        gender: "",
        address: { city: "", state: "" }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.getProfile();
                setProfile(data);
                setFormData({
                    name: data.name || "",
                    phone: data.phone || "",
                    age: data.age || "",
                    gender: data.gender || "",
                    address: {
                        city: data.address?.city || "",
                        state: data.address?.state || ""
                    }
                });
            } catch (err) {
                toast.error(t('toasts.profileFetchError'));
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await api.updateProfile(formData);
            setProfile(updated);
            updateAuthUser(updated);
            toast.success(t('toasts.profileUpdateSuccess'));
        } catch (err) {
            toast.error(t('toasts.profileUpdateError'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">{t('common.loading')}</div>;

    const initials = profile?.name?.split(' ').map((n: any) => n[0]).join('').toUpperCase() || 'YS';

    return (
        <DashboardLayout
            title={t('profile.title')}
            subtitle={t('profile.subtitle')}
            sidebarItems={[]}
        >
            <div className="max-w-3xl space-y-8 animate-slide-up">
                {/* Profile Identity */}
                <div className="portal-card p-8 bg-[#1E293B] text-white relative overflow-hidden rounded-[30px] flex flex-col md:flex-row items-center gap-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px] -mr-32 -mt-32 rounded-full" />

                    <div className="relative group shrink-0">
                        <div className="w-32 h-32 rounded-[40px] bg-white text-[#1E293B] flex items-center justify-center text-5xl font-black shadow-2xl border-4 border-white/20">
                            {initials}
                        </div>
                        <button className="absolute bottom-0 right-0 p-2.5 bg-accent text-accent-foreground rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition-all border-4 border-[#1E293B]">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <p className="text-[10px] font-black tracking-[0.4em] text-accent mb-2">{t('profile.identity')}</p>
                        <h2 className="text-4xl font-black mb-4">{profile?.name}</h2>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="flex items-center gap-2 text-xs font-bold text-white/60">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                {profile?.identityVerified ? t('profile.verified') : t('profile.pending')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Identity Form */}
                <div className="portal-card p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400">{t('profile.fullName')}</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="pl-10 h-12 bg-slate-50 border-none rounded-xl font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 opacity-50">
                            <Label className="text-[10px] font-black text-slate-400">{t('profile.email')}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input value={profile?.email} disabled className="pl-10 h-12 bg-slate-50 border-none rounded-xl font-bold" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400">{t('profile.phone')}</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="pl-10 h-12 bg-slate-50 border-none rounded-xl font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400">{t('profile.age')}</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="number"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                                    className="pl-10 h-12 bg-slate-50 border-none rounded-xl font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400">{t('profile.city')}</Label>
                                <Input
                                    value={formData.address.city}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                    className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400">{t('profile.state')}</Label>
                                <Input
                                    value={formData.address.state}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                    className="h-12 bg-slate-50 border-none rounded-xl font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-14 px-10 text-[12px] font-black tracking-[0.2em] shadow-xl shadow-primary/20 rounded-2xl group transition-all hover:scale-105 active:scale-95">
                            <Save className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                            {saving ? t('profile.saving') : t('profile.save')}
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
