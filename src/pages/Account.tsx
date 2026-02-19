import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Shield, Bell, CreditCard } from "lucide-react";

export default function Account() {
    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                    <p className="text-muted-foreground">Manage your account preferences and security.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <UserCircle className="w-6 h-6 text-primary" />
                            <CardTitle>Security</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Update your password and enable 2FA.</p>
                            <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Bell className="w-6 h-6 text-primary" />
                            <CardTitle>Notifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Manage your alert preferences.</p>
                            <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
