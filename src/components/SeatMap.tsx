import { useState } from "react";

export type SeatStatus = "Available" | "Booked" | "Cash" | "Selected" | "Women" | "Elderly" | "Disabled";
export type ReservedFor = "general" | "women" | "elderly" | "disabled";

export interface Seat {
    number: number;
    status: SeatStatus;
    reservedFor: ReservedFor;
}

interface SeatMapProps {
    seats: Seat[];
    selectedSeats?: number[];
    onSelect?: (seatNumber: number) => void;
    readOnly?: boolean;
    columns?: number;
}

const getSeatColor = (seat: Seat, selected: boolean): string => {
    if (selected) return "bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105";
    if (seat.status === "Booked") return "bg-red-100 border-red-300 text-red-400 cursor-not-allowed";
    if (seat.status === "Cash") return "bg-orange-100 border-orange-300 text-orange-500 cursor-not-allowed";
    if (seat.reservedFor === "women") return "bg-pink-50 border-pink-300 text-pink-600 hover:bg-pink-100";
    if (seat.reservedFor === "elderly") return "bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100";
    if (seat.reservedFor === "disabled") return "bg-purple-50 border-purple-300 text-purple-600 hover:bg-purple-100";
    return "bg-green-50 border-green-300 text-green-700 hover:bg-green-100";
};

const getSeatIcon = (seat: Seat, selected: boolean): string => {
    if (selected) return "✓";
    if (seat.status === "Booked") return "✗";
    if (seat.status === "Cash") return "₹";
    if (seat.reservedFor === "women") return "♀";
    if (seat.reservedFor === "elderly") return "👴";
    if (seat.reservedFor === "disabled") return "♿";
    return seat.number.toString();
};

export default function SeatMap({ seats, selectedSeats = [], onSelect, readOnly = false, columns = 4 }: SeatMapProps) {
    const isSelectable = (seat: Seat) => {
        if (readOnly) return false;
        if (seat.status === "Booked" || seat.status === "Cash") return false;
        return true;
    };

    const rows: Seat[][] = [];
    for (let i = 0; i < seats.length; i += columns) {
        rows.push(seats.slice(i, i + columns));
    }

    return (
        <div className="select-none">
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mb-4 text-[10px] font-black ">
                {[
                    { color: "bg-green-100 border-green-300", label: "Available" },
                    { color: "bg-red-100 border-red-300", label: "Booked" },
                    { color: "bg-orange-100 border-orange-300", label: "Cash" },
                    { color: "bg-pink-100 border-pink-300", label: "Women" },
                    { color: "bg-blue-100 border-blue-300", label: "Elderly" },
                    { color: "bg-purple-100 border-purple-300", label: "Disabled" },
                    { color: "bg-primary border-primary", label: "Selected" },
                ].map((l, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-sm border ${l.color}`} />
                        <span className="text-slate-500">{l.label}</span>
                    </div>
                ))}
            </div>

            {/* Bus front indicator */}
            <div className="flex items-center justify-center mb-3">
                <div className="bg-slate-800 text-white text-[9px] font-black px-6 py-1.5 rounded-full">
                    🚌 Front / Driver
                </div>
            </div>

            {/* Seat grid */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200">
                <div className="space-y-2">
                    {rows.map((row, ri) => (
                        <div key={ri} className="flex gap-2 justify-center">
                            {row.map((seat, si) => {
                                const isSelected = selectedSeats.includes(seat.number);
                                const selectable = isSelectable(seat);
                                // Add aisle gap after 2nd column
                                const withAisle = columns === 4 && si === 1;
                                return (
                                    <div key={seat.number} className={`flex ${withAisle ? "mr-4" : ""}`}>
                                        <button
                                            type="button"
                                            disabled={!selectable}
                                            onClick={() => selectable && onSelect?.(seat.number)}
                                            className={`
                                                w-10 h-10 rounded-xl border-2 text-[10px] font-black transition-all duration-150
                                                ${getSeatColor(seat, isSelected)}
                                                ${selectable ? "cursor-pointer" : "cursor-not-allowed opacity-80"}
                                            `}
                                            title={`Seat ${seat.number} — ${seat.reservedFor !== "general" ? seat.reservedFor + " reserved · " : ""}${seat.status}`}
                                        >
                                            {getSeatIcon(seat, isSelected)}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {selectedSeats.length > 0 && (
                <p className="mt-3 text-center text-xs font-bold text-primary">
                    Selected: Seat{selectedSeats.length > 1 ? "s" : ""} {selectedSeats.join(", ")}
                </p>
            )}
        </div>
    );
}

// Helper to generate a demo seat array
export function generateSeats(total: number): Seat[] {
    return Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        let reservedFor: ReservedFor = "general";
        if (n <= 4) reservedFor = "women";
        else if (n === total || n === total - 1) reservedFor = "elderly";
        else if (n === 5) reservedFor = "disabled";
        return { number: n, status: "Available", reservedFor };
    });
}
