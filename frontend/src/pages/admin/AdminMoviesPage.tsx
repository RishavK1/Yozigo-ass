import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  fetchAdminMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  type MovieFormInput,
} from "@/api/admin.api";
import { getErrorMessage } from "@/api/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { RatingBadge } from "@/components/movies/RatingBadge";
import { MovieFormModal, type MovieFormValues } from "@/components/admin/MovieFormModal";
import { formatDuration } from "@/utils/format";
import type { Movie } from "@/types";

export function AdminMoviesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  const { data: movies, isLoading } = useQuery({
    queryKey: ["admin", "movies"],
    queryFn: fetchAdminMovies,
  });

  const invalidateMovies = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "movies"] });
    queryClient.invalidateQueries({ queryKey: ["movies"] });
  };

  const createMutation = useMutation({
    mutationFn: (values: MovieFormInput) => createMovie(values),
    onSuccess: () => {
      toast.success("Movie added");
      invalidateMovies();
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not add movie")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<MovieFormInput> }) => updateMovie(id, values),
    onSuccess: () => {
      toast.success("Movie updated");
      invalidateMovies();
      setIsModalOpen(false);
      setEditingMovie(null);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not update movie")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMovie(id),
    onSuccess: () => {
      toast.success("Movie deleted");
      invalidateMovies();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not delete movie")),
  });

  const handleSubmit = async (values: MovieFormValues) => {
    if (editingMovie) {
      await updateMutation.mutateAsync({ id: editingMovie.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
  };

  const handleDelete = (movie: Movie) => {
    if (window.confirm(`Delete "${movie.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(movie.id);
    }
  };

  return (
    <PageContainer className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900">Manage Movies</h1>
        <Button
          onClick={() => {
            setEditingMovie(null);
            setIsModalOpen(true);
          }}
        >
          Add movie
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16 text-brand-500">
          <Spinner size="lg" />
        </div>
      )}

      {movies && movies.length === 0 && (
        <EmptyState title="No movies yet" description="Add your first movie to get started." />
      )}

      {movies && movies.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {movies.map((movie) => (
                <tr key={movie.id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{movie.title}</td>
                  <td className="px-4 py-3 text-ink-600">{movie.language}</td>
                  <td className="px-4 py-3 text-ink-600">{formatDuration(movie.durationMinutes)}</td>
                  <td className="px-4 py-3">
                    <RatingBadge rating={movie.rating} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingMovie(movie);
                          setIsModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(movie)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MovieFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMovie(null);
        }}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        initialMovie={editingMovie}
      />
    </PageContainer>
  );
}
