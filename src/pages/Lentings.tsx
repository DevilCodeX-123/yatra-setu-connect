import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HandCoins } from "lucide-react";

export default function Lentings() {
    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lentings</h1>
                    <p className="text-muted-foreground">Track your shared expenses and lent amounts.</p>
                </div>
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <HandCoins className="w-6 h-6 text-primary" />
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">You have no active lentings.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
