import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { Movie } from "@/types";

const showFormSchema = z.object({
  movieId: z.string().min(1, "Select a movie"),
  startAt: z.string().min(1, "Select a date and time"),
  price: z.number().positive("Price must be greater than zero"),
});

export type ShowFormValues = z.infer<typeof showFormSchema>;

interface ShowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ShowFormValues) => Promise<void>;
  isSubmitting: boolean;
  movies: Movie[];
}

export function ShowFormModal({ isOpen, onClose, onSubmit, isSubmitting, movies }: ShowFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShowFormValues>({
    resolver: zodResolver(showFormSchema),
    defaultValues: { movieId: "", startAt: "", price: 200 },
  });

  const handleFormSubmit = async (values: ShowFormValues) => {
    await onSubmit(values);
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add a show">
      <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Movie</label>
          <select
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            {...register("movieId")}
          >
            <option value="">Select a movie</option>
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.title}
              </option>
            ))}
          </select>
          {errors.movieId && <p className="mt-1 text-xs text-red-600">{errors.movieId.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Date and time</label>
          <input
            type="datetime-local"
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            {...register("startAt")}
          />
          {errors.startAt && <p className="mt-1 text-xs text-red-600">{errors.startAt.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Ticket price (INR)</label>
          <input
            type="number"
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add show
          </Button>
        </div>
      </form>
    </Modal>
  );
}
