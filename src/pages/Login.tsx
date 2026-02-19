import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Mail, User, Calendar, PersonStanding, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        age: "",
        gender: "male",
        isPhysicallyAbled: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting form...", { isLogin, email: formData.email });

        if (isLoading) return;

        if (!isLogin && formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        const endpoint = isLogin ? '/api/users/login' : '/api/users/signup';

        // Prepare payload, converting types where necessary
        const payload = isLogin
            ? { email: formData.email, password: formData.password }
            : {
                ...formData,
                age: formData.age ? parseInt(formData.age) : undefined
            };

        try {
            console.log("Sending request to:", endpoint);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            console.log("Response status:", response.status);
            const data = await response.json();
            console.log("Response data:", data);

            if (response.ok) {
                toast.success(isLogin ? "Login Successful!" : "Account Created Successfully!");
                localStorage.setItem('user', JSON.stringify(data));
                navigate("/profile");
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary/90 to-slate-900 flex">
            {/* Left branding panel — desktop only */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
                <div className="relative text-center text-white space-y-6">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border border-white/20 shadow-2xl">
                        <Bus className="w-12 h-12 text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white mb-3">Yatra Setu</h1>
                        <p className="text-white/60 font-medium text-lg">India's Smart Public Bus Network</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-6">
                        {[["500+", "Routes"], ["2M+", "Passengers"], ["100%", "Tracked"]].map(([v, l]) => (
                            <div key={l} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <p className="text-2xl font-black text-white">{v}</p>
                                <p className="text-xs text-white/50 uppercase tracking-widest font-bold">{l}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-8 bg-white/5 backdrop-blur-sm lg:bg-white">
                <div className="w-full max-w-md space-y-0">
                    <Card className="w-full shadow-2xl border-none animate-in fade-in zoom-in duration-300 overflow-hidden">
                        <CardHeader className="space-y-1 text-center bg-primary text-primary-foreground pb-8 lg:hidden">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                                    <Bus className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Yatra Setu</CardTitle>
                            <CardDescription className="text-white/70 font-medium">{isLogin ? "Sign in to your account" : "Join the Smart Public Bus Network"}</CardDescription>
                        </CardHeader>
                        <div className="hidden lg:block px-8 pt-8 pb-2">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary">{isLogin ? "Welcome Back" : "Create Account"}</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">{isLogin ? "Sign in to your Yatra Setu account" : "Register for Yatra Setu services"}</p>
                        </div>
                        <CardContent className="space-y-6 pt-8 px-6 sm:px-8">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        className="h-12 rounded-xl bg-slate-100 border-none focus-visible:ring-primary/20"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                {!isLogin && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <User className="w-3 h-3" /> Full Name
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="John Doe"
                                                required
                                                className="h-12 rounded-xl bg-slate-100 border-none focus-visible:ring-primary/20"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="age" className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" /> Age
                                                </Label>
                                                <Input
                                                    id="age"
                                                    type="number"
                                                    placeholder="25"
                                                    required
                                                    className="h-12 rounded-xl bg-slate-100 border-none focus-visible:ring-primary/20"
                                                    value={formData.age}
                                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Gender</Label>
                                                <RadioGroup
                                                    value={formData.gender}
                                                    onValueChange={(val) => setFormData({ ...formData, gender: val })}
                                                    className="flex h-12 items-center gap-3 px-2"
                                                >
                                                    {[["male", "M"], ["female", "F"], ["other", "O"]].map(([v, l]) => (
                                                        <div key={v} className="flex items-center space-x-1.5">
                                                            <RadioGroupItem value={v} id={v} className="border-primary text-primary" />
                                                            <Label htmlFor={v} className="text-xs font-bold uppercase tracking-tighter cursor-pointer">{l}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Lock className="w-3 h-3" /> Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            className="h-12 rounded-xl bg-slate-100 border-none focus-visible:ring-primary/20 pr-10"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <Lock className="w-3 h-3" /> Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                required
                                                className="h-12 rounded-xl bg-slate-100 border-none focus-visible:ring-primary/20 pr-10"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!isLogin && (
                                    <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <Checkbox
                                            id="abled"
                                            checked={formData.isPhysicallyAbled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isPhysicallyAbled: !!checked })}
                                            className="data-[state=checked]:bg-primary rounded-md w-5 h-5 flex items-center justify-center"
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="abled" className="text-xs font-black uppercase tracking-tight leading-none cursor-pointer flex items-center gap-2">
                                                <PersonStanding className="w-3 h-3" /> Physically Abled / Disabled
                                            </Label>
                                            <p className="text-[9px] text-muted-foreground font-medium italic">Assistive services will be highlighted.</p>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full h-14 rounded-2xl text-lg font-black uppercase italic tracking-tighter shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${isLogin
                                        ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                                        : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                                        }`}
                                >
                                    {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
                                </Button>
                            </form>

                            <div className="text-center mt-4">
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-sm font-bold text-primary hover:underline transition-all"
                                >
                                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                                </button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-center pb-8 pt-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Secure Auth Powered by Yatra Setu Link
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
