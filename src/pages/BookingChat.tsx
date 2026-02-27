import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Bus, User, Clock, MessageSquare, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function BookingChat() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, role } = useAuth();
    const [booking, setBooking] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchChat = async (isRefresh = false) => {
        if (!id) return;
        if (isRefresh) setRefreshing(true);
        try {
            const history = await api.getBookingChat(id);
            if (Array.isArray(history)) {
                setMessages(history);
            }
        } catch (err) {
            console.error("Chat fetch failed", err);
        } finally {
            if (isRefresh) setRefreshing(false);
        }
    };

    const fetchBooking = async () => {
        if (!id) return;
        try {
            // We use the same getBookings but filter or we need a getBookingById
            const allBookings = await api.getBookings();
            const found = allBookings.find((b: any) => b._id === id);
            if (found) {
                setBooking(found);
            } else {
                // Try owner requests if not found in regular bookings
                const ownerReqs = await api.getOwnerRequests();
                const foundOwner = ownerReqs.find((b: any) => b._id === id);
                if (foundOwner) setBooking(foundOwner);
            }
        } catch (err) {
            console.error("Booking fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooking();
        fetchChat();

        // Polling every 10 seconds
        const interval = setInterval(() => fetchChat(), 10000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!id || !newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await api.sendBookingMessage(id, newMessage.trim());
            if (res._id || res.message) {
                setMessages(prev => [...prev, res]);
                setNewMessage("");
            } else {
                toast.error("Failed to send message");
            }
        } catch (err) {
            toast.error("Error sending message");
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!booking) return (
        <div className="p-12 text-center space-y-4">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
            <h3 className="font-bold text-xl">Chat Not Found</h3>
            <p className="text-muted-foreground">This booking or chat history is no longer available.</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
    );

    const otherParty = role === 'Owner' ? booking.user?.name : (booking.bus?.operator || "Owner");

    return (
        <DashboardLayout
            title="Booking Support"
            subtitle={`Chatting about PNR ${booking.pnr}`}
            sidebarItems={[]}
        >
            <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col pt-4 animate-slide-up">
                {/* Header */}
                <div className="portal-card p-4 mb-4 flex items-center justify-between bg-white shadow-sm border-b-4 border-b-primary/10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-lg text-slate-900">{otherParty}</h3>
                                {booking.status === 'Confirmed' && (
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black uppercase">Verified Rental</Badge>
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400">PNR: {booking.pnr} • {booking.bus?.busNumber}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchChat(true)} disabled={refreshing} className="h-8 text-[10px] font-black">
                        {refreshing ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                        REFRESH
                    </Button>
                </div>

                {/* Chat Bubble Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto space-y-4 px-2 pb-4 scrollbar-hide"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-40">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase">No messages yet</h4>
                                <p className="text-xs">Start a conversation with the {role === 'Owner' ? 'passenger' : 'bus owner'}.</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = (role === 'Owner' && msg.sender === 'Owner') || (role !== 'Owner' && msg.sender === 'User');
                            return (
                                <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        <div className={`px-4 py-3 rounded-2xl text-xs font-bold leading-relaxed shadow-sm ${isMe
                                            ? "bg-primary text-white rounded-br-none"
                                            : "bg-white border border-border text-slate-700 rounded-bl-none"
                                            }`}>
                                            {msg.message}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 px-1">
                                            <span className="text-[9px] font-black text-slate-400 opacity-60 uppercase">
                                                {format(new Date(msg.timestamp), 'h:mm a')}
                                            </span>
                                            {isMe && <ShieldCheck className="w-2.5 h-2.5 text-primary opacity-40" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-border rounded-t-3xl shadow-2xl mt-4">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message here..."
                            className="flex-1 h-12 bg-muted/30 border-none rounded-2xl px-4 text-sm font-bold focus-visible:ring-primary/20"
                            disabled={sending}
                        />
                        <Button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            size="icon"
                            className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                            {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </form>
                    <p className="text-[9px] text-center mt-3 text-slate-400 font-bold uppercase tracking-widest opacity-50">
                        Secure end-to-end communication for Yatra Setu Connect
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
