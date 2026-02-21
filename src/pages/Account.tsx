import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCircle, Shield, Bell, CreditCard, Save, LogOut } from "lucide-react";

export default function Account() {
    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 py-8">
                <div>
                    <h1 className="text-4xl font-black text-primary">Account Settings</h1>
                    <p className="text-sm font-black text-muted-foreground opacity-60">Manage your profile, security, and preferences.</p>
                </div>

                <div className="grid gap-6">
                    {/* Profile Section */}
                    <Card className="border border-border shadow-card rounded-3xl overflow-hidden bg-card">
                        <CardHeader className="border-b border-border bg-secondary/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <UserCircle className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black ">Public Profile</CardTitle>
                                    <CardDescription className="text-[10px] font-black opacity-60">This information will be visible to bus operators.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground ml-1">Full Name</label>
                                    <Input placeholder="Arjun Sharma" className="h-12 bg-secondary border border-border rounded-xl font-black text-[10px]" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground ml-1">Phone Number</label>
                                    <Input placeholder="+91 98765 43210" className="h-12 bg-secondary border border-border rounded-xl font-black text-[10px]" />
                                </div>
                            </div>
                            <Button className="font-black gap-2 rounded-xl h-12 px-6">
                                <Save className="w-4 h-4" /> Update Profile
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Security */}
                        <Card className="border border-border shadow-card rounded-3xl overflow-hidden bg-card">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                    <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <CardTitle className="text-lg font-black ">Security</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-[10px] font-black text-muted-foreground opacity-60">Two-factor authentication is active for your protection.</p>
                                <Button variant="outline" className="w-full h-12 rounded-xl border border-border bg-secondary font-black text-[10px] hover:bg-muted">Change Password</Button>
                            </CardContent>
                        </Card>

                        {/* Notifications */}
                        <Card className="border border-border shadow-card rounded-3xl overflow-hidden bg-card">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="p-3 bg-primary-light/10 rounded-2xl">
                                    <Bell className="w-6 h-6 text-primary dark:text-blue-400" />
                                </div>
                                <CardTitle className="text-lg font-black ">Notifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-[10px] font-black text-muted-foreground opacity-60">Stay updated with live bus alerts and booking confirmations.</p>
                                <Button variant="outline" className="w-full h-12 rounded-xl border border-border bg-secondary font-black text-[10px] hover:bg-muted">Configure Alerts</Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-8 border-t border-border flex justify-end">
                        <Button variant="ghost" className="text-red-600 dark:text-red-400 font-black gap-2 hover:bg-red-500/10 rounded-xl px-6 h-12">
                            <LogOut className="w-4 h-4" /> Sign Out from All Devices
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
