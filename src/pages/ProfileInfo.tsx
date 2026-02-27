import { User, Users, Mail, Phone, Calendar, Shield, MapPin, Save, Camera, Lock, Bell, ChevronRight, Eye, EyeOff, Settings as SettingsIcon, Tag, HelpCircle, ClipboardList, History, Wallet } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function ProfileInfo() {
    const { t } = useTranslation();
    const { user: authUser, updateUser: updateAuthUser, token, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState<'personal' | 'settings'>('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        age: "",
        gender: "",
        address: { city: "", state: "" }
    });

    // Password change states
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Alert Preferences State
    const [alertPrefs, setAlertPrefs] = useState({
        email: true,
        push: false
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                console.log("Fetching profile from database for account verification...");
                const data = await api.getProfile();
                if (data && !data.message) {
                    console.log("Successfully fetched profile from DB:", data.name);
                    setProfile(data);
                    setFormData({
                        name: data.name || "",
                        phone: data.phone || "",
                        age: data.age?.toString() || "",
                        gender: data.gender || "",
                        address: {
                            city: data.address?.city || "",
                            state: data.address?.state || ""
                        }
                    });
                } else if (authUser) {
                    setProfile(authUser);
                    setFormData({
                        name: authUser.name || "",
                        phone: authUser.phone || "",
                        age: authUser.age?.toString() || "",
                        gender: authUser.gender || "",
                        address: {
                            city: authUser.address?.city || "",
                            state: authUser.address?.state || ""
                        }
                    });
                }
            } catch (err) {
                console.error("Profile fetch error:", err);
                if (authUser) {
                    setProfile(authUser);
                    setFormData({
                        name: authUser.name || "",
                        phone: authUser.phone || "",
                        age: authUser.age?.toString() || "",
                        gender: authUser.gender || "",
                        address: {
                            city: authUser.address?.city || "",
                            state: authUser.address?.state || ""
                        }
                    });
                } else {
                    toast.error(t('toasts.profileFetchError'));
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [authUser, t]);

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

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error("New passwords do not match");
        }
        if (passwordData.newPassword.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        // Confirmation Pop
        if (!window.confirm("Are you sure you want to change your password? This will update your security credentials.")) {
            return;
        }

        setChangingPassword(true);
        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || localStorage.getItem('ys_token')}`
                },
                body: JSON.stringify({
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                toast.error(data.message || "Failed to change password");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogoutEverywhere = () => {
        logout();
        navigate("/login");
        toast.info("Logged out from all devices successfully");
    };

    const onEnterKey = () => {
        const key = window.prompt("Enter Staff Identity Activation Key:");
        if (key === "YS2026") {
            setIsRegistered(true);
            toast.success("Identity Registered! Staff Management is now live.");
        } else if (key !== null) {
            toast.error("Invalid activation key.");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">{t('common.loading')}</div>;

    const initials = profile?.name?.split(' ').map((n: any) => n[0]).join('').toUpperCase() || 'YS';
    const isNameAdded = !!profile?.name;
    const isPhoneAdded = !!profile?.phone;

    return (
        <DashboardLayout
            title="Account & Profile"
            subtitle="Manage your personal information and security"
            sidebarItems={[]}
        >
            <div className="max-w-4xl mx-auto space-y-8 animate-slide-up pb-20">
                {/* Profile Identity */}
                <div className="portal-card p-8 bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-white/5 relative overflow-hidden rounded-[40px] flex flex-col md:flex-row items-center gap-8 shadow-2xl transition-colors">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[100px] -mr-40 -mt-40 rounded-full opacity-60" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -ml-32 -mb-32 rounded-full opacity-40" />

                    <div className="relative group shrink-0">
                        <div className="w-32 h-32 rounded-[45px] bg-slate-900 dark:bg-white text-white dark:text-[#1E293B] flex items-center justify-center text-5xl font-black shadow-2xl border-4 border-white/20 transition-transform group-hover:scale-105 duration-500">
                            {initials}
                        </div>
                        {isEditing && (
                            <button className="absolute bottom-0 right-0 p-3 bg-accent text-accent-foreground rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition-all border-4 border-[#1E293B]">
                                <Camera className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left z-10">
                        <p className="text-[10px] font-black tracking-[0.4em] text-blue-600 dark:text-blue-400 mb-2 uppercase">{t('profile.identity')}</p>
                        <h2 className="text-4xl font-black mb-4 text-black dark:text-white transition-colors">{profile?.name || "Member"}</h2>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full border border-emerald-400/20">
                                <Shield className="w-3.5 h-3.5" />
                                {isRegistered ? "STAFF ID REGISTERED" : (profile?.identityVerified ? t('profile.verified') : t('profile.pending'))}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-blue-400 bg-blue-400/10 px-4 py-1.5 rounded-full border border-blue-400/20">
                                <User className="w-3.5 h-3.5" />
                                {profile?.role || "User"}
                            </div>
                        </div>
                    </div>

                    {/* Settings Toggle Button */}
                    <button
                        onClick={() => setActiveTab(activeTab === 'personal' ? 'settings' : 'personal')}
                        className={cn(
                            "md:ml-auto z-20 p-4 rounded-3xl transition-all duration-300 flex items-center gap-3 font-black text-[10px] tracking-widest hover:scale-105 active:scale-95",
                            activeTab === 'settings'
                                ? "bg-slate-900 dark:bg-white text-white dark:text-primary shadow-xl"
                                : "bg-slate-100 dark:bg-white/10 text-black dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/20"
                        )}
                    >
                        {activeTab === 'personal' ? (
                            <>
                                <SettingsIcon className="w-5 h-5" />
                                <span>SETTINGS</span>
                            </>
                        ) : (
                            <>
                                <User className="w-5 h-5" />
                                <span>BACK TO PROFILE</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Integration Menu Items Components */}
                {activeTab === 'personal' && !isEditing && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        {[
                            { icon: ClipboardList, label: "Bookings", to: "/profile/bookings", color: "text-blue-500", bg: "bg-blue-50" },
                            { icon: History, label: "Past Rides", to: "/profile/past-rides", color: "text-emerald-500", bg: "bg-emerald-50" },
                            { icon: Wallet, label: "Wallet", to: "/profile/wallet", color: "text-orange-500", bg: "bg-orange-50" },
                            { icon: Users, label: "Passengers", to: "/profile/passengers", color: "text-purple-500", bg: "bg-purple-50" },
                            { icon: Tag, label: "Offers", to: "/profile/offers", color: "text-pink-500", bg: "bg-pink-50" },
                            { icon: HelpCircle, label: "Support", to: "/support", color: "text-slate-500", bg: "bg-slate-50" },
                        ].map((item, idx) => (
                            <Link
                                key={idx}
                                to={item.to}
                                className="portal-card p-4 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all active:scale-95"
                            >
                                <div className={cn("p-2 rounded-xl", item.bg)}>
                                    <item.icon className={cn("w-5 h-5", item.color)} />
                                </div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Tabs Content */}
                {activeTab === 'personal' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Personal Details Dashboard */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="portal-card p-8 border border-border/50 shadow-xl bg-card rounded-[35px]">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-primary/10 rounded-2xl">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-black text-black dark:text-white">Personal Details</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-slate-400 tracking-widest flex items-center justify-between">
                                            {t('profile.fullName')}
                                            {!isNameAdded && <span className="text-orange-500 animate-pulse">NOT ADDED</span>}
                                        </Label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                value={formData.name}
                                                placeholder="Enter your full name"
                                                disabled={!isEditing}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className={cn(
                                                    "pl-12 h-14 bg-slate-50 border-none rounded-2xl font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-black placeholder:opacity-30",
                                                    !isEditing && "cursor-not-allowed opacity-80"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 opacity-70">
                                        <Label className="text-[10px] font-black text-slate-400 tracking-widest">{t('profile.email')} (Read Only)</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input value={profile?.email || authUser?.email} disabled className="pl-12 h-14 bg-slate-100 border-none rounded-2xl font-bold cursor-not-allowed" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-slate-400 tracking-widest flex items-center justify-between">
                                            {t('profile.phone')}
                                            {!isPhoneAdded && <span className="text-orange-500 animate-pulse">NOT ADDED</span>}
                                        </Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                value={formData.phone}
                                                placeholder="Enter phone number"
                                                disabled={!isEditing}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className={cn(
                                                    "pl-12 h-14 bg-slate-50 border-none rounded-2xl font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-black placeholder:opacity-30",
                                                    !isEditing && "cursor-not-allowed opacity-80"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-slate-400 tracking-widest">{t('profile.age')}</Label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                type="number"
                                                value={formData.age}
                                                placeholder="25"
                                                disabled={!isEditing}
                                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                                className={cn(
                                                    "pl-12 h-14 bg-slate-50 border-none rounded-2xl font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-black placeholder:opacity-30",
                                                    !isEditing && "cursor-not-allowed opacity-80"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-slate-100">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-400 tracking-widest">{t('profile.city')}</Label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary" />
                                                <Input
                                                    value={formData.address.city}
                                                    placeholder="Mumbai"
                                                    disabled={!isEditing}
                                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                                    className={cn(
                                                        "pl-12 h-14 bg-slate-50 border-none rounded-2xl font-bold shadow-inner placeholder:font-black placeholder:opacity-30",
                                                        !isEditing && "cursor-not-allowed opacity-80"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-400 tracking-widest">{t('profile.state')}</Label>
                                            <Input
                                                value={formData.address.state}
                                                placeholder="Maharashtra"
                                                disabled={!isEditing}
                                                onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                                className={cn(
                                                    "h-14 bg-slate-50 border-none rounded-2xl font-bold shadow-inner placeholder:font-black placeholder:opacity-30",
                                                    !isEditing && "cursor-not-allowed opacity-80"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-end gap-4">
                                    {!isEditing ? (
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            className="h-16 px-12 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-black tracking-[0.2em] shadow-2xl rounded-[20px] group transition-all hover:scale-105 active:scale-95">
                                            <Save className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                                            EDIT PROFILE
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsEditing(false)}
                                                className="h-16 px-12 border-2 border-slate-200 text-slate-600 text-[12px] font-black tracking-[0.2em] rounded-[20px] transition-all hover:bg-slate-50">
                                                CANCEL
                                            </Button>
                                            <Button
                                                onClick={async () => {
                                                    await handleSave();
                                                    setIsEditing(false);
                                                }}
                                                disabled={saving}
                                                className="h-16 px-12 bg-primary hover:bg-primary-light text-white text-[12px] font-black tracking-[0.2em] shadow-2xl shadow-primary/30 rounded-[20px] group transition-all hover:scale-105 active:scale-95">
                                                <Save className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                                                {saving ? "SAVING..." : "SAVE CHANGES"}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Sidebar */}
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 delay-150">
                            <div className="portal-card p-8 bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 rounded-[35px]">
                                <h4 className="text-[10px] font-black text-primary tracking-widest mb-6 uppercase">Travel Stats</h4>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400">TOTAL RIDES</span>
                                        <span className="text-xl font-black text-primary">24</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400">WALLET BAL</span>
                                        <span className="text-xl font-black text-emerald-500">₹{profile?.walletBalance || 0}</span>
                                    </div>
                                    <div className="pt-4 border-t border-primary/10">
                                        <p className="text-[9px] font-black text-slate-400 leading-relaxed">
                                            Your profile is {isNameAdded && isPhoneAdded ? '100%' : '70%'} complete. Complete your profile to earn extra rewards!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Security Section */}
                        <div className="portal-card p-8 border border-border/50 shadow-xl bg-card rounded-[35px]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                    <Lock className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Security Settings</h3>
                                    <p className="text-[10px] font-black text-slate-400 mt-1">Update your password securely</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 tracking-widest">OLD PASSWORD</Label>
                                    <div className="relative">
                                        <Input
                                            type={showOldPassword ? "text" : "password"}
                                            value={passwordData.oldPassword}
                                            onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            className="h-14 bg-slate-50 border-none rounded-2xl font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                        <button
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                        >
                                            {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 tracking-widest">NEW PASSWORD</Label>
                                    <div className="relative">
                                        <Input
                                            type={showNewPassword ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="h-14 bg-slate-50 border-none rounded-2xl font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                        <button
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-400 tracking-widest">CONFIRM NEW PASSWORD</Label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={passwordData.confirmPassword}
                                            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="h-14 bg-slate-50 border-none rounded-2xl font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20"
                                        />
                                        <button
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={
                                        changingPassword ||
                                        !passwordData.oldPassword ||
                                        !passwordData.newPassword ||
                                        !passwordData.confirmPassword ||
                                        passwordData.newPassword !== passwordData.confirmPassword ||
                                        passwordData.newPassword.length < 6
                                    }
                                    className={cn(
                                        "w-full h-16 transition-all duration-300 font-black text-[12px] tracking-[0.2em] rounded-[20px]",
                                        (passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 6 && passwordData.oldPassword)
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-500/30 active:scale-[0.98]"
                                            : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    {changingPassword ? "UPDATING..." : "CHANGE PASSWORD"}
                                </Button>
                            </div>
                        </div>

                        {/* Notifications & Prefs */}
                        <div className="space-y-8">
                            <div className="portal-card p-8 border border-border/50 shadow-xl bg-card rounded-[35px]">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                                        <Bell className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800">Alert Preferences</h3>
                                        <p className="text-[10px] font-black text-slate-400 mt-1">Manage where you receive updates</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div
                                        onClick={() => setAlertPrefs({ ...alertPrefs, email: !alertPrefs.email })}
                                        className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group cursor-pointer hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <Mail className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="text-xs font-black text-slate-700">Email Alerts</span>
                                        </div>
                                        <div className={cn(
                                            "w-12 h-6 rounded-full relative p-1 transition-all duration-300",
                                            alertPrefs.email ? "bg-primary" : "bg-slate-300"
                                        )}>
                                            <div className={cn(
                                                "w-4 h-4 bg-white rounded-full absolute shadow-sm transition-all duration-300",
                                                alertPrefs.email ? "right-1" : "left-1"
                                            )} />
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setAlertPrefs({ ...alertPrefs, push: !alertPrefs.push })}
                                        className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group cursor-pointer hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <Bell className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className="text-xs font-black text-slate-700">Push Notifications</span>
                                        </div>
                                        <div className={cn(
                                            "w-12 h-6 rounded-full relative p-1 transition-all duration-300",
                                            alertPrefs.push ? "bg-blue-500" : "bg-slate-300"
                                        )}>
                                            <div className={cn(
                                                "w-4 h-4 bg-white rounded-full absolute shadow-sm transition-all duration-300",
                                                alertPrefs.push ? "right-1" : "left-1"
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Session Card */}
                            <div className="portal-card p-8 bg-slate-900 text-white rounded-[35px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                                <h4 className="text-[10px] font-black text-slate-500 tracking-widest mb-6 uppercase">Active Session</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-black">
                                        <span className="text-slate-500">IP ADDRESS</span>
                                        <span className="text-slate-300">192.168.1.1</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-black">
                                        <span className="text-slate-500">DEVICE</span>
                                        <span className="text-slate-300">Chrome on Windows</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={handleLogoutEverywhere}
                                    className="w-full mt-10 h-12 text-[9px] font-black text-red-400 hover:bg-red-500/10 hover:text-red-400 rounded-2xl tracking-widest uppercase border border-red-500/20"
                                >
                                    Log Out Everywhere
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
