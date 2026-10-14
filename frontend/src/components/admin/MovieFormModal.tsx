import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { Movie } from "@/types";

const movieFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  posterUrl: z.string().url("Enter a valid URL"),
  language: z.string().min(1, "Language is required"),
  durationMinutes: z.number().int().min(30, "Must be at least 30 minutes"),
  rating: z.enum(["U", "UA", "A"]),
  description: z.string().optional(),
});

export type MovieFormValues = z.infer<typeof movieFormSchema>;

interface MovieFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: MovieFormValues) => Promise<void>;
  isSubmitting: boolean;
  initialMovie?: Movie | null;
}

export function MovieFormModal({ isOpen, onClose, onSubmit, isSubmitting, initialMovie }: MovieFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieFormSchema),
    defaultValues: {
      title: "",
      posterUrl: "",
      language: "",
      durationMinutes: 120,
      rating: "U",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        initialMovie
          ? {
              title: initialMovie.title,
              posterUrl: initialMovie.posterUrl,
              language: initialMovie.language,
              durationMinutes: initialMovie.durationMinutes,
              rating: initialMovie.rating,
              description: initialMovie.description ?? "",
            }
          : {
              title: "",
              posterUrl: "",
              language: "",
              durationMinutes: 120,
              rating: "U",
              description: "",
            },
      );
    }
  }, [isOpen, initialMovie, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialMovie ? "Edit movie" : "Add a movie"} widthClassName="max-w-lg">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Title</label>
          <input
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            {...register("title")}
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Poster URL</label>
          <input
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="https://..."
            {...register("posterUrl")}
          />
          {errors.posterUrl && <p className="mt-1 text-xs text-red-600">{errors.posterUrl.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Language</label>
            <input
              className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              {...register("language")}
            />
            {errors.language && <p className="mt-1 text-xs text-red-600">{errors.language.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Duration (minutes)</label>
            <input
              type="number"
              className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              {...register("durationMinutes", { valueAsNumber: true })}
            />
            {errors.durationMinutes && <p className="mt-1 text-xs text-red-600">{errors.durationMinutes.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Rating</label>
          <select
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            {...register("rating")}
          >
            <option value="U">U</option>
            <option value="UA">UA</option>
            <option value="A">A</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">Description (optional)</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            {...register("description")}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialMovie ? "Save changes" : "Add movie"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
