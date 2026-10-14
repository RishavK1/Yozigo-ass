import { Link } from "react-router-dom";
import type { BookingSummary } from "@/types";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface BookingCardProps {
  booking: BookingSummary;
  canCancel: boolean;
  onCancel?: (bookingId: string) => void;
  isCancelling?: boolean;
}

export function BookingCard({ booking, canCancel, onCancel, isCancelling }: BookingCardProps) {
  const statusTone = booking.status === "CONFIRMED" ? "success" : "danger";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-5 sm:flex-row">
      <img
        src={booking.movie.posterUrl}
        alt={booking.movie.title}
        className="h-32 w-24 flex-shrink-0 self-center rounded-lg object-cover sm:self-start"
        onError={(event) => {
          event.currentTarget.src = "https://placehold.co/200x300?text=No+Poster";
        }}
      />

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-ink-900">{booking.movie.title}</h3>
            <p className="text-xs text-ink-500">{booking.movie.language}</p>
          </div>
          <Badge tone={statusTone}>{booking.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-ink-600 sm:grid-cols-4">
          <div>
            <p className="text-xs text-ink-400">Date</p>
            <p className="font-medium">{formatDate(booking.show.startAt)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Time</p>
            <p className="font-medium">{formatTime(booking.show.startAt)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Seats</p>
            <p className="font-medium">{booking.seats.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Amount</p>
            <p className="font-medium">{formatCurrency(booking.totalAmount)}</p>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-ink-400">Booking ID: {booking.id}</p>
          <div className="flex gap-2">
            <Link to={`/bookings/${booking.id}`} className="text-xs font-semibold text-brand-600 hover:underline">
              View details
            </Link>
            {canCancel && booking.status === "CONFIRMED" && (
              <Button variant="outline" size="sm" onClick={() => onCancel?.(booking.id)} isLoading={isCancelling}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
