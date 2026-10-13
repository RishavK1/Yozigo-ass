import request from "supertest";
import { Express } from "express";
import { prisma } from "../../src/config/prisma";
import { hashPassword } from "../../src/utils/password";

export async function signupCustomer(
  app: Express,
  overrides?: { name?: string; email?: string; password?: string },
) {
  const payload = {
    name: overrides?.name ?? "Test User",
    email: overrides?.email ?? `user${Date.now()}${Math.random()}@test.com`,
    password: overrides?.password ?? "password123",
  };

  const response = await request(app).post("/api/auth/signup").send(payload);
  const cookie = response.headers["set-cookie"];
  return { cookie, user: response.body.user as { id: string; email: string } };
}

export async function createAdminAndLogin(app: Express) {
  const email = `admin${Date.now()}${Math.random()}@test.com`;
  const password = "Admin@1234";
  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: { name: "Admin User", email, passwordHash, role: "ADMIN" },
  });

  const response = await request(app).post("/api/auth/login").send({ email, password });
  const cookie = response.headers["set-cookie"];
  return { cookie, user: response.body.user as { id: string; email: string } };
}
