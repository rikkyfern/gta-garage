# 🚗 GTA GARAGE

A full-stack garage management and social platform for GTA players. Built with Next.js 16, TypeScript, Prisma, PostgreSQL, Cloudinary, and Resend.

---

## Features

- Register / login with email confirmation
- Forgot password with secure reset token
- Create and manage garages
- Add cars to garages with up to 5 photos each
- Friend system (send, accept, reject, remove)
- Crew social feed with likes and comments
- Admin SOC for player blocking, warnings, upload review, admin role management, and IP threat controls
- Telegram bot car finder for registered users
- GTA-inspired dark UI

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL + Prisma ORM |
| Auth | Custom JWT (jose + bcryptjs) |
| Storage | Cloudinary |
| Email | Resend |
| Validation | Zod |

---

## Setup

### 1. Prerequisites

- Node.js 20.9+
- PostgreSQL database
- Cloudinary account (free tier works)
- Resend account (free tier: 100 emails/day)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/gta_garage"
JWT_SECRET="generate-a-long-random-secret"
ADMIN_EMAILS="admin@example.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SECURITY_RATE_LIMIT_PER_MINUTE="120"
SECURITY_AUTH_RATE_LIMIT_PER_MINUTE="20"
SECURITY_SCAN_BLOCK_THRESHOLD="12"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
RESEND_API_KEY="re_your_key"
EMAIL_FROM="GTA Garage <noreply@yourdomain.com>"
TELEGRAM_BOT_TOKEN="123456789:your-telegram-bot-token"
TELEGRAM_WEBHOOK_SECRET="generate-a-random-webhook-secret"
TELEGRAM_BOT_USERNAME="your_gta_garage_bot"
```

### 4. Set up the database

```bash
npm run db:generate    # generate Prisma client
npm run db:migrate     # run migrations
npm run db:seed        # seed demo data
```

To restart a local database from zero:

```bash
npm run db:restart     # wipe local database, run migrations, seed demo data
```

To wipe local data without seed:

```bash
npm run db:wipe
```

For deployment, run migrations without wiping data:

```bash
npm run db:deploy
```

Production wipes are intentionally blocked unless you run the reset script manually with `--force-production`.

### 5. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Production checks

```bash
npm run lint
npm run build
npm audit --audit-level=high
```

### 7. Telegram car finder

Create a Telegram bot with BotFather, then set these environment variables:

```env
TELEGRAM_BOT_TOKEN="123456789:your-telegram-bot-token"
TELEGRAM_WEBHOOK_SECRET="generate-a-random-webhook-secret"
TELEGRAM_BOT_USERNAME="your_gta_garage_bot"
```

After deploying the app to HTTPS, register the webhook. Telegram cannot send bot updates to `localhost` or `127.0.0.1`; for local testing, use a public HTTPS tunnel and set `NEXT_PUBLIC_APP_URL` to that tunnel URL.

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.com/api/telegram/webhook","secret_token":"your-random-webhook-secret","allowed_updates":["message"],"drop_pending_updates":true}'
```

Users connect Telegram from their Profile page. Once connected, the bot supports:

```text
/find sultan
/where comet
```

The bot is find-only and only searches cars owned by the connected GTA GARAGE user.

---

## Demo Accounts

After seeding, you can log in with:

| Email | Password |
|---|---|
| franklin@gtagarage.dev | password123 |
| michael@gtagarage.dev | password123 |
| trevor@gtagarage.dev | password123 |

`franklin@gtagarage.dev` is seeded as an admin account. In production, add admin emails to `ADMIN_EMAILS` as a comma-separated list, set a user's `role` to `ADMIN` in the database, or promote a user from the Admin SOC.

The security proxy records API endpoint access by IP address, enforces per-minute rate limits, tracks suspicious scan attempts, and lets admins block or unblock IP addresses from the Traffic tab.

---

## Project Structure

```
app/
  (auth)/          # login, register, confirm-email, forgot/reset password
  (dashboard)/     # admin, garages, cars, friends, feed, profile
  api/             # all REST API route handlers
components/
  ui/              # reusable UI primitives
  auth/            # auth forms
  garage/          # garage cards, forms
  car/             # car cards, forms, photo gallery
  feed/            # activity feed cards
  friends/         # friend list, requests
  layout/          # navbar, sidebar
lib/
  prisma.ts        # Prisma client singleton
  jwt.ts           # JWT sign/verify
  auth.ts          # getCurrentUser, requireAuth
  email.ts         # Resend email helpers
  cloudinary.ts    # Cloudinary upload/delete
  validations/     # Zod schemas
prisma/
  schema.prisma    # database schema
  seed.ts          # demo data
proxy.ts           # route protection
```

---

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/confirm-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET  /api/auth/me`

### Profile
- `GET   /api/profile/me`
- `PATCH /api/profile/me`
- `GET   /api/users/search?username=`

### Garages
- `POST   /api/garages`
- `GET    /api/garages`
- `GET    /api/garages/:id`
- `PATCH  /api/garages/:id`
- `DELETE /api/garages/:id`

### Cars
- `POST   /api/garages/:garageId/cars`
- `GET    /api/garages/:garageId/cars`
- `GET    /api/cars/:id`
- `PATCH  /api/cars/:id`
- `DELETE /api/cars/:id`

### Photos
- `POST   /api/cars/:carId/photos`
- `GET    /api/cars/:carId/photos`
- `DELETE /api/photos/:id`

### Telegram
- `GET    /api/telegram/link-token`
- `POST   /api/telegram/link-token`
- `DELETE /api/telegram/link-token`
- `POST   /api/telegram/webhook`

### Friends
- `POST   /api/friends/request`
- `GET    /api/friends/requests`
- `POST   /api/friends/accept`
- `POST   /api/friends/reject`
- `GET    /api/friends`
- `DELETE /api/friends/:friendId`

### Feed
- `GET    /api/feed`
- `POST   /api/feed/:id/like`
- `DELETE /api/feed/:id/like`
- `POST   /api/feed/:id/comment`
- `GET    /api/feed/:id/comments`
- `PATCH  /api/comments/:id`
- `DELETE /api/comments/:id`

### Admin
- `GET    /api/admin/users`
- `POST   /api/admin/users/promote`
- `PATCH  /api/admin/users/:id/access`
- `PATCH  /api/admin/users/:id/role`
- `POST   /api/admin/users/:id/warnings`
- `GET    /api/admin/warnings`
- `GET    /api/admin/photos`
- `GET    /api/admin/soc`
- `GET    /api/admin/traffic`
- `PATCH  /api/admin/traffic/:ipAddress`

---

## License

MIT
