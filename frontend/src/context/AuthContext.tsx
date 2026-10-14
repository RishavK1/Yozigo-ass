import { createContext, useCallback, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest, signup as signupRequest } from "@/api/auth.api";
import type { LoginPayload, SignupPayload } from "@/api/auth.api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  signup: (payload: SignupPayload) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });

  const login = useCallback(
    async (payload: LoginPayload) => {
      const loggedInUser = await loginRequest(payload);
      queryClient.setQueryData(["auth", "me"], loggedInUser);
      return loggedInUser;
    },
    [queryClient],
  );

  const signup = useCallback(
    async (payload: SignupPayload) => {
      const newUser = await signupRequest(payload);
      queryClient.setQueryData(["auth", "me"], newUser);
      return newUser;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user: user ?? null, isLoading, login, signup, logout }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
