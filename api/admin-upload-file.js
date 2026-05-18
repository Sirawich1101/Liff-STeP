export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const response = await fetch(
      "https://zennnnn.app.n8n.cloud/webhook/admin-upload-file",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.STEP_WEBHOOK_SECRET
            ? { "x-step-secret": process.env.STEP_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify(req.body),
      }
    );

    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "n8n admin-upload-file webhook error",
        detail: text,
      });
    }

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}