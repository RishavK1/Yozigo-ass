import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminMovies, fetchAdminShows } from "@/api/admin.api";
import { PageContainer } from "@/components/layout/PageContainer";

export function AdminDashboardPage() {
  const { data: movies } = useQuery({ queryKey: ["admin", "movies"], queryFn: fetchAdminMovies });
  const { data: shows } = useQuery({ queryKey: ["admin", "shows"], queryFn: fetchAdminShows });

  const totalBookedSeats = shows?.reduce((sum, show) => sum + show.bookedCount, 0) ?? 0;

  return (
    <PageContainer className="py-10">
      <h1 className="mb-6 text-2xl font-extrabold text-ink-900">Admin Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <p className="text-xs uppercase text-ink-400">Movies</p>
          <p className="mt-1 text-2xl font-extrabold text-ink-900">{movies?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <p className="text-xs uppercase text-ink-400">Shows</p>
          <p className="mt-1 text-2xl font-extrabold text-ink-900">{shows?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <p className="text-xs uppercase text-ink-400">Seats booked overall</p>
          <p className="mt-1 text-2xl font-extrabold text-ink-900">{totalBookedSeats}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Link
          to="/admin/movies"
          className="rounded-xl border border-ink-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="font-bold text-ink-900">Manage Movies</h2>
          <p className="mt-1 text-sm text-ink-500">Add, edit or remove movies playing at the cinema.</p>
        </Link>

        <Link
          to="/admin/shows"
          className="rounded-xl border border-ink-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="font-bold text-ink-900">Manage Shows</h2>
          <p className="mt-1 text-sm text-ink-500">Schedule showtimes and see how full each show is.</p>
        </Link>
      </div>
    </PageContainer>
  );
}
