import { useState, useEffect } from "react";
import {
    Search, MapPin, Building2, ArrowRight, ShieldCheck,
    Lock, CheckCircle2, AlertCircle, Clock, Save, UserCheck,
    ChevronRight, MoreHorizontal
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// --- Types ---
interface TrackedBus {
    _id: string;
    busNumber: string;
    orgCategory: string;
    orgName: string;
    state: string;
    district: string;
    town: string;
    pinCode: string;
    status: string;
    liveLocation: { lat: number; lng: number };
    route: { from: string; to: string };
}

interface AuthorizedBus {
    bus: TrackedBus;
    nickname: string;
}

interface PendingRequest {
    _id: string;
    bus: TrackedBus;
    status: string;
    requestedAt: string;
}

const STEPS = ["Location", "Bus Type", "Organisation", "Access Code", "Live Track"];

export default function OrganizationTracking() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search Form State
    const [selectedState, setSelectedState] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [pinCode, setPinCode] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [selectedOrg, setSelectedOrg] = useState("");

    // Location Data
    const [locations, setLocations] = useState<{ states: string[] }>({ states: [] });
    const [districts, setDistricts] = useState<string[]>([]);
    const [orgNames, setOrgNames] = useState<string[]>([]);
    const [showCode, setShowCode] = useState(false);
    const [requestPending, setRequestPending] = useState(false);

    // Auth Flow State
    const [accessCode, setAccessCode] = useState("");
    const [nickname, setNickname] = useState("");
    const [authorizedBuses, setAuthorizedBuses] = useState<AuthorizedBus[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [trackedBuses, setTrackedBuses] = useState<TrackedBus[]>([]);
    const [selectedBus, setSelectedBus] = useState<TrackedBus | null>(null);

    useEffect(() => {
        fetchAuthorizedBuses();
        fetchPendingRequests();
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const data = await api.getOfficialLocations();
            if (data.states) {
                setLocations(data);
            }
        } catch (err) {
            console.error("Failed to fetch locations", err);
        }
    };

    useEffect(() => {
        if (selectedState) {
            fetchDistricts(selectedState);
            setPinCode("");
            setSelectedOrg(""); // Reset org when location changes
            setError(null);
        } else {
            setDistricts([]);
            setSelectedDistrict("");
        }
    }, [selectedState]);

    const fetchDistricts = async (state: string) => {
        try {
            const data = await api.getOfficialDistricts(state);
            if (Array.isArray(data)) {
                setDistricts(data);
                setSelectedDistrict(""); // Reset district on state change
            }
        } catch (err) {
            console.error("Failed to fetch districts", err);
        }
    };

    useEffect(() => {
        if (selectedDistrict) {
            setSelectedOrg("");
            setError(null);
        }
    }, [selectedDistrict]);

    useEffect(() => {
        if (step === 2 && selectedState && selectedDistrict && selectedType) {
            fetchOrgNames();
        }
    }, [step, selectedState, selectedDistrict, selectedType]);

    const fetchOrgNames = async () => {
        setLoading(true);
        try {
            const data = await api.getOfficialNames(selectedState, selectedDistrict, selectedType);
            if (Array.isArray(data)) {
                setOrgNames(data);
            }
        } catch (err) {
            console.error("Failed to fetch org names", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuthorizedBuses = async () => {
        try {
            const data = await api.getAuthorizedBuses();
            if (Array.isArray(data)) {
                const validBuses = data.filter(item => item && item.bus);
                setAuthorizedBuses(validBuses);
            }
        } catch (err) {
            console.error("Failed to fetch authorized buses", err);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const data = await api.getMyTrackingRequests();
            if (Array.isArray(data)) {
                setPendingRequests(data);
            }
        } catch (err) {
            console.error("Failed to fetch pending requests", err);
        }
    };

    const goNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
    const goBack = () => {
        if (step === 0) navigate("/");
        else setStep(s => s - 1);
    };

    const handleSearch = async () => {
        if (!selectedState || !selectedDistrict || !selectedType || !selectedOrg) {
            toast.error("Please fill all fields");
            return;
        }

        setLoading(true);
        setError(null);
        console.log("🔍 Searching with params:", {
            state: selectedState,
            district: selectedDistrict,
            pinCode,
            orgCategory: selectedType,
            orgName: selectedOrg
        });
        try {
            const data = await api.searchOfficialBuses({
                state: selectedState,
                district: selectedDistrict,
                pinCode: pinCode,
                orgCategory: selectedType,
                orgName: selectedOrg,
            });

            if (Array.isArray(data) && data.length > 0) {
                const bus = data[0];
                setSelectedBus(bus);

                // Check if already authorized or pending
                const isAuth = authorizedBuses.some(b => b.bus?._id === bus._id);
                const isPending = pendingRequests.some(r => r.bus?._id === bus._id);

                if (isAuth) {
                    setStep(4);
                    setRequestPending(false);
                } else if (isPending) {
                    setStep(3);
                    setRequestPending(true);
                } else {
                    setStep(3); // Go to Access Code step
                    setRequestPending(false);
                }
            } else if (Array.isArray(data)) {
                setError(`No buses found for ${selectedOrg} in ${selectedDistrict}.`);
            } else {
                setError(data?.message || "Failed to fetch buses.");
            }
        } catch (err) {
            setError("Failed to fetch buses.");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAccess = async () => {
        if (!selectedBus || !accessCode) return;

        setLoading(true);
        try {
            const res = await api.requestTrackingAccess(selectedBus._id, accessCode, nickname);
            if (res && res.request) {
                toast.success("Request sent! Waiting for approval.");
                setRequestPending(true);
                setAccessCode("");
                fetchPendingRequests();
            } else {
                toast.error(res?.message || "Invalid code");
            }
        } catch (err) {
            toast.error("Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    const sidebarItems = [
        { label: "Find Bus", icon: <Search className="w-4 h-4" />, href: "/official-tracking" },
        { label: "My Buses", icon: <ShieldCheck className="w-4 h-4" />, href: "#authorized" },
    ];

    return (
        <DashboardLayout
            title="Organization Bus Tracking"
            subtitle="Securely track your School, Office, or College bus"
            sidebarItems={sidebarItems}
        >
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* --- Step Indicator --- */}
                <div className="flex justify-between max-w-2xl mx-auto mb-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 -z-10" />
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-card border border-border text-muted-foreground mr-0"
                                }`}>
                                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${i === step ? "text-primary" : "text-muted-foreground opacity-50"}`}>{s}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* --- My Buses / Tracking List --- */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tighter">My Tracking List</h3>
                        </div>

                        {authorizedBuses.length === 0 && pendingRequests.length === 0 ? (
                            <div className="portal-card p-6 text-center border-dashed">
                                <ShieldCheck className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground opacity-60 italic">No tracking set up. Search and request access to start.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Authorized Section */}
                                {authorizedBuses.map((auth, idx) => (
                                    <button
                                        key={auth.bus?._id || idx}
                                        onClick={() => {
                                            if (auth.bus) {
                                                setSelectedBus(auth.bus);
                                                setStep(4);
                                                setRequestPending(false);
                                            }
                                        }}
                                        className="portal-card p-4 w-full text-left group hover:border-primary/50 transition-all border-l-4 border-l-success bg-white"
                                    >
                                        <p className="text-[9px] font-black text-primary uppercase mb-1">{auth.bus?.orgName}</p>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-black">{auth.nickname || auth.bus?.busNumber}</span>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                ))}

                                {/* Pending Requests Section */}
                                {pendingRequests.map((req, idx) => (
                                    <button
                                        key={req._id || idx}
                                        onClick={() => {
                                            if (req.bus) {
                                                setSelectedBus(req.bus);
                                                setStep(3);
                                                setRequestPending(true);
                                            }
                                        }}
                                        className="portal-card p-4 w-full text-left border-l-4 border-l-amber-300 bg-amber-50/30 group hover:border-amber-400 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[9px] font-bold text-amber-700 uppercase">{req.bus?.orgName || "Organization"}</p>
                                            <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">waiting for the get verified</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-700">{req.bus?.busNumber}</span>
                                            <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                                        </div>
                                        <p className="text-[8px] font-medium text-amber-600/70 mt-2 italic flex items-center gap-1">
                                            <ArrowRight className="w-2 h-2" /> View Status
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* --- Main Workflow Section --- */}
                    <div className="md:col-span-2">
                        <div className="portal-card p-8">
                            {step === 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-primary/10 rounded-2xl">
                                            <MapPin className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black">Search Location</h2>
                                            <p className="text-xs text-muted-foreground">Select where the organization is located</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">State</label>
                                            <Select onValueChange={setSelectedState} value={selectedState}>
                                                <SelectTrigger className="h-12 border-2 border-slate-100 focus:border-primary/50 transition-all rounded-xl">
                                                    <SelectValue placeholder="Select State" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.states.map(s => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">District</label>
                                            <Select onValueChange={setSelectedDistrict} value={selectedDistrict} disabled={!selectedState}>
                                                <SelectTrigger className="h-12 border-2 border-slate-100 focus:border-primary/50 transition-all rounded-xl">
                                                    <SelectValue placeholder={selectedState ? "Select District" : "Select State first"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {districts.map(d => (
                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground">PIN Code</label>
                                        <Input
                                            type="text"
                                            maxLength={6}
                                            placeholder="e.g. 110001"
                                            value={pinCode}
                                            onChange={e => setPinCode(e.target.value)}
                                            className="h-12 border-2 border-slate-100 focus:border-primary/50 transition-all rounded-xl font-bold"
                                        />
                                    </div>
                                    <Button className="w-full h-12 text-sm font-black" onClick={() => {
                                        if (pinCode && pinCode.length > 0 && pinCode.length < 6) {
                                            toast.error("PIN Code must be 6 digits");
                                            return;
                                        }
                                        goNext();
                                    }}>Continue <ArrowRight className="ml-2 w-4 h-4" /></Button>
                                    {pinCode && (
                                        <Button variant="ghost" onClick={() => setPinCode("")} className="w-full text-[10px] h-8 text-muted-foreground">Clear Search Filters</Button>
                                    )}
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-black mb-6">Select Bus Type</h2>
                                    <div className="grid grid-cols-3 gap-4">
                                        {["School", "College", "Office"].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => { setSelectedType(t); goNext(); }}
                                                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${selectedType === t ? "border-primary bg-primary/5 shadow-xl scale-105" : "border-border hover:border-primary/30"
                                                    }`}
                                            >
                                                <Building2 className={`w-8 h-8 ${selectedType === t ? "text-primary" : "text-muted-foreground"}`} />
                                                <span className="text-[10px] font-black uppercase">{t} Bus</span>
                                            </button>
                                        ))}
                                    </div>
                                    <Button variant="ghost" onClick={goBack} className="w-full text-xs font-bold text-muted-foreground">Go Back</Button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-black mb-4">Organisation Name</h2>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">Select {selectedType} Name</label>
                                            <Select onValueChange={setSelectedOrg} value={selectedOrg}>
                                                <SelectTrigger className="h-14 text-sm font-black border-2 border-slate-100 focus:border-primary/50 transition-all rounded-2xl">
                                                    <SelectValue placeholder={`Choose ${selectedType}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {orgNames.map(name => (
                                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {orgNames.length === 0 && !loading && (
                                            <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-3 rounded-xl flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" /> No {selectedType.toLowerCase()} buses found in {selectedDistrict}, {selectedState}.
                                            </p>
                                        )}
                                    </div>
                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> {error}
                                        </div>
                                    )}
                                    <Button
                                        className="w-full h-14 text-sm font-black"
                                        onClick={handleSearch}
                                        disabled={loading}
                                    >
                                        {loading ? "Searching..." : "Find Bus"} <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" onClick={goBack} className="w-full text-xs font-bold text-muted-foreground">Go Back</Button>
                                </div>
                            )}

                            {step === 3 && selectedBus && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    {!requestPending ? (
                                        <>
                                            <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10 mb-6">
                                                <p className="text-[10px] font-black text-primary uppercase mb-1">Bus Identified</p>
                                                <h3 className="text-lg font-black">{selectedBus.busNumber}</h3>
                                                <p className="text-xs text-muted-foreground">{selectedBus.orgName}</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                                        <Lock className="w-3 h-3 text-amber-500" /> Organization Access Code
                                                    </label>
                                                    <div className="relative group">
                                                        <Input
                                                            type={showCode ? "text" : "password"}
                                                            placeholder="Enter 6-digit code"
                                                            value={accessCode}
                                                            onChange={e => setAccessCode(e.target.value)}
                                                            className="h-14 font-mono text-center tracking-widest transition-all focus:ring-2 focus:ring-primary/20"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCode(!showCode)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                                                        >
                                                            {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Personal Nickname (Optional)</label>
                                                    <Input
                                                        placeholder="e.g. My Morning School Bus"
                                                        value={nickname}
                                                        onChange={e => setNickname(e.target.value)}
                                                        className="h-12"
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full h-14 text-sm font-black bg-slate-900 border-b-4 border-slate-700 active:border-b-0 hover:bg-slate-800 transition-all rounded-2xl"
                                                onClick={handleRequestAccess}
                                                disabled={loading}
                                            >
                                                {loading ? "Verifying..." : "Request Tracking Approval"}
                                            </Button>
                                            <p className="text-[9px] text-center text-muted-foreground px-8">
                                                Your request will be sent to the school/office transport manager. You will be able to track the bus once they approve your request.
                                            </p>
                                        </>
                                    ) : (
                                        <div className="py-12 text-center space-y-8 animate-in zoom-in-95 duration-700">
                                            <div className="relative mx-auto w-32 h-32">
                                                <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-ping" />
                                                <div className="absolute inset-2 bg-amber-500/20 rounded-full animate-pulse blur-xl" />
                                                <div className="relative w-full h-full bg-white rounded-[40px] border-4 border-amber-100 shadow-2xl shadow-amber-200/50 flex items-center justify-center">
                                                    <Clock className="w-16 h-16 text-amber-500 animate-[spin_4s_linear_infinite]" />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Verification in Progress</p>
                                                <h2 className="text-3xl font-black text-slate-900 leading-tight">
                                                    Please wait...<br />
                                                    <span className="text-primary/80 italic font-medium">waiting for the get verified</span>
                                                </h2>
                                                <p className="text-sm text-muted-foreground px-4">
                                                    We've sent your request for <span className="font-bold text-slate-900">{selectedBus?.busNumber}</span>. Live tracking will start as soon as the manager approves.
                                                </p>
                                            </div>

                                            <div className="p-6 bg-slate-50/80 backdrop-blur rounded-[32px] border border-slate-100 shadow-inner space-y-4">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <span>Verification Status</span>
                                                    <span className="text-amber-600 flex items-center gap-1.5 font-black">
                                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                                                        Pending Approval
                                                    </span>
                                                </div>
                                                <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-slate-100 p-0.5">
                                                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full w-2/3 animate-progress transition-all duration-1000 shadow-sm" />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground italic">You can close this page; we'll notify you once approved.</p>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                className="w-full h-14 text-xs font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                                                onClick={() => {
                                                    setRequestPending(false);
                                                    setStep(0);
                                                }}
                                            >
                                                Back to Dashboard
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 4 && selectedBus && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-success/10 rounded-2xl flex items-center justify-center">
                                                <ShieldCheck className="w-5 h-5 text-success" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black">{selectedBus.orgName || "Authorized Tracking"}</h2>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedBus.busNumber} • {selectedBus.orgName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-xs font-black text-success">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                                                </span>
                                                Live Now
                                            </div>
                                            <p className="text-[9px] text-muted-foreground font-bold">Updated just now</p>
                                        </div>
                                    </div>

                                    <div className="portal-card aspect-video border-2 border-primary/10 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-[#e5e7eb] opacity-40" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="relative">
                                                <div className="absolute -inset-8 bg-primary/20 rounded-full animate-ping opacity-20" />
                                                <div className="w-8 h-8 bg-primary rounded-full border-4 border-white shadow-xl flex items-center justify-center z-10 relative">
                                                    <Building2 className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-border shadow-soft">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground opacity-60 mb-1">Status</p>
                                            <p className="text-[10px] font-black text-primary">Heading to {selectedBus.route?.to || "Destination"}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="portal-card p-4 bg-slate-50 border-0">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Current Speed</p>
                                            <p className="text-lg font-black tracking-tight">32 <span className="text-[10px] text-muted-foreground">km/h</span></p>
                                        </div>
                                        <div className="portal-card p-4 bg-slate-50 border-0">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">ETA at Stop</p>
                                            <p className="text-lg font-black tracking-tight">8 <span className="text-[10px] text-muted-foreground">mins</span></p>
                                        </div>
                                    </div>

                                    <Button variant="outline" className="w-full h-12 text-xs font-bold" onClick={() => setStep(0)}>Stop Tracking</Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
