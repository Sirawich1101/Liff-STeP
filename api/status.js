export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const response = await fetch(
      'https://zennnnn.app.n8n.cloud/webhook/check-status',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.STEP_WEBHOOK_SECRET
            ? { 'x-step-secret': process.env.STEP_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify(req.body),
      }
    );
    const text = await response.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ found: false, error: e.message });
  }
}