import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Info, ShieldCheck, Heart } from "lucide-react";

export default function More() {
    const sections = [
        { title: "App Settings", icon: Settings, desc: "Theme, language, and accessibility" },
        { title: "About Us", icon: Info, desc: "Learn more about our mission" },
        { title: "Privacy Policy", icon: ShieldCheck, desc: "How we protect your data" },
        { title: "Support Us", icon: Heart, desc: "Contribute to the smart network" },
    ];

    return (
        <Layout>
            <div className="space-y-6 pb-12 md:pb-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl text-premium text-primary mb-1">More Options</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Additional features and information.</p>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {sections.map((s) => (
                        <Card key={s.title} className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <s.icon className="w-6 h-6 text-primary" />
                                <div>
                                    <CardTitle className="text-lg">{s.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
