import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { cleanDatabase, createMovieWithShow } from "./helpers/db";
import { signupCustomer } from "./helpers/auth";

const app = createApp();

beforeEach(async () => {
  await cleanDatabase();
});

describe("seat map", () => {
  it("shows an 80 seat grid with all seats available for a brand new show", async () => {
    const { show } = await createMovieWithShow();

    const response = await request(app).get(`/api/shows/${show.id}/seats`);

    expect(response.status).toBe(200);
    expect(response.body.seats).toHaveLength(80);
    expect(response.body.seats.every((seat: { status: string }) => seat.status === "AVAILABLE")).toBe(true);
  });

  it("marks a held seat as HELD for other viewers", async () => {
    const { show } = await createMovieWithShow();
    const { cookie } = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", cookie).send({ seats: ["A1"] });

    const response = await request(app).get(`/api/shows/${show.id}/seats`);
    const seatA1 = response.body.seats.find((seat: { label: string }) => seat.label === "A1");

    expect(seatA1.status).toBe("HELD");
  });
});

describe("selecting and holding seats", () => {
  it("allows holding between 1 and 6 seats", async () => {
    const { show } = await createMovieWithShow();
    const { cookie } = await signupCustomer(app);

    const response = await request(app)
      .post(`/api/shows/${show.id}/hold`)
      .set("Cookie", cookie)
      .send({ seats: ["A1", "A2", "A3"] });

    expect(response.status).toBe(200);
    expect(response.body.hold.seats).toEqual(["A1", "A2", "A3"]);
    expect(response.body.hold.totalAmount).toBe(600);
  });

  it("rejects selecting more than 6 seats", async () => {
    const { show } = await createMovieWithShow();
    const { cookie } = await signupCustomer(app);

    const response = await request(app)
      .post(`/api/shows/${show.id}/hold`)
      .set("Cookie", cookie)
      .send({ seats: ["A1", "A2", "A3", "A4", "A5", "A6", "A7"] });

    expect(response.status).toBe(400);
  });

  it("requires authentication to hold seats", async () => {
    const { show } = await createMovieWithShow();

    const response = await request(app).post(`/api/shows/${show.id}/hold`).send({ seats: ["A1"] });

    expect(response.status).toBe(401);
  });

  it("rejects a hold when a seat was already taken by someone else", async () => {
    const { show } = await createMovieWithShow();
    const user1 = await signupCustomer(app);
    const user2 = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", user1.cookie).send({ seats: ["B5"] });

    const response = await request(app)
      .post(`/api/shows/${show.id}/hold`)
      .set("Cookie", user2.cookie)
      .send({ seats: ["B5", "B6"] });

    expect(response.status).toBe(409);
    expect(response.body.details).toContain("B5");
  });

  it("does not allow double booking when two users race for the same seat", async () => {
    const { show } = await createMovieWithShow();
    const user1 = await signupCustomer(app);
    const user2 = await signupCustomer(app);

    const [response1, response2] = await Promise.all([
      request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", user1.cookie).send({ seats: ["C1"] }),
      request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", user2.cookie).send({ seats: ["C1"] }),
    ]);

    const statuses = [response1.status, response2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const seat = await prisma.seat.findFirst({ where: { showId: show.id, rowLabel: "C", seatNumber: 1 } });
    expect(seat?.status).toBe("HELD");

    const winner = response1.status === 200 ? user1 : user2;
    expect(seat?.heldById).toBe(winner.user.id);
  });
});
