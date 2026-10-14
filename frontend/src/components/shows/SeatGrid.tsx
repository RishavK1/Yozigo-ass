import clsx from "clsx";
import type { Seat } from "@/types";

interface SeatGridProps {
  seats: Seat[];
  selectedLabels: string[];
  onToggleSeat?: (seat: Seat) => void;
  interactive?: boolean;
}

const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function seatClassName(seat: Seat, isSelected: boolean, interactive: boolean) {
  if (seat.status === "BOOKED") {
    return "bg-ink-700 text-ink-300 cursor-not-allowed";
  }
  if (seat.status === "HELD" && !seat.heldByMe) {
    return "bg-ink-200 text-ink-400 cursor-not-allowed";
  }
  if (seat.heldByMe || isSelected) {
    return "bg-brand-500 text-white border-brand-500";
  }
  return clsx(
    "border border-ink-300 text-ink-700 bg-white",
    interactive && "hover:border-brand-500 hover:text-brand-600 cursor-pointer",
  );
}

export function SeatGrid({ seats, selectedLabels, onToggleSeat, interactive = true }: SeatGridProps) {
  const seatsByRow = new Map<string, Seat[]>();
  for (const seat of seats) {
    const list = seatsByRow.get(seat.rowLabel) ?? [];
    list.push(seat);
    seatsByRow.set(seat.rowLabel, list);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full max-w-xl flex-col items-center gap-1">
        <div className="h-2 w-full max-w-md rounded-t-full bg-gradient-to-b from-ink-300 to-transparent" />
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-400">Screen this way</span>
      </div>

      <div className="flex flex-col gap-2 overflow-x-auto scrollbar-thin">
        {SEAT_ROWS.map((row) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-4 text-xs font-bold text-ink-400">{row}</span>
            <div className="flex gap-1.5">
              {(seatsByRow.get(row) ?? []).map((seat) => {
                const isSelected = selectedLabels.includes(seat.label);
                const disabled =
                  !interactive || seat.status === "BOOKED" || (seat.status === "HELD" && !seat.heldByMe);

                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggleSeat?.(seat)}
                    title={seat.label}
                    className={clsx(
                      "flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold transition-colors",
                      seatClassName(seat, isSelected, interactive),
                    )}
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
