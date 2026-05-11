async function fetchRequest(requestCode) {
  const response = await fetch(
    "https://sirawichhhhhhhh.app.n8n.cloud/webhook/check-status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.STEP_WEBHOOK_SECRET
          ? { "x-step-secret": process.env.STEP_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({ requestCode }),
    }
  );

  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }
  return data;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { code = "", token = "" } = req.query;
  if (!code) {
    return res.status(400).json({ success: false, error: "Missing code" });
  }

  try {
    const data = await fetchRequest(code);
    if (!data?.found || !data?.request) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }

    const request = data.request;
    const expectedToken = request.pdf_download_token || "";
    if (expectedToken && token !== expectedToken) {
      return res.status(403).json({ success: false, error: "Invalid download token" });
    }

    const directUrl =
      request.file_download_url ||
      request.drive_file_url ||
      request.public_file_url ||
      request.drive_public_url ||
      "";

    if (directUrl) {
      res.setHeader("Cache-Control", "no-store");
      return res.redirect(302, directUrl);
    }

    if (request.drive_file_id) {
      const driveUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
        request.drive_file_id
      )}`;
      res.setHeader("Cache-Control", "no-store");
      return res.redirect(302, driveUrl);
    }

    const query = new URLSearchParams({ code, token });
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(302, `/api/pdf?${query.toString()}`);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
