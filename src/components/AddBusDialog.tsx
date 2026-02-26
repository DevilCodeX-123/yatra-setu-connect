import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
    Bus, Plus, Trash2, ChevronRight, ChevronLeft, Globe, Lock,
    CheckCircle2, ArrowRight, Copy, Users, MapPin, Clock, Calendar, X,
    Columns, Minus
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SeatType = 'general' | 'women' | 'elderly' | 'disabled';
type ScheduleType = 'daily' | 'days' | 'specific';

/** A single cell in the 2D seat grid */
interface GridCell {
    type: SeatType;
    exists: boolean; // if false, the slot is physically empty
}

/** Full 2D seat grid: grid[rowIdx][colIdx] */
type SeatGrid = GridCell[][];

interface Stop { name: string; time: string; price: number; distance: number; }
interface RouteSchedule { type: ScheduleType; days: string[]; specificDates: string[]; startTime: string; endTime: string; loopEnabled: boolean; loopIntervalMinutes: number; }
interface BusRoute { id: string; label: string; stops: Stop[]; schedule: RouteSchedule; }

interface AddBusDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onBusAdded: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Bus Details', 'Routes & Stops', 'Seat Layout', 'Mode', 'Review', 'Confirmation'];
const BUS_TYPES = ['Ordinary', 'AC', 'Non-AC', 'Express', 'Volvo', 'Sleeper'];
const ORG_TYPES = ['School', 'College', 'Office', 'Other'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const INDIA_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh', 'Andaman & Nicobar',
    'Dadra & Nagar Haveli', 'Daman & Diu', 'Lakshadweep',
];

const SEAT_STYLES: Record<SeatType, string> = {
    general: 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20',
    women: 'bg-pink-500/15 border-pink-400/40 text-pink-600 dark:text-pink-400 hover:bg-pink-500/25',
    elderly: 'bg-amber-500/15 border-amber-400/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25',
    disabled: 'bg-purple-500/15 border-purple-400/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25',
};
const SEAT_LABELS: Record<SeatType, string> = {
    general: 'General', women: '♀ Women', elderly: '⬆ Senior', disabled: '♿ Disabled',
};
const SEAT_CYCLE: SeatType[] = ['general', 'women', 'elderly', 'disabled'];

// ─── Grid helpers ─────────────────────────────────────────────────────────────

const makeCell = (type: SeatType = 'general'): GridCell => ({ type, exists: true });

/** Build initial grid: numRows rows, leftCols+rightCols columns, first 3 seats are women */
const buildGrid = (numRows: number, leftCols: number, rightCols: number): SeatGrid => {
    let idx = 0;
    return Array.from({ length: numRows }, () =>
        Array.from({ length: leftCols + rightCols }, () => {
            const cell = makeCell(idx < 3 ? 'women' : 'general');
            idx++;
            return cell;
        })
    );
};

/** Count existing seats in grid */
const countSeats = (grid: SeatGrid) => grid.flat().filter(c => c.exists).length;

/** Assign sequential seat numbers to existing seats, left-to-right top-to-bottom */
const getSeatNumber = (grid: SeatGrid, row: number, col: number): number => {
    let n = 1;
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
            if (r === row && c === col) return n;
            if (grid[r][c].exists) n++;
        }
    }
    return n;
};

const makeRoute = (idx: number): BusRoute => ({
    id: `route-${Date.now()}-${idx}`,
    label: `Route ${idx + 1}`,
    stops: [{ name: '', time: '', price: 0, distance: 0 }, { name: '', time: '', price: 0, distance: 0 }],
    schedule: { type: 'specific', days: [], specificDates: [], startTime: '', endTime: '', loopEnabled: false, loopIntervalMinutes: 60 },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function AddBusDialog({ open, onOpenChange, onBusAdded }: AddBusDialogProps) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [createdBus, setCreatedBus] = useState<any>(null);
    const [pastBuses, setPastBuses] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            api.getOwnerDashboard().then((res: any) => {
                if (res.buses) setPastBuses(res.buses);
            }).catch(console.error);
        }
    }, [open]);

    // Step 0
    const [busNumber, setBusNumber] = useState('');
    const [busName, setBusName] = useState('');
    const [busType, setBusType] = useState('Ordinary');
    const [mileage, setMileage] = useState('4');
    const [rentalPerDay, setRentalPerDay] = useState('5000');
    const [rentalPerHour, setRentalPerHour] = useState('500');

    // Step 1 – Routes
    const [routes, setRoutes] = useState<BusRoute[]>([makeRoute(0)]);
    const [activeRouteIdx, setActiveRouteIdx] = useState(0);

    // Step 2 – Seat Layout (2D grid)
    const [leftCols, setLeftCols] = useState(2);
    const [rightCols, setRightCols] = useState(2);
    const [seatGrid, setSeatGrid] = useState<SeatGrid>(() => buildGrid(10, 2, 2));
    const [selectedType, setSelectedType] = useState<SeatType>('general');

    // Step 3 – Mode
    const [isPrivate, setIsPrivate] = useState(false);
    const [stateVal, setStateVal] = useState('');
    const [district, setDistrict] = useState('');
    const [town, setTown] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [orgCategory, setOrgCategory] = useState('');
    const [orgName, setOrgName] = useState('');

    const totalSeats = countSeats(seatGrid);
    const totalCols = leftCols + rightCols;
    const activeRoute = routes[activeRouteIdx] ?? routes[0];

    // ─── Grid operations ─────────────────────────────────────────────────────

    /** Change a single cell */
    const updateCell = useCallback((row: number, col: number, patch: Partial<GridCell>) =>
        setSeatGrid(g => g.map((r, ri) => ri !== row ? r : r.map((c, ci) => ci !== col ? c : { ...c, ...patch }))), []);

    /** Add a row at the bottom */
    const addRow = () => setSeatGrid(g => [...g, Array.from({ length: totalCols }, () => makeCell())]);

    /** Remove last row */
    const removeRow = () => { if (seatGrid.length > 1) setSeatGrid(g => g.slice(0, -1)); };

    /** Add a column to left side */
    const addLeftCol = () => {
        setLeftCols(l => l + 1);
        setSeatGrid(g => g.map(row => [makeCell(), ...row]));
    };
    /** Remove leftmost column */
    const removeLeftCol = () => {
        if (leftCols <= 1) return;
        setLeftCols(l => l - 1);
        setSeatGrid(g => g.map(row => row.slice(1)));
    };
    /** Add a column to right side */
    const addRightCol = () => {
        setRightCols(r => r + 1);
        setSeatGrid(g => g.map(row => [...row, makeCell()]));
    };
    /** Remove rightmost column */
    const removeRightCol = () => {
        if (rightCols <= 1) return;
        setRightCols(r => r - 1);
        setSeatGrid(g => g.map(row => row.slice(0, -1)));
    };

    /** Toggle cell existence */
    const toggleCell = (row: number, col: number) =>
        updateCell(row, col, { exists: !seatGrid[row][col].exists });

    /** Assign type to cell */
    const assignType = (row: number, col: number) =>
        updateCell(row, col, { type: selectedType, exists: true });

    // ─── Route helpers ────────────────────────────────────────────────────────

    const updateRoute = (ri: number, patch: Partial<BusRoute>) =>
        setRoutes(p => p.map((r, i) => i === ri ? { ...r, ...patch } : r));

    const updateStop = (ri: number, si: number, field: keyof Stop, val: string | number) =>
        setRoutes(p => p.map((r, i) => i !== ri ? r : {
            ...r, stops: r.stops.map((s, j) => j !== si ? s : { ...s, [field]: val })
        }));

    const addStop = (ri: number) =>
        setRoutes(p => p.map((r, i) => i !== ri ? r : { ...r, stops: [...r.stops, { name: '', time: '', price: 0, distance: 0 }] }));

    const removeStop = (ri: number, si: number) =>
        setRoutes(p => p.map((r, i) => i !== ri ? r : { ...r, stops: r.stops.filter((_, j) => j !== si) }));

    const addRoute = () => { setRoutes(p => [...p, makeRoute(p.length)]); setActiveRouteIdx(routes.length); };

    const removeRoute = (ri: number) => {
        if (routes.length <= 1) return;
        setRoutes(p => p.filter((_, i) => i !== ri));
        setActiveRouteIdx(prev => Math.max(0, prev >= ri ? prev - 1 : prev));
    };

    const toggleDay = (ri: number, day: string) => {
        const days = routes[ri].schedule.days;
        updateRoute(ri, { schedule: { ...routes[ri].schedule, days: days.includes(day) ? days.filter(d => d !== day) : [...days, day] } });
    };

    const addDate = (ri: number, date: string) => {
        if (!date) return;
        const dates = routes[ri].schedule.specificDates;
        if (!dates.includes(date)) updateRoute(ri, { schedule: { ...routes[ri].schedule, specificDates: [...dates, date].sort() } });
    };

    const removeDate = (ri: number, date: string) =>
        updateRoute(ri, { schedule: { ...routes[ri].schedule, specificDates: routes[ri].schedule.specificDates.filter(d => d !== date) } });

    // ─── Validation ───────────────────────────────────────────────────────────

    const canNext = () => {
        if (step === 0) return busNumber.trim().length >= 4;
        if (step === 1) return routes.every(r => r.stops.length >= 2 && r.stops[0].name && r.stops[r.stops.length - 1].name);
        if (step === 2) return totalSeats >= 2;
        if (step === 3) return !isPrivate || (!!stateVal && !!district && !!orgCategory && !!orgName && pinCode.length === 6);
        return true;
    };

    // ─── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Flatten grid to seat list
            const seatList: { number: number; status: string; reservedFor: SeatType }[] = [];
            let seatNum = 1;
            seatGrid.forEach(row => row.forEach(cell => {
                if (cell.exists) seatList.push({ number: seatNum++, status: 'Available', reservedFor: cell.type });
            }));

            const firstRoute = routes[0];
            const payload = {
                busNumber: busNumber.trim().toUpperCase(),
                name: busName.trim() || busNumber.trim().toUpperCase(),
                type: busType, mileage: Number(mileage) || 4.0,
                totalSeats: totalSeats,
                seats: seatList,
                stops: firstRoute.stops.map((s, i) => ({ name: s.name, arrivalTime: s.time, price: i === 0 ? 0 : Number(s.price), sequence: i })),
                departureTime: firstRoute.stops[0]?.time || '',
                arrivalTime: firstRoute.stops[firstRoute.stops.length - 1]?.time || '',
                routes: routes.map(r => ({
                    label: r.label,
                    stops: r.stops.map((s, i) => ({ name: s.name, arrivalTime: s.time, price: i === 0 ? 0 : Number(s.price), distance: i === 0 ? 0 : Number(s.distance), sequence: i })),
                    schedule: r.schedule,
                })),
                isPrivate,
                ...(isPrivate ? { state: stateVal, district, town, pinCode, orgCategory, orgName } : {}),
                rentalPricePerDay: Number(rentalPerDay),
                rentalPricePerHour: Number(rentalPerHour),
            };
            const res = await api.addBus(payload);
            if (res.success) { setCreatedBus(res.bus); setStep(6); onBusAdded(); }
            else toast.error(res.message || 'Failed to add bus');
        } catch { toast.error('Network error. Please try again.'); }
        finally { setLoading(false); }
    };

    const handleClose = () => {
        setStep(0); setCreatedBus(null);
        setBusNumber(''); setBusName(''); setBusType('Ordinary'); setMileage('4');
        setRoutes([makeRoute(0)]); setActiveRouteIdx(0);
        setLeftCols(2); setRightCols(2); setSeatGrid(buildGrid(10, 2, 2));
        setIsPrivate(false); setStateVal(''); setDistrict(''); setTown(''); setPinCode(''); setOrgCategory(''); setOrgName('');
        onOpenChange(false);
    };

    const copy = (text: string, label: string) => { navigator.clipboard.writeText(text); toast.success(`${label} copied!`); };

    // ─── Seat grid renderer ───────────────────────────────────────────────────

    const renderGrid = () => {
        // Column header labels
        const leftLabels = Array.from({ length: leftCols }, (_, i) => `L${i + 1}`);
        const rightLabels = Array.from({ length: rightCols }, (_, i) => `R${i + 1}`);

        return (
            <div className="space-y-2">
                {/* Type selector */}
                <div className="flex flex-wrap gap-1.5 mb-1">
                    {SEAT_CYCLE.map(t => (
                        <button key={t} onClick={() => setSelectedType(t)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${SEAT_STYLES[t]} ${selectedType === t ? 'ring-2 ring-offset-1 ring-current' : ''}`}>
                            {SEAT_LABELS[t]}
                        </button>
                    ))}
                    <span className="text-[10px] text-muted-foreground self-center ml-1 hidden sm:block">
                        Click → assign type · Right-click → remove/restore
                    </span>
                </div>

                {/* Column controls */}
                <div className="flex items-center justify-between gap-2 bg-muted/40 rounded-xl px-3 py-2">
                    {/* Left side controls */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-semibold w-10">Left</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={removeLeftCol} disabled={leftCols <= 1}>
                            <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-bold text-foreground w-4 text-center">{leftCols}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={addLeftCol}>
                            <Plus className="w-3 h-3" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground/40">
                        <div className="h-px w-8 bg-border" />
                        <span className="text-[9px]">AISLE</span>
                        <div className="h-px w-8 bg-border" />
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={removeRightCol} disabled={rightCols <= 1}>
                            <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-bold text-foreground w-4 text-center">{rightCols}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={addRightCol}>
                            <Plus className="w-3 h-3" />
                        </Button>
                        <span className="text-[10px] text-muted-foreground font-semibold w-10 text-right">Right</span>
                    </div>
                </div>

                {/* Header row with column labels */}
                <div className="flex items-center gap-1 justify-center px-6">
                    <div className="w-5" />{/* row number space */}
                    <div className="flex gap-1">
                        {leftLabels.map(l => (
                            <div key={l} className="w-8 text-center text-[9px] font-bold text-muted-foreground">{l}</div>
                        ))}
                    </div>
                    <div className="w-5 text-center text-[8px] text-muted-foreground/30">│</div>
                    <div className="flex gap-1">
                        {rightLabels.map(l => (
                            <div key={l} className="w-8 text-center text-[9px] font-bold text-muted-foreground">{l}</div>
                        ))}
                    </div>
                    <div className="w-5" />{/* remove row btn space */}
                </div>

                {/* Seat rows */}
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                    <div className="flex items-center gap-2 opacity-40">
                        <div className="h-px flex-1 bg-border" /><span className="text-[9px] text-muted-foreground shrink-0">FRONT — DRIVER</span><div className="h-px flex-1 bg-border" />
                    </div>

                    {seatGrid.map((row, ri) => {
                        // Assign sequential numbers to existing seats in this row
                        let seatCounter = 1;
                        for (let r = 0; r < ri; r++) seatCounter += seatGrid[r].filter(c => c.exists).length;

                        return (
                            <div key={ri} className="flex items-center gap-1 justify-center">
                                {/* Row number */}
                                <span className="text-[9px] text-muted-foreground w-5 text-right shrink-0">{ri + 1}</span>

                                {/* Left cells */}
                                <div className="flex gap-1">
                                    {row.slice(0, leftCols).map((cell, ci) => {
                                        const num = cell.exists ? seatCounter++ : null;
                                        if (!cell.exists) seatCounter; // don't increment
                                        return (
                                            <GridSeatCell key={ci} cell={cell} displayNum={cell.exists ? ((() => { /* already incremented */ return seatCounter - 1; })()) : null}
                                                onAssign={() => assignType(ri, ci)}
                                                onToggle={e => { e.preventDefault(); toggleCell(ri, ci); }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Aisle */}
                                <div className="w-5 text-center text-[8px] text-muted-foreground/30 shrink-0">│</div>

                                {/* Right cells */}
                                <div className="flex gap-1">
                                    {row.slice(leftCols).map((cell, rci) => {
                                        const ci = leftCols + rci;
                                        return (
                                            <GridSeatCell key={ci} cell={cell} displayNum={null}
                                                onAssign={() => assignType(ri, ci)}
                                                onToggle={e => { e.preventDefault(); toggleCell(ri, ci); }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Remove row */}
                                <button onClick={removeRow} className="w-5 h-5 text-[9px] text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded transition-all shrink-0 flex items-center justify-center" title="Remove last row">
                                    {ri === seatGrid.length - 1 ? <Minus className="w-3 h-3" /> : null}
                                </button>
                            </div>
                        );
                    })}

                    <div className="flex items-center gap-2 opacity-40 mt-1">
                        <div className="h-px flex-1 bg-border" /><span className="text-[9px] text-muted-foreground shrink-0">REAR</span><div className="h-px flex-1 bg-border" />
                    </div>
                </div>

                {/* Row controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{totalSeats} seats · {seatGrid.length} rows · {totalCols} cols</Badge>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={removeRow} disabled={seatGrid.length <= 1} className="h-7 text-xs px-2">
                            <Minus className="w-3 h-3 mr-1" /> Row
                        </Button>
                        <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs px-2">
                            <Plus className="w-3 h-3 mr-1" /> Row
                        </Button>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-4 gap-2">
                    {SEAT_CYCLE.map(type => {
                        const cnt = seatGrid.flat().filter(c => c.exists && c.type === type).length;
                        return cnt > 0 ? (
                            <div key={type} className={`rounded-lg p-2 text-center border ${SEAT_STYLES[type]}`}>
                                <p className="text-base font-bold">{cnt}</p>
                                <p className="text-[9px] font-medium">{SEAT_LABELS[type]}</p>
                            </div>
                        ) : null;
                    })}
                </div>
            </div>
        );
    };

    // ─── Main render ──────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
                        <Bus className="w-5 h-5 text-primary" />
                        {step === 6 ? 'Bus Registered! 🎉' : 'Register New Bus'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs">
                        {step === 6 ? 'Bus added to your fleet.' : `Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
                    </DialogDescription>
                </DialogHeader>

                {step < 6 && (
                    <div className="flex gap-1 mb-1">
                        {STEPS.map((s, i) => (
                            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
                        ))}
                    </div>
                )}

                {/* ── STEP 0: Bus Details ── */}
                {step === 0 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Bus Number *</Label>
                                <Input value={busNumber} onChange={e => setBusNumber(e.target.value.toUpperCase())} placeholder="e.g. MH-12-AB-1234" className="uppercase" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Bus Name / Operator</Label>
                                <Input value={busName} onChange={e => setBusName(e.target.value)} placeholder="e.g. City Express" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Bus Type</Label>
                                <Select value={busType} onValueChange={setBusType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{BUS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Mileage (km/l)</Label>
                                <Input type="number" value={mileage} onChange={e => setMileage(e.target.value)} step="0.1" />
                            </div>
                        </div>
                        <Separator />
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Rental Pricing</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Price / Day (₹)</Label>
                                <Input type="number" value={rentalPerDay} onChange={e => setRentalPerDay(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Price / Hour (₹)</Label>
                                <Input type="number" value={rentalPerHour} onChange={e => setRentalPerHour(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 1: Routes & Stops ── */}
                {step === 1 && (
                    <div className="space-y-3">
                        {/* Route Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {routes.map((r, ri) => (
                                <div key={r.id} className="flex items-center shrink-0">
                                    <button onClick={() => setActiveRouteIdx(ri)}
                                        className={`px-3 py-1.5 rounded-l-lg text-xs font-semibold border transition-all ${activeRouteIdx === ri ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'}`}>
                                        {r.label}
                                    </button>
                                    {routes.length > 1 && (
                                        <button onClick={() => removeRoute(ri)}
                                            className={`px-1.5 py-1.5 rounded-r-lg border-y border-r text-xs transition-all ${activeRouteIdx === ri ? 'bg-primary/80 text-primary-foreground border-primary' : 'bg-muted border-border text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'}`}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <Button size="sm" variant="outline" onClick={addRoute} className="h-8 shrink-0 border-dashed text-primary hover:bg-primary/5">
                                <Plus className="w-3 h-3 mr-1" /> Route
                            </Button>
                        </div>

                        {/* Route Label */}
                        <Input value={activeRoute.label} onChange={e => updateRoute(activeRouteIdx, { label: e.target.value })}
                            className="h-8 text-xs font-semibold" placeholder="Route name (e.g. Morning Service)" />

                        {/* Schedule */}
                        <div className="bg-muted/40 rounded-xl p-3 space-y-3 border border-border">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span className="text-xs font-bold text-foreground">Route Schedule</span>
                                <div className="flex items-center gap-1.5 ml-auto">
                                    {(['daily', 'days', 'specific'] as ScheduleType[]).map(t => (
                                        <button key={t} onClick={() => updateRoute(activeRouteIdx, { schedule: { ...activeRoute.schedule, type: t } })}
                                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${activeRoute.schedule.type === t ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background border border-border text-muted-foreground hover:bg-muted'}`}>
                                            {t === 'daily' ? '🔁 Daily' : t === 'days' ? '📅 Specific Days' : '📆 Specific Dates'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Days Selection */}
                            {activeRoute.schedule.type === 'days' && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Select Days</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {WEEKDAYS.map(d => (
                                            <button key={d} onClick={() => toggleDay(activeRouteIdx, d)}
                                                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all shadow-sm ${activeRoute.schedule.days.includes(d) ? 'bg-primary text-primary-foreground border-primary scale-105 ring-2 ring-primary/20' : 'bg-background border border-border text-muted-foreground hover:border-primary/40 hover:bg-muted'}`}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dates Selection */}
                            {activeRoute.schedule.type === 'specific' && (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Select Dates</Label>
                                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                                        <div className="relative">
                                            <Input type="date" min={new Date().toISOString().split('T')[0]}
                                                onChange={e => { addDate(activeRouteIdx, e.target.value); e.target.value = ''; }}
                                                className="h-10 text-sm w-44 bg-background border-primary/20 hover:border-primary/50 transition-colors cursor-pointer" />
                                        </div>
                                        <div className="flex flex-wrap gap-2 flex-1 items-center bg-background/50 p-2 rounded-lg border border-border/50 min-h-[40px]">
                                            {activeRoute.schedule.specificDates.length === 0 && <p className="text-[10px] text-muted-foreground italic">No dates chosen. Please pick a date.</p>}
                                            {activeRoute.schedule.specificDates.map(d => (
                                                <Badge key={d} variant="default" className="text-xs py-1 px-2.5 gap-1.5 cursor-pointer bg-primary/15 text-primary hover:bg-red-500/15 hover:text-red-500 hover:border-red-500/30 transition-all border border-primary/20 group"
                                                    onClick={() => removeDate(activeRouteIdx, d)}>
                                                    {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeRoute.schedule.type === 'daily' && (
                                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                                    <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> This route will run every single day automatically.
                                    </p>
                                </div>
                            )}

                            {/* Time Selection */}
                            <div className="flex gap-4 pt-2 border-t border-border/50">
                                <div className="space-y-1.5 flex-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Start Time</Label>
                                    <Input type="time"
                                        value={activeRoute.schedule.startTime || ''}
                                        onChange={e => updateRoute(activeRouteIdx, { schedule: { ...activeRoute.schedule, startTime: e.target.value } })}
                                        className="h-9 text-sm w-full bg-background" />
                                </div>
                                <div className="space-y-1.5 flex-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">End Time</Label>
                                    <Input type="time"
                                        value={activeRoute.schedule.endTime || ''}
                                        onChange={e => updateRoute(activeRouteIdx, { schedule: { ...activeRoute.schedule, endTime: e.target.value } })}
                                        className="h-9 text-sm w-full bg-background" />
                                </div>
                            </div>
                        </div>

                        {/* Stops Header with Import */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                            <span className="text-xs font-bold text-foreground">Route Stops</span>
                            {pastBuses.filter(b => b.route?.stops?.length > 1).length > 0 && (
                                <Select onValueChange={(busId) => {
                                    const bus = pastBuses.find(b => b._id === busId);
                                    if (bus && bus.route?.stops) {
                                        updateRoute(activeRouteIdx, {
                                            label: bus.route.from && bus.route.to ? `${bus.route.from} to ${bus.route.to}` : activeRoute.label,
                                            stops: bus.route.stops.map((s: any) => ({
                                                name: s.name || '',
                                                time: s.arrivalTime || '',
                                                price: s.price || 0,
                                                distance: s.distance || 0
                                            }))
                                        });
                                        toast.success('Route imported successfully!');
                                    }
                                }}>
                                    <SelectTrigger className="h-8 text-xs w-[220px] bg-accent/5 border-accent/20 text-accent font-semibold hover:bg-accent/10 transition-colors">
                                        <SelectValue placeholder="Import from Past Buses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pastBuses.filter(b => b.route?.stops?.length > 1).map(bus => (
                                            <SelectItem key={bus._id} value={bus._id} className="text-xs">
                                                {bus.busNumber} ({bus.route?.from} → {bus.route?.to})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Stops */}
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {activeRoute.stops.map((stop, si) => (
                                <div key={si} className="flex items-start gap-2">
                                    <div className="flex flex-col items-center gap-0.5 shrink-0 pt-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border ${si === 0 ? 'bg-green-500/20 border-green-500 text-green-600 dark:text-green-400' :
                                            si === activeRoute.stops.length - 1 ? 'bg-red-500/20 border-red-500 text-red-600 dark:text-red-400' :
                                                'bg-primary/10 border-primary/30 text-primary'
                                            }`}>{si + 1}</div>
                                        {si < activeRoute.stops.length - 1 && <div className="w-px h-3 bg-border" />}
                                    </div>
                                    <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: si > 0 ? '1fr 1fr 1fr 1fr' : '2fr 1fr 1fr' }}>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Stop Name</Label>
                                            <Input value={stop.name} onChange={e => updateStop(activeRouteIdx, si, 'name', e.target.value)}
                                                placeholder={si === 0 ? 'Origin' : si === activeRoute.stops.length - 1 ? 'Destination' : `Stop ${si + 1}`}
                                                className="h-8 text-xs" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />{si === 0 ? 'Departure' : 'Arrival'}
                                            </Label>
                                            <Input type="time" value={stop.time} onChange={e => updateStop(activeRouteIdx, si, 'time', e.target.value)} className="h-8 text-xs" />
                                        </div>
                                        {si > 0 && (
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">Dist (km)</Label>
                                                <Input type="number" value={stop.distance || ''} min="0" step="0.1"
                                                    onChange={e => updateStop(activeRouteIdx, si, 'distance', e.target.value)}
                                                    placeholder="km" className="h-8 text-xs text-center" />
                                            </div>
                                        )}
                                        {si > 0 ? (
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">Fare (₹)</Label>
                                                <Input type="number" value={stop.price || ''} min="0"
                                                    onChange={e => updateStop(activeRouteIdx, si, 'price', e.target.value)}
                                                    placeholder="₹0" className="h-8 text-xs text-center" />
                                            </div>
                                        ) : <div />}
                                    </div>
                                    <div className="pt-7">
                                        {si > 0 && si < activeRoute.stops.length - 1 ? (
                                            <Button size="icon" variant="ghost" onClick={() => removeStop(activeRouteIdx, si)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        ) : <div className="w-7" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => addStop(activeRouteIdx)} className="w-full border-dashed text-primary hover:bg-primary/5">
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Stop
                        </Button>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-muted-foreground">{activeRoute.label}</p>
                                <p className="text-sm font-semibold">{activeRoute.stops[0]?.name || '—'} <ArrowRight className="inline w-3 h-3 mx-1" /> {activeRoute.stops[activeRoute.stops.length - 1]?.name || '—'}</p>
                            </div>
                            <div className="flex gap-4 text-right">
                                <div>
                                    <p className="text-[10px] text-muted-foreground">Total Distance</p>
                                    <p className="text-base font-bold text-primary">{activeRoute.stops.slice(1).reduce((s, st) => s + (Number(st.distance) || 0), 0).toFixed(1)} km</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground">Total Fare</p>
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{activeRoute.stops.slice(1).reduce((s, st) => s + (Number(st.price) || 0), 0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Seat Layout ── */}
                {step === 2 && renderGrid()}

                {/* ── STEP 3: Mode ── */}
                {step === 3 && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setIsPrivate(false)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${!isPrivate ? 'border-green-500 bg-green-500/10' : 'border-border bg-muted/30 hover:border-border/80'}`}>
                                <Globe className={`w-6 h-6 mb-2 ${!isPrivate ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                                <p className={`font-bold text-sm ${!isPrivate ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>Public</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Ticket booking enabled for all passengers.</p>
                            </button>
                            <button onClick={() => setIsPrivate(true)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${isPrivate ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:border-border/80'}`}>
                                <Lock className={`w-6 h-6 mb-2 ${isPrivate ? 'text-primary' : 'text-muted-foreground'}`} />
                                <p className={`font-bold text-sm ${isPrivate ? 'text-primary' : 'text-muted-foreground'}`}>Private</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Organization tracking only. No public booking.</p>
                            </button>
                        </div>
                        {isPrivate && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                                <Separator />
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Organization Details</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">State *</Label>
                                        <Select value={stateVal} onValueChange={setStateVal}>
                                            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                                            <SelectContent className="max-h-60">{INDIA_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">District *</Label>
                                        <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Kota" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Town / City</Label>
                                        <Input value={town} onChange={e => setTown(e.target.value)} placeholder="e.g. Kota City" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">PIN Code *</Label>
                                        <Input value={pinCode} onChange={e => setPinCode(e.target.value)} maxLength={6} placeholder="324001" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Organization Type *</Label>
                                        <Select value={orgCategory} onValueChange={setOrgCategory}>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                            <SelectContent>{ORG_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Organization Name *</Label>
                                        <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. RTU Kota" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 4: Review ── */}
                {step === 4 && (
                    <div className="bg-muted/40 rounded-xl p-4 space-y-3">
                        <RRow label="Bus Number" value={<span className="font-mono font-bold text-primary">{busNumber.toUpperCase()}</span>} />
                        {busName && <RRow label="Name" value={busName} />}
                        <RRow label="Type" value={<Badge variant="outline">{busType}</Badge>} />
                        <RRow label="Seats" value={
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                <span className="font-bold">{totalSeats} Total</span>
                                {(['women', 'elderly', 'disabled'] as SeatType[]).map(type => {
                                    const cnt = seatGrid.flat().filter(c => c.exists && c.type === type).length;
                                    return cnt > 0 ? (
                                        <Badge key={type} variant="outline" className={`text-[10px] px-1.5 h-5 flex items-center gap-0.5 ${SEAT_STYLES[type]}`}>
                                            {SEAT_LABELS[type]} {cnt}
                                        </Badge>
                                    ) : null;
                                })}
                            </div>
                        } />
                        <Separator />
                        <p className="text-xs font-semibold text-muted-foreground uppercase">{routes.length} Route{routes.length > 1 ? 's' : ''}</p>
                        {routes.map(r => {
                            const fare = r.stops.slice(1).reduce((s, st) => s + (Number(st.price) || 0), 0);
                            const sched = r.schedule.type === 'daily' ? 'Daily' : r.schedule.type === 'days' ? r.schedule.days.join(', ') : `${r.schedule.specificDates.length} date(s)`;
                            return (
                                <div key={r.id} className="bg-background border border-border rounded-xl p-3 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold">{r.label}</span>
                                        <div className="flex gap-1.5">
                                            <Badge variant="outline" className="text-[9px]">{sched}</Badge>
                                            <span className="text-xs font-bold text-green-600 dark:text-green-400">₹{fare}</span>
                                        </div>
                                    </div>
                                    {r.stops.map((s, si) => (
                                        <div key={si} className="flex items-center justify-between text-xs">
                                            <span className="text-foreground/70 flex items-center gap-1">
                                                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${si === 0 ? 'bg-green-500/20 text-green-600' : si === r.stops.length - 1 ? 'bg-red-500/20 text-red-600' : 'bg-primary/15 text-primary'}`}>{si + 1}</span>
                                                {s.name || `Stop ${si + 1}`}{s.time && <span className="text-muted-foreground ml-1">@ {s.time}</span>}
                                            </span>
                                            {si > 0 && <span className="text-green-600 dark:text-green-400 font-semibold">+₹{s.price}</span>}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                        <Separator />
                        <RRow label="Mode" value={isPrivate
                            ? <Badge className="bg-primary/15 text-primary border-primary/30 text-xs gap-1"><Lock className="w-2.5 h-2.5" />Private</Badge>
                            : <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 text-xs gap-1"><Globe className="w-2.5 h-2.5" />Public</Badge>}
                        />
                    </div>
                )}

                {/* ── STEP 5: Final Confirmation ── */}
                {step === 5 && (
                    <div className="space-y-4">
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                                <Bus className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold">Ready to Launch!</h3>
                            <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                                Please confirm all details below. Once registered, your bus will be <span className="text-green-600 font-bold">LIVE</span> and available for booking.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted/30 p-3 rounded-xl border border-border">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Fleet Info</p>
                                <p className="text-sm font-bold">{busNumber}</p>
                                <p className="text-[10px] text-muted-foreground">{busType} · {totalSeats} Seats</p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-xl border border-border">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Operations</p>
                                <p className="text-sm font-bold">{isPrivate ? 'Private' : 'Public'}</p>
                                <p className="text-[10px] text-muted-foreground">{routes.length} Service Route(s)</p>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Scheduled Departure</p>
                                <p className="text-[10px] text-amber-600/80">
                                    Initial service starts from {routes[0]?.stops[0]?.name || 'Origin'} at {routes[0]?.stops[0]?.time || '--:--'}.
                                </p>
                            </div>
                        </div>

                        <Separator />
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span>Reserved seats logic enabled (Auto-release 48h before trip)</span>
                        </div>
                    </div>
                )}

                {/* ── STEP 6: Success ── */}
                {step === 6 && createdBus && (
                    <div className="space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-lg font-bold">{createdBus.busNumber}</p>
                            <p className="text-xs text-muted-foreground">{createdBus.name} · {createdBus.type} · {createdBus.totalSeats} Seats</p>
                        </div>
                        {createdBus.isPrivate && (
                            <div className="space-y-3 text-left">
                                <Separator />
                                <p className="text-xs font-semibold text-destructive text-center">⚠️ Save These Codes — Not Shown Again!</p>
                                <CodeBox label="Access Code" icon={<Lock className="w-2.5 h-2.5" />} code={createdBus.accessCode} onCopy={() => copy(createdBus.accessCode, 'Access Code')} hint="For location tracking — share with authorized people" />
                                <CodeBox label="Employee Code" icon={<Users className="w-2.5 h-2.5" />} code={createdBus.employeeCode} onCopy={() => copy(createdBus.employeeCode, 'Employee Code')} hint="For driver to activate live location sharing" green />
                            </div>
                        )}
                        {!createdBus.isPrivate && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3"><p className="text-xs text-green-700 dark:text-green-400">✅ Bus is <strong>public</strong>. Passengers can find and book tickets!</p></div>}
                        <Button onClick={handleClose} className="w-full">Done — Go to Fleet</Button>
                    </div>
                )}

                {/* Navigation */}
                {step < 6 && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
                        {step > 0 && <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="text-muted-foreground"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>}
                        <div className="flex-1" />
                        {step < 5
                            ? <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>{step === 4 ? 'Confirm & Continue' : 'Next'}<ChevronRight className="w-4 h-4 ml-1" /></Button>
                            : <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white min-w-[140px] shadow-lg shadow-green-500/20 animate-pulse-slow">
                                {loading ? 'Launching...' : '🚀 Make Bus Live'}
                            </Button>
                        }
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GridSeatCell({ cell, displayNum, onAssign, onToggle }: {
    cell: GridCell;
    displayNum: number | null;
    onAssign: () => void;
    onToggle: (e: React.MouseEvent) => void;
}) {
    if (!cell.exists) {
        return (
            <button onContextMenu={onToggle} title="Empty slot — right-click to restore"
                className="w-8 h-8 rounded-md border-2 border-dashed border-border/30 flex items-center justify-center text-[10px] text-muted-foreground/20 hover:border-border hover:text-muted-foreground/50 transition-all">
                ·
            </button>
        );
    }
    return (
        <button onClick={onAssign} onContextMenu={onToggle}
            title="Left-click: assign type | Right-click: remove"
            className={`w-8 h-8 rounded-md border-2 text-[9px] font-bold flex items-center justify-center transition-all select-none ${SEAT_STYLES[cell.type]}`}>
            {/* We show type indicator instead of seat number to keep it clean */}
            {cell.type === 'women' ? '♀' : cell.type === 'elderly' ? '↑' : cell.type === 'disabled' ? '♿' : '·'}
        </button>
    );
}

function RRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}

function CodeBox({ label, icon, code, onCopy, hint, green }: {
    label: string; icon: React.ReactNode; code: string; onCopy: () => void; hint: string; green?: boolean;
}) {
    return (
        <div className="bg-muted/50 border border-border rounded-xl p-3">
            <p className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 ${green ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>{icon} {label}</p>
            <div className="flex items-center gap-2">
                <code className={`flex-1 bg-background rounded-lg px-3 py-2 font-mono text-sm tracking-widest font-bold ${green ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>{code}</code>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCopy}><Copy className="w-3.5 h-3.5" /></Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>
        </div>
    );
}
