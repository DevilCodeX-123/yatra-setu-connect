import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Mail, User, Calendar, PersonStanding } from "lucide-react";
import Navbar from "@/components/Navbar";

import { toast } from "sonner";

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        age: "",
        gender: "male",
        isPhysicallyAbled: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Login submitted:", formData);
        // Simulate login
        toast.success("Login Successful!");
        navigate("/profile");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar minimal />
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-2xl border-none animate-in fade-in zoom-in duration-300">
                    <CardHeader className="space-y-1 text-center bg-primary text-primary-foreground rounded-t-xl pb-8">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                                <Bus className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Yatra Setu</CardTitle>
                        <CardDescription className="text-white/70 font-medium">Join the Smart Public Bus Network</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-8">
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
                                        className="flex h-12 items-center gap-4 px-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="male" id="male" className="border-primary text-primary" />
                                            <Label htmlFor="male" className="text-xs font-bold uppercase tracking-tighter cursor-pointer">M</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="female" id="female" className="border-primary text-primary" />
                                            <Label htmlFor="female" className="text-xs font-bold uppercase tracking-tighter cursor-pointer">F</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="other" id="other" className="border-primary text-primary" />
                                            <Label htmlFor="other" className="text-xs font-bold uppercase tracking-tighter cursor-pointer">O</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <Checkbox
                                    id="abled"
                                    checked={formData.isPhysicallyAbled}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isPhysicallyAbled: !!checked })}
                                    className="data-[state=checked]:bg-primary rounded-md w-5 h-5 flex items-center justify-center"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label
                                        htmlFor="abled"
                                        className="text-xs font-black uppercase tracking-tight leading-none cursor-pointer flex items-center gap-2"
                                    >
                                        <PersonStanding className="w-3 h-3" /> Physically Abled / Disabled
                                    </Label>
                                    <p className="text-[9px] text-muted-foreground font-medium italic">Assistive services will be highlighted.</p>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-lg font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                Get Started
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-8 pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Secure Auth Powered by Yatra Setu Link
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
