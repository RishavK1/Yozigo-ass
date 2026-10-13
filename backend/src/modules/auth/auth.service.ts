import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { hashPassword, comparePassword } from "../../utils/password";
import { signAuthToken } from "../../utils/jwt";
import { LoginInput, SignupInput } from "./auth.schema";

function toSafeUser(user: { id: string; name: string; email: string; role: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function signupUser(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
  });

  const token = signAuthToken({ userId: user.id, role: user.role });
  return { token, user: toSafeUser(user) };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw ApiError.unauthorized("Incorrect email or password");
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized("Incorrect email or password");
  }

  const token = signAuthToken({ userId: user.id, role: user.role });
  return { token, user: toSafeUser(user) };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return toSafeUser(user);
}
