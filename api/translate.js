export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'No text provided' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
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
      res.json({ translated });
    } else {
      res.status(500).json({ error: 'Translation failed', detail: data });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
