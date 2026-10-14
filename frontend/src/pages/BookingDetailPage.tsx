import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchBookingById } from "@/api/bookings.api";
import { PageContainer } from "@/components/layout/PageContainer";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => fetchBookingById(id as string),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-brand-500">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <PageContainer className="py-16">
        <EmptyState title="Booking not found" description="This booking does not exist or does not belong to you." />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-12">
      <div className="mx-auto max-w-lg rounded-2xl border border-ink-200 bg-white p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-ink-900">Booking details</h1>
          <Badge tone={booking.status === "CONFIRMED" ? "success" : "danger"}>{booking.status}</Badge>
        </div>

        <div className="mt-6 flex gap-4">
          <img
            src={booking.movie.posterUrl}
            alt={booking.movie.title}
            className="h-28 w-20 rounded-lg object-cover"
            onError={(event) => {
              event.currentTarget.src = "https://placehold.co/200x300?text=No+Poster";
            }}
          />
          <div>
            <h2 className="font-bold text-ink-900">{booking.movie.title}</h2>
            <p className="text-xs text-ink-500">{booking.movie.language}</p>
            <p className="mt-2 text-sm text-ink-600">{formatDate(booking.show.startAt)}</p>
            <p className="text-sm text-ink-600">{formatTime(booking.show.startAt)}</p>
          </div>
        </div>

        <div className="mt-6 space-y-2 rounded-xl bg-ink-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">Booking ID</span>
            <span className="font-semibold text-ink-900">{booking.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">Seats</span>
            <span className="font-semibold text-ink-900">{booking.seats.join(", ")}</span>
          </div>
          <div className="flex justify-between border-t border-ink-200 pt-2">
            <span className="text-ink-500">Amount</span>
            <span className="font-bold text-ink-900">{formatCurrency(booking.totalAmount)}</span>
          </div>
        </div>

        <div className="mt-6">
          <Link to="/my-bookings">
            <Button variant="outline">&larr; Back to my bookings</Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
