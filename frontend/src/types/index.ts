export type Role = "CUSTOMER" | "ADMIN";

export type MovieRating = "U" | "UA" | "A";

export type SeatStatus = "AVAILABLE" | "HELD" | "BOOKED";

export type BookingStatus = "CONFIRMED" | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  language: string;
  durationMinutes: number;
  rating: MovieRating;
  description?: string | null;
}

export interface ShowSummary {
  id: string;
  startAt: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
}

export interface ShowsByDate {
  date: string;
  shows: ShowSummary[];
}

export interface MovieDetail extends Movie {
  showsByDate: ShowsByDate[];
}

export interface Seat {
  id: string;
  label: string;
  rowLabel: string;
  seatNumber: number;
  status: SeatStatus;
  heldByMe: boolean;
}

export interface SeatMapResponse {
  show: {
    id: string;
    startAt: string;
    endAt: string;
    price: number;
    movie: {
      id: string;
      title: string;
      durationMinutes: number;
    };
  };
  seats: Seat[];
}

export interface Hold {
  showId: string;
  seats: string[];
  heldUntil: string;
  totalAmount: number;
  pricePerSeat: number;
}

export interface BookingConfirmation {
  id: string;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  seats: string[];
  show: {
    id: string;
    startAt: string;
    price: number;
  };
  movie: {
    id: string;
    title: string;
    posterUrl: string;
    language: string;
  };
}

export interface PaymentResult {
  status: "confirmed" | "failed";
  booking?: BookingConfirmation;
  message?: string;
  heldUntil?: string;
  seats?: string[];
}

export interface BookingSummary {
  id: string;
  status: BookingStatus;
  totalAmount: number;
  createdAt: string;
  cancelledAt: string | null;
  seats: string[];
  show: {
    id: string;
    startAt: string;
  };
  movie: {
    id: string;
    title: string;
    posterUrl: string;
    language: string;
  };
}

export interface MyBookingsResponse {
  upcoming: BookingSummary[];
  past: BookingSummary[];
}

export interface AdminShow {
  id: string;
  startAt: string;
  endAt: string;
  price: number;
  movie: {
    id: string;
    title: string;
  };
  bookedCount: number;
  totalSeats: number;
  percentFull: number;
}

export interface AdminShowStats {
  show: {
    id: string;
    startAt: string;
    price: number;
    movie: { id: string; title: string };
  };
  bookedSeats: number;
  totalSeats: number;
  percentFull: number;
  totalRevenue: number;
}

export interface AdminShowBooking {
  id: string;
  status: BookingStatus;
  totalAmount: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  seats: string[];
}

export interface ApiErrorResponse {
  message: string;
  details?: unknown;
}
