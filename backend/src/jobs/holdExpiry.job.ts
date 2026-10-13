import { prisma } from "../config/prisma";

const CLEANUP_INTERVAL_MS = 15 * 1000;

async function releaseExpiredHolds() {
  await prisma.seat.updateMany({
    where: { status: "HELD", heldUntil: { lt: new Date() } },
    data: { status: "AVAILABLE", heldById: null, heldUntil: null },
  });
}

export function startHoldExpiryJob() {
  const timer = setInterval(() => {
    releaseExpiredHolds().catch((error) => {
      console.error("Failed to release expired seat holds", error);
    });
  }, CLEANUP_INTERVAL_MS);

  timer.unref();
  return timer;
}
