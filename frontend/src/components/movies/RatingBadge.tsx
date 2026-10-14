import { Badge } from "../ui/Badge";
import type { MovieRating } from "@/types";

const ratingTone: Record<MovieRating, "success" | "warning" | "danger"> = {
  U: "success",
  UA: "warning",
  A: "danger",
};

export function RatingBadge({ rating }: { rating: MovieRating }) {
  return <Badge tone={ratingTone[rating]}>{rating}</Badge>;
}
