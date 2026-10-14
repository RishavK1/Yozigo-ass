import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMovieDetail } from "@/api/movies.api";
import { PageContainer } from "@/components/layout/PageContainer";
import { RatingBadge } from "@/components/movies/RatingBadge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDuration, formatTime, groupDateLabel } from "@/utils/format";

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const { data: movie, isLoading, isError } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => fetchMovieDetail(id as string),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-brand-500">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <PageContainer className="py-16">
        <EmptyState title="Movie not found" description="This movie may have been removed." />
      </PageContainer>
    );
  }

  const selectedDate = activeDate ?? movie.showsByDate[0]?.date ?? null;
  const activeGroup = movie.showsByDate.find((group) => group.date === selectedDate);

  return (
    <div className="bg-white py-10">
      <PageContainer>
        <div className="flex flex-col gap-8 md:flex-row">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-80 w-56 flex-shrink-0 self-center rounded-xl object-cover shadow-md md:self-start"
            onError={(event) => {
              event.currentTarget.src = "https://placehold.co/400x600?text=No+Poster";
            }}
          />

          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-ink-900">{movie.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-500">
              <RatingBadge rating={movie.rating} />
              <span>{movie.language}</span>
              <span>&middot;</span>
              <span>{formatDuration(movie.durationMinutes)}</span>
            </div>
            {movie.description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-600">{movie.description}</p>}

            <div className="mt-10">
              <h2 className="text-lg font-bold text-ink-900">Select a show</h2>

              {movie.showsByDate.length === 0 ? (
                <div className="mt-4">
                  <EmptyState title="No upcoming shows" description="Check back later for new showtimes." />
                </div>
              ) : (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {movie.showsByDate.map((group) => (
                      <button
                        key={group.date}
                        type="button"
                        onClick={() => setActiveDate(group.date)}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                          group.date === selectedDate
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-ink-200 text-ink-600 hover:border-brand-400"
                        }`}
                      >
                        {groupDateLabel(group.date)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {activeGroup?.shows.map((show) => (
                      <button
                        key={show.id}
                        type="button"
                        disabled={show.availableSeats === 0}
                        onClick={() => navigate(`/shows/${show.id}`)}
                        className="flex min-w-[130px] flex-col items-center gap-1 rounded-lg border border-ink-200 px-4 py-3 text-center transition-colors hover:border-brand-500 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-ink-200 disabled:hover:bg-transparent"
                      >
                        <span className="font-bold text-ink-900">{formatTime(show.startAt)}</span>
                        <span className="text-xs text-ink-500">{formatCurrency(show.price)}</span>
                        <span className="text-xs font-medium text-emerald-600">
                          {show.availableSeats === 0 ? "Sold out" : `${show.availableSeats} seats left`}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                      &larr; Back to all movies
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
