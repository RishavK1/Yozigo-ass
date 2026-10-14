import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminShowStats, fetchAdminShowBookings, fetchAdminShowSeatMap } from "@/api/admin.api";
import { PageContainer } from "@/components/layout/PageContainer";
import { SeatGrid } from "@/components/shows/SeatGrid";
import { SeatLegend } from "@/components/shows/SeatLegend";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

export function AdminShowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const showId = id as string;

  const statsQuery = useQuery({
    queryKey: ["admin", "shows", showId, "stats"],
    queryFn: () => fetchAdminShowStats(showId),
    enabled: Boolean(showId),
  });

  const bookingsQuery = useQuery({
    queryKey: ["admin", "shows", showId, "bookings"],
    queryFn: () => fetchAdminShowBookings(showId),
    enabled: Boolean(showId),
  });

  const seatMapQuery = useQuery({
    queryKey: ["admin", "shows", showId, "seats"],
    queryFn: () => fetchAdminShowSeatMap(showId),
    enabled: Boolean(showId),
  });

  if (statsQuery.isLoading || bookingsQuery.isLoading || seatMapQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-brand-500">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!statsQuery.data || !seatMapQuery.data) {
    return (
      <PageContainer className="py-16">
        <EmptyState title="Could not load this show" />
      </PageContainer>
    );
  }

  const stats = statsQuery.data;
  const bookings = bookingsQuery.data ?? [];

  return (
    <PageContainer className="py-10">
      <Link to="/admin/shows">
        <Button variant="ghost" size="sm">
          &larr; Back to all shows
        </Button>
      </Link>

      <div className="mt-2 mb-8">
        <h1 className="text-2xl font-extrabold text-ink-900">{stats.show.movie.title}</h1>
        <p className="text-sm text-ink-500">
          {formatDate(stats.show.startAt)} &middot; {formatTime(stats.show.startAt)} &middot;{" "}
          {formatCurrency(stats.show.price)} per seat
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <p className="text-xs uppercase text-ink-400">Seats booked</p>
          <p className="mt-1 text-2xl font-extrabold text-ink-900">
            {stats.bookedSeats}/{stats.totalSeats}
          </p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <p className="text-xs uppercase text-ink-400">Occupancy</p>
          <p className="mt-1 text-2xl font-extrabold text-ink-900">{stats.percentFull}%</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <p className="text-xs uppercase text-ink-400">Revenue collected</p>
          <p className="mt-1 text-2xl font-extrabold text-ink-900">{formatCurrency(stats.totalRevenue)}</p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-ink-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-500">Seat map</h2>
        <SeatGrid seats={seatMapQuery.data.seats} selectedLabels={[]} interactive={false} />
        <div className="mt-6">
          <SeatLegend />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-500">Bookings</h2>
        {bookings.length === 0 ? (
          <EmptyState title="No bookings yet for this show" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Booked at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 text-ink-500">{booking.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {booking.customerName}
                      <div className="text-xs text-ink-400">{booking.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{booking.seats.join(", ")}</td>
                    <td className="px-4 py-3 text-ink-600">{formatCurrency(booking.totalAmount)}</td>
                    <td className="px-4 py-3 text-ink-600">{booking.status}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {formatDate(booking.createdAt)} {formatTime(booking.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
