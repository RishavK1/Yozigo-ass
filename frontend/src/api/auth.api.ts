import { apiClient } from "./client";
import type { User } from "@/types";

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function signup(payload: SignupPayload): Promise<User> {
  const response = await apiClient.post<{ user: User }>("/auth/signup", payload);
  return response.data.user;
}

export async function login(payload: LoginPayload): Promise<User> {
  const response = await apiClient.post<{ user: User }>("/auth/login", payload);
  return response.data.user;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function fetchCurrentUser(): Promise<User> {
  const response = await apiClient.get<{ user: User }>("/auth/me");
  return response.data.user;
}
