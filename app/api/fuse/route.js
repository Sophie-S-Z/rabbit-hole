export async function POST(req) {
  const { a, b } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system:
        'You are the cosmic oracle of Concept Alchemy. Fuse two concepts. Return ONLY valid JSON.\nFormat: {"name":"ResultName","emoji":"X","lore":"Poetic sentence under 12 words"}\nRules: 1-3 word name. One emoji. Creative. Never return input name.',
      messages: [{ role: "user", content: `Fuse: "${a.name}" + "${b.name}"` }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const txt = (data.content || [])
    .map((c) => c.text || "")
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  try {
    return Response.json(JSON.parse(txt));
  } catch {
    return Response.json({ error: "Parse error", raw: txt }, { status: 500 });
  }
}
