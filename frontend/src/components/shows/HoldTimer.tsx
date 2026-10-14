import { useEffect, useRef } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/utils/format";

interface HoldTimerProps {
  heldUntil: string;
  onExpire?: () => void;
}

export function HoldTimer({ heldUntil, onExpire }: HoldTimerProps) {
  const remainingMs = useCountdown(heldUntil);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (remainingMs <= 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpire?.();
    }
  }, [remainingMs, onExpire]);

  const isUrgent = remainingMs < 60 * 1000;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold ${
        isUrgent ? "border-red-300 bg-red-50 text-red-700" : "border-brand-200 bg-brand-50 text-brand-700"
      }`}
    >
      <span>Seats held for</span>
      <span className="tabular-nums">{formatCountdown(remainingMs)}</span>
    </div>
  );
}
