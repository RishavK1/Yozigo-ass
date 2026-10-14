import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchAdminShows, fetchAdminMovies, createShow, deleteShow } from "@/api/admin.api";
import { getErrorMessage } from "@/api/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShowFormModal, type ShowFormValues } from "@/components/admin/ShowFormModal";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

export function AdminShowsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: shows, isLoading } = useQuery({
    queryKey: ["admin", "shows"],
    queryFn: fetchAdminShows,
  });

  const { data: movies } = useQuery({
    queryKey: ["admin", "movies"],
    queryFn: fetchAdminMovies,
  });

  const createMutation = useMutation({
    mutationFn: (values: ShowFormValues) =>
      createShow({ movieId: values.movieId, startAt: new Date(values.startAt).toISOString(), price: values.price }),
    onSuccess: () => {
      toast.success("Show added");
      queryClient.invalidateQueries({ queryKey: ["admin", "shows"] });
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not add show")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShow(id),
    onSuccess: () => {
      toast.success("Show deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "shows"] });
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not delete show")),
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete this show for "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <PageContainer className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900">Manage Shows</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add show</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16 text-brand-500">
          <Spinner size="lg" />
        </div>
      )}

      {shows && shows.length === 0 && (
        <EmptyState title="No shows scheduled" description="Add a show to start selling tickets." />
      )}

      {shows && shows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Movie</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Occupancy</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {shows.map((show) => (
                <tr key={show.id}>
                  <td className="px-4 py-3 font-semibold text-ink-900">{show.movie.title}</td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(show.startAt)}</td>
                  <td className="px-4 py-3 text-ink-600">{formatTime(show.startAt)}</td>
                  <td className="px-4 py-3 text-ink-600">{formatCurrency(show.price)}</td>
                  <td className="px-4 py-3 text-ink-600">
                    {show.bookedCount}/{show.totalSeats} ({show.percentFull}%)
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/shows/${show.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(show.id, show.movie.title)}>
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

      <ShowFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
        }}
        isSubmitting={createMutation.isPending}
        movies={movies ?? []}
      />
    </PageContainer>
  );
}
