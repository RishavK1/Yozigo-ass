import { Link } from "react-router-dom";
import type { Movie } from "@/types";
import { formatDuration } from "@/utils/format";
import { RatingBadge } from "./RatingBadge";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-ink-100">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.src = "https://placehold.co/400x600?text=No+Poster";
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-bold text-ink-900">{movie.title}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
          <RatingBadge rating={movie.rating} />
          <span>{movie.language}</span>
          <span>&middot;</span>
          <span>{formatDuration(movie.durationMinutes)}</span>
        </div>
      </div>
    </Link>
  );
}
