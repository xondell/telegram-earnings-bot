import { telegram } from "./_shared.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const setupSecret = req.headers["x-setup-secret"];
    if (!process.env.SETUP_SECRET || setupSecret !== process.env.SETUP_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const protocol = "https";
    const webhookUrl = `${protocol}://${host}/api/telegram`;

    const result = await telegram("setWebhook", {
      url: webhookUrl,
      secret_token: process.env.WEBHOOK_SECRET,
      allowed_updates: ["message"],
      drop_pending_updates: true,
    });

    const info = await telegram("getWebhookInfo");

    return res.status(200).json({
      ok: true,
      webhookUrl,
      setWebhook: result,
      webhookInfo: info.result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
