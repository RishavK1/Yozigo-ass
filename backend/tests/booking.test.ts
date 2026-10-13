import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { cleanDatabase, createMovieWithShow } from "./helpers/db";
import { signupCustomer } from "./helpers/auth";

const app = createApp();

beforeEach(async () => {
  await cleanDatabase();
});

describe("paying for a booking", () => {
  it("confirms the booking and marks seats as booked on payment success", async () => {
    const { show } = await createMovieWithShow({ price: 250 });
    const { cookie } = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", cookie).send({ seats: ["D4", "D5"] });

    const response = await request(app)
      .post(`/api/shows/${show.id}/book`)
      .set("Cookie", cookie)
      .send({ paymentStatus: "success" });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("confirmed");
    expect(response.body.booking.seats).toEqual(["D4", "D5"]);
    expect(response.body.booking.totalAmount).toBe(500);

    const seats = await prisma.seat.findMany({
      where: { showId: show.id, rowLabel: "D", seatNumber: { in: [4, 5] } },
    });
    expect(seats.every((seat) => seat.status === "BOOKED")).toBe(true);
  });

  it("does not create a booking on payment failure and keeps the seats held", async () => {
    const { show } = await createMovieWithShow();
    const { cookie } = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", cookie).send({ seats: ["E1"] });

    const response = await request(app)
      .post(`/api/shows/${show.id}/book`)
      .set("Cookie", cookie)
      .send({ paymentStatus: "failure" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("failed");

    const bookingCount = await prisma.booking.count();
    expect(bookingCount).toBe(0);

    const seat = await prisma.seat.findFirst({ where: { showId: show.id, rowLabel: "E", seatNumber: 1 } });
    expect(seat?.status).toBe("HELD");
  });

  it("allows retrying payment after a failure while the hold is still valid", async () => {
    const { show } = await createMovieWithShow();
    const { cookie } = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", cookie).send({ seats: ["F1"] });
    await request(app).post(`/api/shows/${show.id}/book`).set("Cookie", cookie).send({ paymentStatus: "failure" });

    const response = await request(app)
      .post(`/api/shows/${show.id}/book`)
      .set("Cookie", cookie)
      .send({ paymentStatus: "success" });

    expect(response.status).toBe(201);
  });

  it("rejects payment when there is no active hold", async () => {
    const { show } = await createMovieWithShow();
    const { cookie } = await signupCustomer(app);

    const response = await request(app)
      .post(`/api/shows/${show.id}/book`)
      .set("Cookie", cookie)
      .send({ paymentStatus: "success" });

    expect(response.status).toBe(400);
  });

  it("rejects payment once the hold has expired", async () => {
    const { show } = await createMovieWithShow();
    const { cookie, user } = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", cookie).send({ seats: ["G1"] });

    await prisma.seat.updateMany({
      where: { showId: show.id, heldById: user.id },
      data: { heldUntil: new Date(Date.now() - 1000) },
    });

    const response = await request(app)
      .post(`/api/shows/${show.id}/book`)
      .set("Cookie", cookie)
      .send({ paymentStatus: "success" });

    expect(response.status).toBe(409);
  });
});

describe("my bookings", () => {
  it("lists a user's bookings and never exposes another user's bookings", async () => {
    const { show } = await createMovieWithShow();
    const user1 = await signupCustomer(app);
    const user2 = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", user1.cookie).send({ seats: ["H1"] });
    const bookingResponse = await request(app)
      .post(`/api/shows/${show.id}/book`)
      .set("Cookie", user1.cookie)
      .send({ paymentStatus: "success" });

    const bookingId = bookingResponse.body.booking.id;

    const myBookings = await request(app).get("/api/bookings").set("Cookie", user1.cookie);
    expect(myBookings.body.upcoming).toHaveLength(1);

    const otherUserBookings = await request(app).get("/api/bookings").set("Cookie", user2.cookie);
    expect(otherUserBookings.body.upcoming).toHaveLength(0);

    const directAccess = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Cookie", user2.cookie);
    expect(directAccess.status).toBe(404);

    const ownerAccess = await request(app).get(`/api/bookings/${bookingId}`).set("Cookie", user1.cookie);
    expect(ownerAccess.status).toBe(200);
  });
});

describe("cancelling a booking", () => {
  it("cancels an upcoming booking outside the cutoff window and frees the seats", async () => {
    const { show } = await createMovieWithShow({ startAt: new Date(Date.now() + 1000 * 60 * 60 * 24) });
    const { cookie } = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", cookie).send({ seats: ["A1"] });
    const bookingResponse = await request(app)
      .post(`/api/shows/${show.id}/book`)
      .set("Cookie", cookie)
      .send({ paymentStatus: "success" });

    const bookingId = bookingResponse.body.booking.id;

    const cancelResponse = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set("Cookie", cookie);

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.booking.status).toBe("CANCELLED");

    const seat = await prisma.seat.findFirst({ where: { showId: show.id, rowLabel: "A", seatNumber: 1 } });
    expect(seat?.status).toBe("AVAILABLE");
  });

  it("rejects cancellation within the cutoff window before the show", async () => {
    const { show } = await createMovieWithShow({ startAt: new Date(Date.now() + 1000 * 60 * 60 * 24) });
    const { cookie } = await signupCustomer(app);

    await request(app).post(`/api/shows/${show.id}/hold`).set("Cookie", cookie).send({ seats: ["A2"] });
    const bookingResponse = await request(app)
      .post(`/api/shows/${show.id}/book`)
      .set("Cookie", cookie)
      .send({ paymentStatus: "success" });

    await prisma.show.update({
      where: { id: show.id },
      data: { startAt: new Date(Date.now() + 1000 * 60 * 30) },
    });

    const cancelResponse = await request(app)
      .post(`/api/bookings/${bookingResponse.body.booking.id}/cancel`)
      .set("Cookie", cookie);

    expect(cancelResponse.status).toBe(400);
  });
});
