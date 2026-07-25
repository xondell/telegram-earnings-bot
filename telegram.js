import {
  TARGET,
  TOTAL_MINUTES,
  getChallenge,
  getSupabase,
  resetChallenge,
  sendMessage,
  statusText,
} from "./_shared.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({ ok: true, service: "telegram-earnings-bot" });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const expectedSecret = process.env.WEBHOOK_SECRET;
    const actualSecret = req.headers["x-telegram-bot-api-secret-token"];

    if (!expectedSecret || actualSecret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const message = req.body?.message;
    if (!message?.chat?.id || !message?.from?.id || typeof message?.text !== "string") {
      return res.status(200).json({ ok: true });
    }

    const chatId = Number(message.chat.id);
    const userId = Number(message.from.id);
    const text = message.text.trim();

    if (text === "/start") {
      await resetChallenge(userId);
      await sendMessage(
        chatId,
        `🚀 ЧЕЛЛЕНДЖ ЗАПУЩЕН!

🎯 Цель: 2000 леев
⏱ Время: 180 минут
🔥 Начальный темп: ${(TARGET / TOTAL_MINUTES).toFixed(2)} леев/мин

Отправляй заработанные суммы обычным числом, например: 150 или 75,50.

Команды:
/status — текущий статус
/reset — начать заново`
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/reset") {
      await resetChallenge(userId);
      await sendMessage(chatId, "🔄 Результат сброшен. Новые 180 минут начались!");
      return res.status(200).json({ ok: true });
    }

    if (text === "/status") {
      const row = await getChallenge(userId);
      await sendMessage(
        chatId,
        row ? statusText(row) : "Сначала запусти челлендж командой /start"
      );
      return res.status(200).json({ ok: true });
    }

    const amount = Number(text.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      await sendMessage(chatId, "❌ Отправь сумму числом, например: 150");
      return res.status(200).json({ ok: true });
    }

    let row = await getChallenge(userId);
    if (!row) row = await resetChallenge(userId);

    const supabase = getSupabase();
    const newEarned = Number(row.earned) + amount;

    const { data: updated, error } = await supabase
      .from("telegram_challenges")
      .update({
        earned: newEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("telegram_user_id", userId)
      .select()
      .single();

    if (error) throw error;

    await sendMessage(
      chatId,
      `✅ +${amount.toFixed(2)} леев

${statusText(updated)}`
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
