export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
export const SEATS_PER_ROW = 10;
export const TOTAL_SEATS = SEAT_ROWS.length * SEATS_PER_ROW;

export function buildSeatLabel(rowLabel: string, seatNumber: number): string {
  return `${rowLabel}${seatNumber}`;
}

export function parseSeatLabel(label: string): { rowLabel: string; seatNumber: number } | null {
  const match = /^([A-H])(10|[1-9])$/.exec(label.trim().toUpperCase());
  if (!match) return null;
  return { rowLabel: match[1], seatNumber: Number(match[2]) };
}

export function generateSeatGrid(): Array<{ rowLabel: string; seatNumber: number }> {
  const seats: Array<{ rowLabel: string; seatNumber: number }> = [];
  for (const row of SEAT_ROWS) {
    for (let seatNumber = 1; seatNumber <= SEATS_PER_ROW; seatNumber += 1) {
      seats.push({ rowLabel: row, seatNumber });
    }
  }
  return seats;
}
