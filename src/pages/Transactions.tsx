import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export default function Transactions() {
    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-muted-foreground">View and manage your recent booking history.</p>
                </div>
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <History className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Recent History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground">No recent transactions found.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
