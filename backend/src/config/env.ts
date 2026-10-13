import dotenv from "dotenv";
import path from "path";

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(__dirname, "../../", envFile), override: true });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "2h",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  seatHoldMinutes: Number(process.env.SEAT_HOLD_MINUTES ?? 5),
  cancellationCutoffHours: Number(process.env.CANCELLATION_CUTOFF_HOURS ?? 2),
};
