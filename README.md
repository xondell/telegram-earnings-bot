<div align="center">

# 💸 Telegram Earnings Bot

### A focused Telegram challenge tracker: 2,000 MDL in 180 minutes

A small serverless bot that records earnings, tracks progress against a timed goal and persists challenge state in Supabase.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-state-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-serverless-000000?logo=vercel&logoColor=white)

</div>

---

## Challenge model

```text
Target: 2,000 MDL
Time:   180 minutes
```

Send a positive amount to add it to the running total:

```text
150
75.50
75,50
```

## Commands

| Command | Action |
|---|---|
| `/start` | Start a new timed challenge |
| `/status` | Show current progress |
| `/reset` | Reset the challenge |
| `<positive number>` | Add earnings |

## Share rule

The bot applies the repository's current calculation rule:

- total up to **1,500 MDL inclusive** → show **30%**;
- total above **1,500 MDL** → show **50%**.

## Architecture

```mermaid
flowchart LR
    TG[Telegram] --> WH[/api/telegram webhook]
    WH --> LOGIC[Challenge logic]
    LOGIC --> SB[(Supabase)]
    SETUP[/api/setup-webhook] --> TG
    HEALTH[/api/health] --> V[Vercel health check]
```

## Database

Example table:

```sql
create table if not exists public.telegram_challenges (
  telegram_user_id bigint primary key,
  earned numeric(12,2) not null default 0 check (earned >= 0),
  target numeric(12,2) not null default 2000 check (target > 0),
  total_minutes integer not null default 180 check (total_minutes > 0),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.telegram_challenges enable row level security;
revoke all on table public.telegram_challenges from anon, authenticated;
```

## Environment

```env
TELEGRAM_BOT_TOKEN=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WEBHOOK_SECRET=
SETUP_SECRET=
```

Never commit real values.

## Deploy to Vercel

After deployment, register the webhook once:

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/setup-webhook \
  -H "x-setup-secret: YOUR_SETUP_SECRET"
```

Telegram then sends updates to:

```text
/api/telegram
```

## Repository structure

```text
telegram-earnings-bot/
├── api/
│   ├── _shared.js
│   ├── health.js
│   ├── setup-webhook.js
│   └── telegram.js
├── package.json
├── vercel.json
└── README.md
```

---

<div align="center">

**A deliberately small bot: earn → log → track → finish.**

</div>
