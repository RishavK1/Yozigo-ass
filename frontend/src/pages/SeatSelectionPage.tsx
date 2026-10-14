import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchSeatMap, fetchActiveHold, holdSeats, payForBooking } from "@/api/shows.api";
import { getErrorDetails, getErrorMessage } from "@/api/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { SeatGrid } from "@/components/shows/SeatGrid";
import { SeatLegend } from "@/components/shows/SeatLegend";
import { HoldTimer } from "@/components/shows/HoldTimer";
import { PaymentModal } from "@/components/shows/PaymentModal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Seat } from "@/types";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

const MAX_SEATS = 6;

type Step = "selecting" | "held" | "paymentFailed" | "confirmed";

export function SeatSelectionPage() {
  const { id } = useParams<{ id: string }>();
  const showId = id as string;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("selecting");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [heldUntil, setHeldUntil] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Awaited<ReturnType<typeof payForBooking>>["booking"] | null>(
    null,
  );

  const seatMapQuery = useQuery({
    queryKey: ["seatMap", showId],
    queryFn: () => fetchSeatMap(showId),
    enabled: Boolean(showId),
    refetchInterval: step === "confirmed" ? false : 4000,
  });

  const holdQuery = useQuery({
    queryKey: ["hold", showId],
    queryFn: () => fetchActiveHold(showId),
    enabled: Boolean(showId),
  });

  useEffect(() => {
    if (holdQuery.data && step === "selecting") {
      setSelectedSeats(holdQuery.data.seats);
      setHeldUntil(holdQuery.data.heldUntil);
      setStep("held");
    }
  }, [holdQuery.data, step]);

  const holdMutation = useMutation({
    mutationFn: () => holdSeats(showId, selectedSeats),
    onSuccess: (hold) => {
      setHeldUntil(hold.heldUntil);
      setStep("held");
      queryClient.invalidateQueries({ queryKey: ["seatMap", showId] });
    },
    onError: (error) => {
      const details = getErrorDetails(error);
      const message = getErrorMessage(error, "Could not hold your seats");
      toast.error(details.length > 0 ? `${message}: ${details.join(", ")}` : message);
      queryClient.invalidateQueries({ queryKey: ["seatMap", showId] });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (paymentStatus: "success" | "failure") => payForBooking(showId, paymentStatus),
    onSuccess: (result) => {
      if (result.status === "confirmed" && result.booking) {
        setConfirmation(result.booking);
        setStep("confirmed");
        setIsPaymentModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ["seatMap", showId] });
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        toast.success("Booking confirmed!");
      } else {
        setStep("paymentFailed");
        setIsPaymentModalOpen(false);
        toast.error("Payment failed");
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Payment could not be processed"));
      setIsPaymentModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["seatMap", showId] });
      setStep("selecting");
      setSelectedSeats([]);
      setHeldUntil(null);
    },
  });

  const handleToggleSeat = (seat: Seat) => {
    if (step !== "selecting") return;

    setSelectedSeats((previous) => {
      if (previous.includes(seat.label)) {
        return previous.filter((label) => label !== seat.label);
      }
      if (previous.length >= MAX_SEATS) {
        toast.error(`You can only select up to ${MAX_SEATS} seats at a time`);
        return previous;
      }
      return [...previous, seat.label];
    });
  };

  const handleHoldExpired = () => {
    toast.error("Your seat hold has expired, please select your seats again");
    setStep("selecting");
    setSelectedSeats([]);
    setHeldUntil(null);
    queryClient.invalidateQueries({ queryKey: ["seatMap", showId] });
    queryClient.invalidateQueries({ queryKey: ["hold", showId] });
  };

  const totalAmount = useMemo(() => {
    const price = seatMapQuery.data?.show.price ?? 0;
    return price * selectedSeats.length;
  }, [seatMapQuery.data, selectedSeats.length]);

  if (seatMapQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-brand-500">
        <Spinner size="lg" />
      </div>
    );
  }

  if (seatMapQuery.isError || !seatMapQuery.data) {
    return (
      <PageContainer className="py-16">
        <EmptyState title="Could not load this show" description="Please go back and try again." />
      </PageContainer>
    );
  }

  const { show, seats } = seatMapQuery.data;

  if (step === "confirmed" && confirmation) {
    return (
      <PageContainer className="py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white">
            ✓
          </div>
          <h1 className="text-xl font-bold text-ink-900">Booking confirmed</h1>
          <p className="mt-1 text-sm text-ink-500">Booking ID: {confirmation.id}</p>

          <div className="mt-6 space-y-2 rounded-xl bg-white p-5 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Movie</span>
              <span className="font-semibold text-ink-900">{confirmation.movie.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Date</span>
              <span className="font-semibold text-ink-900">{formatDate(confirmation.show.startAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Time</span>
              <span className="font-semibold text-ink-900">{formatTime(confirmation.show.startAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Seats</span>
              <span className="font-semibold text-ink-900">{confirmation.seats.join(", ")}</span>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-2">
              <span className="text-ink-500">Amount paid</span>
              <span className="font-bold text-ink-900">{formatCurrency(confirmation.totalAmount)}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Link to="/my-bookings">
              <Button variant="primary">View my bookings</Button>
            </Link>
            <Link to="/">
              <Button variant="outline">Back to home</Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="bg-white py-8">
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-ink-900">{show.movie.title}</h1>
          <p className="text-sm text-ink-500">
            {formatDate(show.startAt)} &middot; {formatTime(show.startAt)} &middot; {formatCurrency(show.price)} per
            seat
          </p>
        </div>

        {step === "held" && heldUntil && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ink-50 p-4">
            <HoldTimer heldUntil={heldUntil} onExpire={handleHoldExpired} />
            {step === "held" && (
              <p className="text-sm text-ink-500">Complete your payment before the timer runs out.</p>
            )}
          </div>
        )}

        {step === "paymentFailed" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Payment failed. Your seats are still held, you can try the payment again before the timer expires.
          </div>
        )}

        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <SeatGrid
            seats={seats}
            selectedLabels={selectedSeats}
            onToggleSeat={handleToggleSeat}
            interactive={step === "selecting"}
          />
          <div className="mt-8">
            <SeatLegend />
          </div>
        </div>

        <div className="sticky bottom-0 mt-6 flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="text-ink-500">
              Selected seats: <span className="font-semibold text-ink-900">{selectedSeats.join(", ") || "None"}</span>
            </p>
            <p className="text-ink-500">
              Total: <span className="font-semibold text-ink-900">{formatCurrency(totalAmount)}</span>
            </p>
          </div>

          {step === "selecting" && (
            <Button
              size="lg"
              disabled={selectedSeats.length === 0}
              isLoading={holdMutation.isPending}
              onClick={() => holdMutation.mutate()}
            >
              Continue
            </Button>
          )}

          {(step === "held" || step === "paymentFailed") && (
            <Button size="lg" onClick={() => setIsPaymentModalOpen(true)}>
              {step === "paymentFailed" ? "Try again" : "Pay"}
            </Button>
          )}
        </div>

        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            &larr; Back
          </Button>
        </div>
      </PageContainer>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        seats={selectedSeats}
        totalAmount={totalAmount}
        isProcessing={paymentMutation.isPending}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => paymentMutation.mutate("success")}
        onFailure={() => paymentMutation.mutate("failure")}
      />
    </div>
  );
}
