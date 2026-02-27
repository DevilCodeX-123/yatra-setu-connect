import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Bus, Mail, User } from 'lucide-react';

export function InvitationPoll() {
    const [invitation, setInvitation] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkInvitations();
    }, []);

    const checkInvitations = async () => {
        try {
            const res = await api.getEmployeeInvitations();
            if (Array.isArray(res)) {
                const pending = res.find((i: any) => i.status === 'Pending');
                if (pending) {
                    setInvitation(pending);
                    setOpen(true);
                }
            }
        } catch (err) {
            console.error("Failed to check invitations", err);
        }
    };

    const handleAction = async (accept: boolean) => {
        if (!invitation) return;
        setLoading(true);
        try {
            const res = accept
                ? await api.acceptInvitation(invitation.busId)
                : await api.rejectInvitation(invitation.busId);

            if (res.success) {
                toast.success(accept ? "Invitation accepted! You are now a Driver." : "Invitation declined.");
                setOpen(false);
                if (accept) {
                    // Redirect to driver panel or refresh to see sidebar changes
                    window.location.reload();
                }
            } else {
                toast.error(res.message || "Action failed");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!invitation) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !loading && setOpen(val)}>
            <DialogContent className="sm:max-w-md border-primary/20 bg-card/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
                <DialogHeader className="space-y-3 pt-4">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <Shield className="w-8 h-8" />
                    </div>
                    <DialogTitle className="text-center text-xl font-black text-primary tracking-tight">
                        Driving Offer Received
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm font-medium leading-relaxed px-2">
                        <span className="text-foreground font-black">{invitation.ownerName}</span>
                        <span className="opacity-60 font-medium"> ({invitation.ownerEmail}) </span>
                        and Bus <span className="text-primary font-black">{invitation.busNumber}</span> want you to drive for them.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/30 rounded-2xl p-4 border border-border mt-2 space-y-3">
                    <p className="text-center text-[13px] font-bold text-muted-foreground italic">
                        "Do you accept and ready to be the driver?"
                    </p>
                    <div className="flex items-center justify-center gap-4 py-1">
                        <div className="flex flex-col items-center gap-1 opacity-60">
                            <Bus className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Duty Access</span>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        <div className="flex flex-col items-center gap-1 opacity-60">
                            <User className="w-4 h-4 text-success" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Role Upgrade</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="grid grid-cols-2 gap-3 sm:justify-start pt-4 pb-2">
                    <Button
                        variant="outline"
                        onClick={() => handleAction(false)}
                        disabled={loading}
                        className="font-black tracking-widest uppercase text-[10px] h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95"
                    >
                        No, Reject
                    </Button>
                    <Button
                        onClick={() => handleAction(true)}
                        disabled={loading}
                        className="font-black tracking-widest uppercase text-[10px] h-11 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                    >
                        {loading ? "Activating..." : "Yes, Accept"}
                    </Button>
                </DialogFooter>

                <p className="text-[9px] text-center text-muted-foreground font-medium opacity-50 pb-2">
                    * If you accept, your role will change from Passenger to Employee instantly.
                </p>
            </DialogContent>
        </Dialog>
    );
}
