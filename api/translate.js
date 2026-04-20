module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'No text provided' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Translate the following Korean missionary prayer letter text to natural English. Keep the faith-based tone warm and natural for a Christian audience. Only output the translated text, nothing else.\n\n${text}`
        }]
      })
    });

    const data = await response.json();
    const translated = data?.content?.[0]?.text;

    if (translated) {
      return res.json({ translated });
    } else {
      return res.status(500).json({ error: 'No translation returned', detail: JSON.stringify(data) });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
