import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { HelpCircle, MessageSquareWarning, Lightbulb, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";

const traveledBuses = [
    { id: "KA-01-F-1234", lastTravel: "2026-02-15" },
    { id: "KA-01-F-5678", lastTravel: "2026-02-10" },
    { id: "KA-05-AB-9876", lastTravel: "2026-01-28" },
];

export default function Support() {
    const [selectedBus, setSelectedBus] = useState("");
    const [travelDate, setTravelDate] = useState("");
    const [category, setCategory] = useState("");
    const [staffRole, setStaffRole] = useState("driver");

    useEffect(() => {
        if (selectedBus) {
            const bus = traveledBuses.find(b => b.id === selectedBus);
            if (bus) setTravelDate(bus.lastTravel);
        } else {
            setTravelDate("");
        }
    }, [selectedBus]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Thank you for your feedback! Our team will review it.");
    };

    return (
        <Layout>
            <div className="space-y-8 max-w-5xl mx-auto pb-12">
                <header className="space-y-1">
                    <h1 className="text-3xl text-premium text-primary mb-1">Support & Feedback</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Get help with your travels, report issues, or suggest improvements to the smart network.
                    </p>
                </header>

                <Tabs defaultValue="faq" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="faq" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-6 py-3">
                            <HelpCircle className="w-4 h-4" /> FAQ
                        </TabsTrigger>
                        <TabsTrigger value="complaints" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-6 py-3">
                            <MessageSquareWarning className="w-4 h-4" /> Complaints
                        </TabsTrigger>
                        <TabsTrigger value="suggestions" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-6 py-3">
                            <Lightbulb className="w-4 h-4" /> Suggestions
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="faq" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg text-premium text-primary">Frequently Asked Questions</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick answers to common questions about Yatra Setu.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger>How do I book a smart bus ticket?</AccordionTrigger>
                                        <AccordionContent>
                                            You can book a ticket by navigating to the "Book Ticket" section, selecting your origin, destination, and date of travel. Our smart network will show you the most efficient routes and real-time availability.
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="item-2">
                                        <AccordionTrigger>How can I track my bus in real-time?</AccordionTrigger>
                                        <AccordionContent>
                                            Once you have a valid ticket, you can view the live location of your bus through the "Live Tracking" feature on the home page or in your booking details.
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="item-3">
                                        <AccordionTrigger>What are the refund policies for cancellations?</AccordionTrigger>
                                        <AccordionContent>
                                            Cancellations made 2 hours before departure are eligible for an 80% refund. Cancellations made within 2 hours are non-refundable. All refunds are processed back to the original payment method within 3-5 business days.
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="complaints">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg text-premium text-primary">Report an Issue</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">File a complaint against a bus or service you've recently used.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select Bus You Traveled In</label>
                                            <select
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                                                value={selectedBus}
                                                onChange={(e) => setSelectedBus(e.target.value)}
                                                required
                                            >
                                                <option value="">Choose a bus...</option>
                                                {traveledBuses.map(bus => (
                                                    <option key={bus.id} value={bus.id}>{bus.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Date of Travel</label>
                                            <Input
                                                type="date"
                                                value={travelDate}
                                                onChange={(e) => setTravelDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Issue Category</label>
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            <option value="staff">Staff Behavior</option>
                                            <option value="condition">Bus Condition</option>
                                            <option value="delay">Delay Policy</option>
                                            <option value="cleanliness">Cleanliness</option>
                                            <option value="safety">Safety Concerns</option>
                                        </select>
                                    </div>

                                    {category === "staff" && (
                                        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border animate-in fade-in slide-in-from-top-2">
                                            <label className="text-sm font-semibold">Complaint Against Staff Member:</label>
                                            <RadioGroup
                                                defaultValue="driver"
                                                className="flex items-center gap-6"
                                                onValueChange={setStaffRole}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="driver" id="driver" />
                                                    <Label htmlFor="driver" className="cursor-pointer">Driver</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="conductor" id="conductor" />
                                                    <Label htmlFor="conductor" className="cursor-pointer">Conductor</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Complaint Details</label>
                                        <Textarea
                                            placeholder="Please describe what went wrong during your journey..."
                                            className="min-h-[120px] focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full font-bold h-11">Submit Complaint</Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="suggestions">
                        <div className="grid gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg text-premium text-primary">Make a Suggestion</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">We're always looking to improve our network and services.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Your Suggestion Is For</label>
                                            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                                                <option>A Specific Bus Route</option>
                                                <option>Transport Organization</option>
                                                <option>Website/App Owner</option>
                                                <option>General Infrastructure</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Your Suggestion</label>
                                            <Textarea
                                                placeholder="Tell us how we can make your experience better..."
                                                className="min-h-[100px]"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" variant="secondary" className="w-full">
                                            Share Suggestion
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <MessageSquareQuote className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-semibold text-primary">Crowdsourced Innovation</p>
                                    <p className="text-muted-foreground">Your suggestions are shared with transport authorities to improve public transport infrastructure across the nation.</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}
