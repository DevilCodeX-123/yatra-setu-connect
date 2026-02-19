import Layout from "@/components/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FAQ() {
    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-xl">
                        <HelpCircle className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Help Center & FAQ</h1>
                        <p className="text-muted-foreground">Find answers to common questions about Yatra Setu.</p>
                    </div>
                </div>

                <div className="max-w-3xl">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>How do I book a smart bus ticket?</AccordionTrigger>
                            <AccordionContent>
                                You can book a ticket by navigating to the "Book Ticket" section, selecting your origin, destination, and date of travel.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Can I cancel my booking?</AccordionTrigger>
                            <AccordionContent>
                                Yes, cancellations are available up to 2 hours before the scheduled departure time.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </Layout>
    );
}
