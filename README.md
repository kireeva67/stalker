# stalker

Node.js / TypeScript service that monitors product availability on online shops and sends notifications via Telegram.

At the moment it supports **mango.com** product pages.  
Shops list will be extended.

Telegram bot: **@StalkerForMe_bot**

---

## Features

- Monitor availability of products on Mango by URL.
- Periodic checks using a background job scheduler.
- HTML parsing to detect size / stock availability.
- Store checks and subscriptions in a SQLite database via Prisma ORM.
- Send Telegram notifications to subscribed users when availability changes.
- Dockerized setup for easy running in a container.

---

## Tech Stack

- **Runtime:** Node.js 20
- **Language:** TypeScript
- **Database:** SQLite + Prisma ORM
- **Job scheduling:** [Bree](https://github.com/breejs/bree)
- **HTTP & HTML parsing:** Axios, JSDOM
- **Messaging:** `node-telegram-bot-api`
- **DI / structure:** `tsyringe`
- **Config:** `dotenv`
- **Containerization:** Docker (Alpine-based image)

---

## How It Works

- Users interact with the Telegram bot (**@StalkerForMe_bot**) and send product links
  from `https://shop.mango.com`.
- The service validates and stores these links in the database.
- A scheduled job periodically:
  - Fetches the product page HTML.
  - Parses it with JSDOM to detect availability information.
  - Compares the new state with the stored one.
  - Sends Telegram notifications when availability changes.
- All persistent data is stored in a SQLite database managed via Prisma.

## Getting Started

1. Create .env file
```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
DATABASE_URL="file:./prisma/data/dev.db"
```

2. Install dependencies
```
npm install
```

3. Generate the Prisma client and run migrations:
```
npx prisma generate
npx prisma migrate dev --name init
```

4. Run in development
```
npm run dev
```