export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=" +
        API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are a friendly AI financial advisor.

Analyze user data:
${context}

User question:
${prompt}

Rules:
- Be concise (max 200 words)
- Use emojis naturally
- Give actionable advice
- Use bullet points
                  `,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    
    return res.status(200).json({
      reply:
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No response from AI",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}