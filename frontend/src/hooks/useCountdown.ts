import { useEffect, useState } from "react";

export function useCountdown(targetTime: string | null): number {
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    targetTime ? new Date(targetTime).getTime() - Date.now() : 0,
  );

  useEffect(() => {
    if (!targetTime) {
      setRemainingMs(0);
      return;
    }

    const target = new Date(targetTime).getTime();
    setRemainingMs(target - Date.now());

    const interval = setInterval(() => {
      setRemainingMs(target - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  return Math.max(0, remainingMs);
}
