# FoodDash — AI-enabled food delivery management system

Next.js 14 (App Router) + TypeScript + Tailwind + Prisma/SQLite. Three roles (customer,
vendor, admin), a full order lifecycle, and an AI layer that degrades to deterministic
heuristics when no LLM key is configured.

## Features

**Customer** — browse restaurants with personalised "Picked for you" ranking, build a cart,
place an order, track it through the status timeline with a predicted ETA, cancel while the
order is still `PLACED`/`ACCEPTED`, and ask the support assistant about orders.

**Vendor** — live order queue with one-click status advance (`PLACED → ACCEPTED → PREPARING →
OUT_FOR_DELIVERY → DELIVERED`), menu management (add items, toggle sold out), revenue summary.

**Admin** — platform metrics (restaurants, users, active orders, delivered GMV, average
predicted ETA) and a recent-orders table.

**AI (`src/lib/ai.ts`)**
- `recommendRestaurants` — ranks restaurants from rating, popularity, prep time, distance and
  the customer's cuisine history.
- `estimateEta` — predicts delivery time from prep time, kitchen queue depth, basket size and
  distance, and returns the explanation shown to the customer.
- `supportReply` — answers order questions grounded in the customer's recent orders.

Set `OPENAI_API_KEY` to route all three through an LLM; without it every feature still works
using the built-in heuristics.

## Run locally

```bash
npm install
cp .env.example .env      # DATABASE_URL="file:./dev.db"
npm run db:push
npm run db:seed
npm run dev               # http://localhost:3000
```

## Demo accounts

Password for all: `password123`

| Role     | Email                      |
| -------- | -------------------------- |
| Customer | customer@fooddash.test     |
| Vendor   | vendor1@fooddash.test      |
| Admin    | admin@fooddash.test        |

## Scripts

| Script             | Purpose                        |
| ------------------ | ------------------------------ |
| `npm run dev`      | dev server                     |
| `npm run build`    | production build               |
| `npm run lint`     | ESLint                         |
| `npm run typecheck`| `tsc --noEmit`                 |
| `npm run db:push`  | apply Prisma schema to SQLite  |
| `npm run db:seed`  | reset and seed demo data       |

## Notes

Sessions are a signed-in user id in an httpOnly cookie and passwords are bcrypt hashed — fine
for a demo, swap for NextAuth/Auth.js before production. Payments are not wired up; add Stripe
Checkout at order creation when you need real payments.
