import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/config/prisma";
import { cleanDatabase, createMovieWithShow } from "./helpers/db";

const app = createApp();

beforeEach(async () => {
  await cleanDatabase();
});

describe("browsing movies and shows", () => {
  it("lists all movies with the required fields", async () => {
    await createMovieWithShow();

    const response = await request(app).get("/api/movies");

    expect(response.status).toBe(200);
    expect(response.body.movies).toHaveLength(1);
    const movie = response.body.movies[0];
    expect(movie).toMatchObject({
      title: "Test Movie",
      language: "English",
      durationMinutes: 120,
      rating: "UA",
    });
    expect(movie.posterUrl).toBeDefined();
  });

  it("only lists shows that have not already started, grouped by date", async () => {
    const { movie, show: futureShow } = await createMovieWithShow({
      startAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    const pastStart = new Date(Date.now() - 1000 * 60 * 60 * 5);
    const pastEnd = new Date(pastStart.getTime() + movie.durationMinutes * 60 * 1000);
    await prisma.show.create({
      data: { movieId: movie.id, startAt: pastStart, endAt: pastEnd, price: 180 },
    });

    const response = await request(app).get(`/api/movies/${movie.id}`);

    expect(response.status).toBe(200);
    const showIds = response.body.movie.showsByDate.flatMap((group: { shows: Array<{ id: string }> }) =>
      group.shows.map((show) => show.id),
    );
    expect(showIds).toContain(futureShow.id);
    expect(showIds).toHaveLength(1);
  });

  it("reports how many seats are still available for a show", async () => {
    const { movie, show } = await createMovieWithShow();

    const response = await request(app).get(`/api/movies/${movie.id}`);
    const shows = response.body.movie.showsByDate[0].shows;

    expect(shows[0].availableSeats).toBe(80);
    expect(shows[0].totalSeats).toBe(80);
  });

  it("returns 404 for a movie that does not exist", async () => {
    const response = await request(app).get("/api/movies/00000000-0000-0000-0000-000000000000");
    expect(response.status).toBe(404);
  });
});
