import axios, { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types";
import { queryClient } from "@/lib/queryClient";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config?.url !== "/auth/me") {
      queryClient.setQueryData(["auth", "me"], null);
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = "Something went wrong, please try again"): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return axiosError.response?.data?.message ?? fallback;
  }
  return fallback;
}

export function getErrorDetails(error: unknown): string[] {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const details = axiosError.response?.data?.details;
    if (Array.isArray(details)) {
      return details.map((item) =>
        typeof item === "string" ? item : (item as { message?: string }).message ?? JSON.stringify(item),
      );
    }
  }
  return [];
}
