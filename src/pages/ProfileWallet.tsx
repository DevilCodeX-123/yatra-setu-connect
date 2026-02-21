import { useEffect, useState } from "react";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, History, CreditCard, Landmark, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function ProfileWallet() {
    const [profile, setProfile] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileData, txData] = await Promise.all([
                    api.getProfile(),
                    api.getTransactions()
                ]);
                setProfile(profileData);
                setTransactions(txData);
            } catch (err) {
                console.error("Failed to fetch wallet data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleTopUp = async () => {
        const amount = prompt("Enter amount to top up:");
        if (amount && !isNaN(Number(amount))) {
            try {
                const result = await api.topupWallet(Number(amount), "Added via UPI");
                setProfile(result.user);
                setTransactions([result.transaction, ...transactions]);
                alert("Top up successful!");
            } catch (err) {
                alert("Top up failed.");
            }
        }
    };

    return (
        <DashboardLayout
            title="Yatra Wallet"
            subtitle="Digital citizen payments and travel credits"
            sidebarItems={[]}
        >
            <div className="max-w-4xl space-y-8 animate-slide-up">
                {/* Wallet Balance Card */}
                <div className="portal-card p-10 bg-primary text-white relative overflow-hidden rounded-[40px] shadow-2xl shadow-primary/30">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 blur-[100px] -mr-40 -mt-40 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 blur-[80px] -ml-32 -mb-32 rounded-full" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                                <Wallet className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black tracking-[0.4em] text-white/60">Current Credit</p>
                                <p className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Secure Balance
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end gap-6 md:justify-between">
                            <div>
                                <h2 className="text-6xl font-black ">
                                    ₹ {loading ? "..." : profile?.walletBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h2>
                                <p className="text-xs font-bold text-white/40 mt-2 ">Linked to Account: {profile?.email || "..."}</p>
                            </div>
                            <Button
                                onClick={handleTopUp}
                                className="h-14 px-8 bg-accent text-accent-foreground rounded-2xl text-[12px] font-black tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus className="w-5 h-5 mr-2" /> Top Up Wallet
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="portal-card p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 rounded-2xl text-slate-400 group-hover:text-primary transition-colors">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-primary ">Payment Methods</p>
                                <p className="text-[10px] font-bold text-slate-400 ">UPI, Cards, Net Banking</p>
                            </div>
                        </div>
                        <Landmark className="w-5 h-5 text-slate-200 group-hover:text-slate-400 transition-colors" />
                    </div>

                    <div className="portal-card p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 rounded-2xl text-slate-400 group-hover:text-primary transition-colors">
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-primary ">Usage Limits</p>
                                <p className="text-[10px] font-bold text-slate-400 ">Daily Limit: ₹ 5,000</p>
                            </div>
                        </div>
                        <ShieldCheck className="w-5 h-5 text-slate-200 group-hover:text-slate-400 transition-colors" />
                    </div>
                </div>

                {/* Transactions */}
                <div className="space-y-4">
                    <h3 className="text-lg text-premium text-primary">Recent Transactions</h3>
                    <div className="grid gap-3">
                        {loading ? (
                            <div className="text-center py-10 opacity-50">Loading transactions...</div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-10 opacity-50">No transactions yet.</div>
                        ) : transactions.map(t => (
                            <div key={t._id} className="portal-card p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl ${t.type === 'Credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {t.type === 'Credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-[#1E293B] ">{t.source}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                            {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-base font-black ${t.type === 'Credit' ? 'text-emerald-500' : 'text-[#1E293B]'}`}>
                                        {t.type === 'Credit' ? '+' : '-'} ₹ {t.amount}
                                    </p>
                                    <span className="text-[8px] font-black text-slate-400">{t.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
