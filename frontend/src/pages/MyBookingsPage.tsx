import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchMyBookings, cancelBooking } from "@/api/bookings.api";
import { getErrorMessage } from "@/api/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { BookingCard } from "@/components/bookings/BookingCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

export function MyBookingsPage() {
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchMyBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onMutate: (bookingId) => setCancellingId(bookingId),
    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not cancel this booking"));
    },
    onSettled: () => setCancellingId(null),
  });

  return (
    <div className="bg-ink-50 py-10">
      <PageContainer>
        <h1 className="mb-6 text-2xl font-extrabold text-ink-900">My Bookings</h1>

        {isLoading && (
          <div className="flex justify-center py-16 text-brand-500">
            <Spinner size="lg" />
          </div>
        )}

        {isError && <EmptyState title="Could not load your bookings" description="Please try again later." />}

        {data && (
          <div className="space-y-10">
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">Upcoming</h2>
              {data.upcoming.length === 0 ? (
                <EmptyState title="No upcoming bookings" description="Browse movies to book your next show." />
              ) : (
                <div className="space-y-4">
                  {data.upcoming.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      canCancel
                      onCancel={(id) => cancelMutation.mutate(id)}
                      isCancelling={cancellingId === booking.id}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">Past</h2>
              {data.past.length === 0 ? (
                <EmptyState title="No past bookings yet" />
              ) : (
                <div className="space-y-4">
                  {data.past.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} canCancel={false} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
