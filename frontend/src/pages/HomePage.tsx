import { useQuery } from "@tanstack/react-query";
import { fetchMovies } from "@/api/movies.api";
import { MovieCard } from "@/components/movies/MovieCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

export function HomePage() {
  const { data: movies, isLoading, isError } = useQuery({
    queryKey: ["movies"],
    queryFn: fetchMovies,
  });

  return (
    <div className="bg-ink-50 py-10">
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">Now Showing</h1>
          <p className="mt-1 text-sm text-ink-500">Book your tickets for the latest movies playing right now.</p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20 text-brand-500">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <EmptyState title="Could not load movies" description="Please refresh the page to try again." />
        )}

        {movies && movies.length === 0 && (
          <EmptyState
            title="No movies are playing right now"
            description="Please check back soon, new shows are added regularly."
          />
        )}

        {movies && movies.length > 0 && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
