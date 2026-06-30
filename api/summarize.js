export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing GEMINI_API_KEY env var' });
  }

  const { feedbacks } = req.body;

  const prompt = `Summarize this shift's employee feedback into a short 2-3 sentence report for the CEO. Be concise and factual.

Feedback:
${feedbacks.join('\n')}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await geminiRes.json();
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }
    const summary = data.candidates[0].content.parts[0].text.trim();
    return res.status(200).json({ summary });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
