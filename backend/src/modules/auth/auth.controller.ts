import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { setAuthCookie, clearAuthCookie } from "../../utils/cookies";
import { signupUser, loginUser, getCurrentUser } from "./auth.service";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { token, user } = await signupUser(req.body);
  setAuthCookie(res, token);
  res.status(201).json({ user, token });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { token, user } = await loginUser(req.body);
  setAuthCookie(res, token);
  res.status(200).json({ user, token });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.status(200).json({ message: "Logged out" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getCurrentUser(req.user!.id);
  res.status(200).json({ user });
});
