import request from "supertest";
import { createApp } from "../src/app";
import { cleanDatabase } from "./helpers/db";
import { signupCustomer } from "./helpers/auth";

const app = createApp();

beforeEach(async () => {
  await cleanDatabase();
});

describe("signup", () => {
  it("creates a new account with a hashed password", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      name: "Jane Doe",
      email: "jane@test.com",
      password: "password123",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("jane@test.com");
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("rejects a signup with an email that already exists", async () => {
    await signupCustomer(app, { email: "duplicate@test.com" });

    const response = await request(app).post("/api/auth/signup").send({
      name: "Another User",
      email: "duplicate@test.com",
      password: "password123",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already exists/i);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      name: "Short Pass",
      email: "short@test.com",
      password: "short1",
    });

    expect(response.status).toBe(400);
  });
});

describe("login", () => {
  it("logs in with correct credentials", async () => {
    await signupCustomer(app, { email: "login@test.com", password: "password123" });

    const response = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("login@test.com");
  });

  it("rejects a wrong password without revealing which field was wrong", async () => {
    await signupCustomer(app, { email: "login2@test.com", password: "password123" });

    const response = await request(app).post("/api/auth/login").send({
      email: "login2@test.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Incorrect email or password");
  });

  it("rejects a login for an email that does not exist with the same generic message", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "doesnotexist@test.com",
      password: "whatever123",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Incorrect email or password");
  });
});

describe("protected routes", () => {
  it("rejects access to my bookings without a valid login", async () => {
    const response = await request(app).get("/api/bookings");
    expect(response.status).toBe(401);
  });

  it("allows access to my bookings with a valid login", async () => {
    const { cookie } = await signupCustomer(app);
    const response = await request(app).get("/api/bookings").set("Cookie", cookie);
    expect(response.status).toBe(200);
  });
});
