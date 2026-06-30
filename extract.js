export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing GEMINI_API_KEY env var' });
  }

  const { ceoSpeech, employees } = req.body;

  const prompt = `You are a task-routing assistant. The CEO gave this spoken instruction:
"${ceoSpeech}"

Known employees: ${JSON.stringify(employees)}

Extract the employee name (must match one from the known employees list exactly, or null if no confident match) and the task description.

Respond ONLY with valid JSON, no markdown, no explanation, in this exact format:
{"employee": "<name or null>", "task": "<task description>", "confidence": "<high|medium|low>"}`;

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
    let raw = data.candidates[0].content.parts[0].text.trim();
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(raw);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
