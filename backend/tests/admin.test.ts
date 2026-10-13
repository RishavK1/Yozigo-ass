import request from "supertest";
import { createApp } from "../src/app";
import { cleanDatabase, createMovieWithShow } from "./helpers/db";
import { signupCustomer, createAdminAndLogin } from "./helpers/auth";

const app = createApp();

beforeEach(async () => {
  await cleanDatabase();
});

const moviePayload = {
  title: "Admin Added Movie",
  posterUrl: "https://placehold.co/400x600",
  language: "English",
  durationMinutes: 110,
  rating: "U",
  description: "Added via admin API",
};

describe("admin access control", () => {
  it("rejects a customer trying to reach admin routes", async () => {
    const { cookie } = await signupCustomer(app);

    const response = await request(app).post("/api/admin/movies").set("Cookie", cookie).send(moviePayload);

    expect(response.status).toBe(403);
  });

  it("rejects unauthenticated requests to admin routes", async () => {
    const response = await request(app).get("/api/admin/movies");
    expect(response.status).toBe(401);
  });

  it("never creates an admin through the normal signup endpoint", async () => {
    const { user } = await signupCustomer(app);
    expect(user).not.toHaveProperty("role", "ADMIN");

    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });
});

describe("admin movie management", () => {
  it("allows an admin to create, update and delete a movie", async () => {
    const { cookie } = await createAdminAndLogin(app);

    const createResponse = await request(app).post("/api/admin/movies").set("Cookie", cookie).send(moviePayload);
    expect(createResponse.status).toBe(201);
    const movieId = createResponse.body.movie.id;

    const updateResponse = await request(app)
      .put(`/api/admin/movies/${movieId}`)
      .set("Cookie", cookie)
      .send({ title: "Updated Title" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.movie.title).toBe("Updated Title");

    const deleteResponse = await request(app).delete(`/api/admin/movies/${movieId}`).set("Cookie", cookie);
    expect(deleteResponse.status).toBe(204);
  });
});

describe("admin show management", () => {
  it("creates a show for a movie", async () => {
    const { cookie } = await createAdminAndLogin(app);
    const { movie } = await createMovieWithShow();

    const startAt = new Date(Date.now() + 1000 * 60 * 60 * 48);
    const response = await request(app)
      .post("/api/admin/shows")
      .set("Cookie", cookie)
      .send({ movieId: movie.id, startAt: startAt.toISOString(), price: 199 });

    expect(response.status).toBe(201);
  });

  it("rejects a show that overlaps an existing one", async () => {
    const { cookie } = await createAdminAndLogin(app);
    const startAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const { movie } = await createMovieWithShow({ startAt, durationMinutes: 120 });

    const overlappingStart = new Date(startAt.getTime() + 1000 * 60 * 30);
    const response = await request(app)
      .post("/api/admin/shows")
      .set("Cookie", cookie)
      .send({ movieId: movie.id, startAt: overlappingStart.toISOString(), price: 199 });

    expect(response.status).toBe(409);
  });

  it("refuses to delete a show that already has bookings", async () => {
    const { cookie } = await createAdminAndLogin(app);
    const { show } = await createMovieWithShow();
    const { cookie: customerCookie } = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", customerCookie).send({ seats: ["A1"] });
    await request(app)
      .post(`/api/shows/${show.id}/book`)
      .set("Cookie", customerCookie)
      .send({ paymentStatus: "success" });

    const response = await request(app).delete(`/api/admin/shows/${show.id}`).set("Cookie", cookie);
    expect(response.status).toBe(409);
  });

  it("reports booking stats for a show", async () => {
    const { cookie } = await createAdminAndLogin(app);
    const { show } = await createMovieWithShow({ price: 150 });
    const { cookie: customerCookie } = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", customerCookie).send({ seats: ["A1", "A2"] });
    await request(app)
      .post(`/api/shows/${show.id}/book`)
      .set("Cookie", customerCookie)
      .send({ paymentStatus: "success" });

    const response = await request(app).get(`/api/admin/shows/${show.id}/stats`).set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.stats.bookedSeats).toBe(2);
    expect(response.body.stats.totalRevenue).toBe(300);
  });
});
