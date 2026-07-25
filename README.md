# Telegram Earnings Bot

Цель: заработать 2000 леев за 180 минут.

## Команды

- `/start` — начать новый 180-минутный челлендж
- `/status` — показать прогресс
- `/reset` — сбросить прогресс
- Любое положительное число, например `150` или `75,50`, прибавляется к заработанной сумме.
- До 1500 леев включительно бот показывает 30% от общей заработанной суммы; после 1500 леев — 50%.

## Supabase

Таблица `public.telegram_challenges`:

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

Эта таблица уже была создана в проекте Supabase `telegram-earnings-bot`.

## Vercel environment variables

Добавить:

- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEBHOOK_SECRET`
- `SETUP_SECRET`

Не коммитить реальные значения в GitHub.

## После деплоя

Вызвать один раз:

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/setup-webhook \
  -H "x-setup-secret: YOUR_SETUP_SECRET"
```

После этого Telegram будет отправлять сообщения на `/api/telegram`.
