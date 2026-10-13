# yozigo backend

Express + TypeScript + PostgreSQL (Prisma) API for the yozigo movie ticket booking app.

See the root [`README.md`](../README.md) for full setup instructions, seeded accounts, the database design and the double-booking write-up.

## Quick start

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the API with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run prisma:migrate` | Apply Prisma migrations (dev) |
| `npm run prisma:seed` | Seed admin/customer accounts, movies and shows |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm test` | Run the Jest + Supertest suite against `yozigo_test` |
