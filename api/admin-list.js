export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const response = await fetch(
      'https://sirawichhhhhhhh.app.n8n.cloud/webhook/admin-list',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.STEP_WEBHOOK_SECRET
            ? { 'x-step-secret': process.env.STEP_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify(req.body || {}),
      }
    );
    const text = await response.text();
    let data = {};
    try { data = JSON.parse(text); } catch { data = { requests: [] }; }
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ requests: [], error: e.message });
  }
}