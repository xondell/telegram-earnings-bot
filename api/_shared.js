import { createClient } from "@supabase/supabase-js";

export const TARGET = 2000;
export const TOTAL_MINUTES = 180;

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function telegram(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is missing");

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: payload ? "POST" : "GET",
    headers: payload ? { "content-type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram ${method} failed: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function sendMessage(chatId, text) {
  return telegram("sendMessage", { chat_id: chatId, text });
}

export async function getChallenge(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("telegram_challenges")
    .select("telegram_user_id,earned,target,total_minutes,started_at")
    .eq("telegram_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function resetChallenge(userId) {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("telegram_challenges")
    .upsert({
      telegram_user_id: userId,
      earned: 0,
      target: TARGET,
      total_minutes: TOTAL_MINUTES,
      started_at: now,
      updated_at: now,
    }, { onConflict: "telegram_user_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function statusText(row) {
  const earned = Number(row.earned);
  const target = Number(row.target);
  const totalMinutes = Number(row.total_minutes);
  const startedAt = new Date(row.started_at).getTime();

  const elapsedMinutes = Math.max(0, (Date.now() - startedAt) / 60000);
  const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);
  const remainingMoney = Math.max(0, target - earned);
  const progress = Math.min(100, (earned / target) * 100);

  // До 1500 леев включительно показываем 30%.
  // После 1500 леев — 50%.
  const sharePercent = earned > 1500 ? 50 : 30;
  const shareAmount = earned * (sharePercent / 100);
  const shareLine = `💸 ${sharePercent}% от заработанного: ${shareAmount.toFixed(2)} леев`;

  if (earned >= target) {
    return `🎉 ЦЕЛЬ ДОСТИГНУТА!

💰 Заработано: ${earned.toFixed(2)} леев
🎯 Цель: ${target.toFixed(2)} леев
${shareLine}
📊 Выполнено: ${progress.toFixed(1)}%
⏱ Прошло: ${elapsedMinutes.toFixed(1)} мин.`;
  }

  if (remainingMinutes <= 0) {
    return `⏰ 180 минут закончились.

💰 Заработано: ${earned.toFixed(2)} леев
🎯 Цель: ${target.toFixed(2)} леев
${shareLine}
❌ Не хватило: ${remainingMoney.toFixed(2)} леев`;
  }

  const rate = remainingMoney / remainingMinutes;

  return `📊 ТЕКУЩИЙ РЕЗУЛЬТАТ

💰 Заработано: ${earned.toFixed(2)} леев
🎯 Цель: ${target.toFixed(2)} леев
💵 Осталось: ${remainingMoney.toFixed(2)} леев
${shareLine}

⌛ Осталось: ${remainingMinutes.toFixed(1)} мин.
🔥 Нужно зарабатывать: ${rate.toFixed(2)} леев/мин
📈 Выполнено: ${progress.toFixed(1)}%`;
}
