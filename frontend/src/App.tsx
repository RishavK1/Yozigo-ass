import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { HomePage } from "@/pages/HomePage";
import { MovieDetailPage } from "@/pages/MovieDetailPage";
import { SeatSelectionPage } from "@/pages/SeatSelectionPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { MyBookingsPage } from "@/pages/MyBookingsPage";
import { BookingDetailPage } from "@/pages/BookingDetailPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminMoviesPage } from "@/pages/admin/AdminMoviesPage";
import { AdminShowsPage } from "@/pages/admin/AdminShowsPage";
import { AdminShowDetailPage } from "@/pages/admin/AdminShowDetailPage";

export function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies/:id" element={<MovieDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/shows/:id" element={<SeatSelectionPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/movies" element={<AdminMoviesPage />} />
              <Route path="/admin/shows" element={<AdminShowsPage />} />
              <Route path="/admin/shows/:id" element={<AdminShowDetailPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
    </BrowserRouter>
  );
}
