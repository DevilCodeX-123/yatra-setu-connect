import Layout from "@/components/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FAQ() {
    return (
        <Layout>
            <div className="space-y-6 pb-12 md:pb-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 sm:p-3 bg-primary rounded-xl">
                        <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl text-premium text-primary mb-0.5">Help Center & FAQ</h1>
                        <p className="text-[10px] font-bold text-slate-400">Find answers to common questions about Yatra Setu.</p>
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
