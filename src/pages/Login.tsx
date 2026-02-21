import API_BASE_URL from '@/lib/api';
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Mail, User, Calendar, PersonStanding, Lock, Eye, EyeOff, Building2, Briefcase, UserCheck, Check, ArrowRight, ShieldCheck, Radio, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import SplashLoader from "@/components/brand/SplashLoader";
import Logo from "@/components/brand/Logo";
import LogoIcon from "@/components/brand/LogoIcon";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function Login() {
    const navigate = useNavigate();
    const auth = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [mainRole, setMainRole] = useState("Passenger");
    const [orgRole, setOrgRole] = useState("Owner");

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        age: "",
        gender: "male",
        isPhysicallyAbled: false,
    });

    const triggerSignup = async (finalRole: string) => {
        setIsLoading(true);
        const endpoint = `${API_BASE_URL}/users/signup`;
        const payload = {
            ...formData,
            role: finalRole,
            age: formData.age ? parseInt(formData.age) : undefined
        };

        try {
            console.log("Sending signup request with role:", finalRole);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Account Created Successfully!");
                if (data.token) {
                    auth.login(data.token, data.user || data);
                }
                redirectUserByRole(finalRole);
            } else {
                toast.error(data.message || "Failed to sign up");
            }
        } catch (error) {
            console.error("Auth error:", error);
            toast.error("Connection failed. Please check if backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    const redirectUserByRole = (role: string) => {
        if (role === 'Passenger') {
            navigate("/profile");
        } else if (role === 'Owner' || role === 'Owner+Employee' || role === 'Admin') {
            navigate("/owner");
        } else if (role === 'Employee') {
            navigate("/employee");
        } else {
            navigate("/profile");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLoading) return;

        if (isLogin) {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/users/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email, password: formData.password }),
                });
                const data = await response.json();
                if (response.ok) {
                    toast.success("Login Successful!");
                    if (data.token) {
                        auth.login(data.token, data.user || data);
                    }
                    redirectUserByRole((data.user || data).role || 'Passenger');
                } else {
                    toast.error(data.message || "Invalid credentials");
                }
            } catch (err) {
                toast.error("Failed to connect to server");
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (mainRole === 'Organization') {
            setShowOrgModal(true);
        } else {
            await triggerSignup('Passenger');
        }
    };

    return (
        <div className="min-h-screen bg-background flex relative">
            <SplashLoader />

            {/* Left branding panel */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col items-center justify-center p-12 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 70%, #3B82F6 100%)" }}>
                {/* Decorative Grid Pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.15%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')"
                }} />

                <div className="relative text-center text-white space-y-10 z-10">
                    <div className="relative flex flex-col items-center">
                        <div className="w-32 h-32 bg-white/10 rounded-[40px] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl relative group translate-y-[-20px]">
                            <LogoIcon size={80} className="group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute -top-3 -right-6 bg-blue-400 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg border border-white/20 tracking-widest animate-pulse">SMART</div>
                        </div>
                        <Logo variant="white" className="h-20" />
                    </div>
                    <div className="grid grid-cols-3 gap-6 pt-8">
                        {[["500+", "Routes"], ["2M+", "Passengers"], ["100%", "Tracked"]].map(([v, l]) => (
                            <div key={l} className="bg-white/8 backdrop-blur-md rounded-2xl p-5 border border-white/12 group hover:bg-white/15 transition-colors">
                                <p className="text-3xl font-bold text-white leading-none group-hover:scale-105 transition-transform">{v}</p>
                                <p className="text-[10px] text-blue-200/50 font-semibold mt-2">{l}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-12 bg-background">
                <div className="w-full max-w-md space-y-0 relative">
                    <Card className="w-full shadow-elevated border border-border animate-in fade-in zoom-in duration-500 overflow-hidden rounded-[32px] bg-card">
                        <CardHeader className="space-y-2 text-center bg-primary text-primary-foreground py-10 lg:hidden relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{
                                backgroundImage: "url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.4%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')"
                            }} />
                            <div className="flex justify-center mb-4 relative">
                                <LogoIcon size={64} className="shadow-2xl border-4 border-white/10 rounded-2xl" />
                            </div>
                            <CardTitle className="text-3xl font-bold relative">Yatra Setu</CardTitle>
                            <CardDescription className="text-white/70 font-medium text-[10px] relative uppercase tracking-[0.2em]">{isLogin ? "IDENTITY VERIFICATION" : "NEW REGISTRATION"}</CardDescription>
                        </CardHeader>

                        <div className="hidden lg:block px-10 pt-10 pb-2">
                            <Badge variant="outline" className="mb-4 text-[10px] font-black tracking-[0.2em] border-primary/20 bg-primary/5 text-primary rounded-lg px-3 py-1">
                                {isLogin ? "IDENTITY VERIFICATION" : "NEW REGISTRATION"}
                            </Badge>
                            <h2 className="text-4xl font-black text-primary">{isLogin ? "Welcome Back" : "Create Account"}</h2>
                            <p className="text-[10px] font-black text-muted-foreground opacity-60 mt-2">{isLogin ? "Sign in to your Yatra Setu account" : "Register for official portal services"}</p>
                        </div>

                        <CardContent className="space-y-6 pt-8 px-8 sm:px-10">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[10px] font-black text-muted-foreground ml-1 opacity-60 flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@yatrasetu.in"
                                        required
                                        className="h-14 rounded-2xl bg-secondary border border-border focus-visible:ring-primary/20 font-black text-[10px] shadow-sm transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                {!isLogin && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-[10px] font-black text-muted-foreground ml-1 opacity-60 flex items-center gap-2">
                                                <User className="w-3 h-3" /> Full Name
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="Arjun Sharma"
                                                required
                                                className="h-14 rounded-2xl bg-secondary border border-border focus-visible:ring-primary/20 font-black text-[10px] shadow-sm transition-all"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="age" className="text-[10px] font-black text-muted-foreground ml-1 opacity-60 flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" /> Age
                                                </Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    placeholder="25"
                                                    required
                                                    className="h-14 rounded-2xl bg-secondary border border-border focus-visible:ring-primary/20 font-black text-[10px] shadow-sm transition-all"
                                                    value={formData.age}
                                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-muted-foreground ml-1 opacity-60">Gender</Label>
                                                <RadioGroup
                                                    value={formData.gender}
                                                    onValueChange={(val) => setFormData({ ...formData, gender: val })}
                                                    className="flex h-14 items-center justify-around px-4 bg-secondary rounded-2xl border border-border"
                                                >
                                                    {[["male", "M"], ["female", "F"], ["other", "O"]].map(([v, l]) => (
                                                        <div key={v} className="flex items-center space-x-1.5 group">
                                                            <RadioGroupItem value={v} id={v} className="border-primary text-primary" />
                                                            <Label htmlFor={v} className="text-[10px] font-black cursor-pointer group-hover:text-primary transition-colors">{l}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-muted-foreground ml-1 opacity-60 flex items-center gap-2">
                                                <Building2 className="w-3 h-3" /> Professional Role
                                            </Label>
                                            <Select value={mainRole} onValueChange={setMainRole}>
                                                <SelectTrigger className="h-14 rounded-2xl bg-secondary border border-border focus:ring-primary/20 font-black text-[10px] shadow-sm">
                                                    <SelectValue placeholder="Choose your role" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border border-border rounded-xl">
                                                    <SelectItem value="Passenger" className="text-[10px] font-black py-3">Passenger</SelectItem>
                                                    <SelectItem value="Organization" className="text-[10px] font-black py-3 text-primary">Bus Organization</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2 relative">
                                    <div className="flex justify-between items-center px-1">
                                        <Label htmlFor="password" className="text-[10px] font-black text-muted-foreground opacity-60 flex items-center gap-2">
                                            <Lock className="w-3 h-3" /> Password
                                        </Label>
                                        {isLogin && <button type="button" className="text-[8px] font-black text-primary hover:underline">Forgot?</button>}
                                    </div>
                                    <div className="relative group">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            className="h-14 rounded-2xl bg-secondary border border-border focus-visible:ring-primary/20 font-black text-[10px] shadow-sm transition-all pr-12"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors opacity-30 hover:opacity-100"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-[10px] font-black text-muted-foreground ml-1 opacity-60 flex items-center gap-2">
                                            <Lock className="w-3 h-3" /> Confirm Password
                                        </Label>
                                        <div className="relative group">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                required
                                                className="h-14 rounded-2xl bg-secondary border border-border focus-visible:ring-primary/20 font-black text-[10px] shadow-sm transition-all pr-12"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors opacity-30 hover:opacity-100"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!isLogin && (
                                    <div className="flex items-center space-x-4 p-5 bg-secondary/50 rounded-2xl border border-border group hover:bg-secondary transition-colors">
                                        <Checkbox
                                            id="abled"
                                            checked={formData.isPhysicallyAbled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isPhysicallyAbled: !!checked })}
                                            className="data-[state=checked]:bg-primary rounded-lg w-6 h-6 border-2 border-border"
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="abled" className="text-[10px] font-black tracking-wide leading-none cursor-pointer flex items-center gap-2">
                                                <PersonStanding className="w-3.5 h-3.5" /> Physically Abled / Disabled
                                            </Label>
                                            <p className="text-[8px] text-muted-foreground font-black opacity-40">Priority seating & assistance will be active.</p>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-16 rounded-[20px] text-xl font-black shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary hover:bg-primary-light text-white shadow-primary/20 mt-4 group"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span>{isLogin ? "Sign Into Portal" : "Join Smart Network"}</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                            </form>

                            <div className="text-center mt-6">
                                <button
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        toast.info(isLogin ? "Switching to Registration" : "Switching to Portal Entry");
                                    }}
                                    className="text-xs font-medium text-primary hover:text-primary-light transition-colors"
                                >
                                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                                </button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-center pb-8 pt-2">
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex gap-4 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    <Radio className="w-5 h-5 text-primary" />
                                    <Lock className="w-5 h-5 text-primary-light" />
                                </div>
                                <p className="text-[8px] font-black text-muted-foreground tracking-[0.3em] opacity-40">
                                    Official National Transport Gateway
                                </p>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {/* Organization Sub-role Dialog */}
            <Dialog open={showOrgModal} onOpenChange={setShowOrgModal}>
                <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-8">
                    <DialogHeader className="space-y-3 pb-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                            <Building2 className="w-8 h-8 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-center ">Organization Details</DialogTitle>
                        <DialogDescription className="text-center font-medium">
                            Please specify your professional role within the bus organization to access your dedicated panel.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <RadioGroup value={orgRole} onValueChange={setOrgRole} className="grid grid-cols-1 gap-4">
                            {[
                                { id: "Owner", label: "Bus Owner", desc: "Manage fleet, staff, and financial reports.", icon: <UserCheck className="w-4 h-4" /> },
                                { id: "Employee", label: "Bus Employee", desc: "Access routes, schedules, and attendance.", icon: <Briefcase className="w-4 h-4" /> },
                                { id: "Owner+Employee", label: "Owner + Employee", desc: "Complete access to all fleet and staff tools.", icon: <Bus className="w-4 h-4" /> }
                            ].map((item) => (
                                <div key={item.id} className="relative group">
                                    <RadioGroupItem value={item.id} id={item.id} className="peer sr-only" />
                                    <Label
                                        htmlFor={item.id}
                                        className="flex flex-col p-4 bg-slate-50 rounded-2xl border-2 border-transparent cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-white group-hover:bg-slate-100"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-black flex items-center gap-2">
                                                {item.icon} {item.label}
                                            </span>
                                            <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center bg-transparent ${orgRole === item.id ? "border-primary" : "border-slate-300"}`}>
                                                <Check className={`w-3 h-3 text-primary transition-all ${orgRole === item.id ? "opacity-100 scale-100" : "opacity-0 scale-50"}`} />
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-slate-500 font-medium leading-tight">{item.desc}</span>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            className="w-full h-14 rounded-2xl text-lg font-black bg-primary shadow-lg shadow-primary/20"
                            onClick={async () => {
                                setShowOrgModal(false);
                                await triggerSignup(orgRole);
                            }}
                        >
                            Confirm & Join
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
