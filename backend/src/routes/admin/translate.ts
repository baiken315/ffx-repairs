import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../../config';

const router = Router();

interface TranslateRequest {
  texts: string[];      // array of EN strings to translate
  targetLang: string;   // e.g. 'es'
}

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { texts, targetLang } = req.body as TranslateRequest;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'texts must be a non-empty array' });
    }
    if (!targetLang) {
      return res.status(400).json({ error: 'targetLang is required' });
    }
    if (!config.groqApiKey) {
      return res.status(503).json({ error: 'Translation service not configured (GROQ_API_KEY missing)' });
    }

    const langLabel = targetLang === 'es' ? 'Spanish (Latin American, neutral)' : targetLang;

    // Number each string so the model can return them in order
    const numbered = texts.map((t, i) => `[${i + 1}] ${t}`).join('\n');

    const prompt = `You are a professional translator. Translate the following numbered English strings into ${langLabel}.

Rules:
- Preserve the numbering format exactly: [1], [2], etc.
- Keep placeholders like {count}, {current}, {total} unchanged.
- Translate only the text, not HTML tags or variable names.
- Return ONLY the numbered translations, nothing else.

${numbered}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error('Groq API error:', groqRes.status, errBody);
      return res.status(502).json({ error: 'Translation API error', detail: groqRes.status });
    }

    const groqData = await groqRes.json() as {
      choices: Array<{ message: { content: string } }>
    };

    const content = groqData.choices?.[0]?.message?.content ?? '';

    // Parse numbered lines back out
    const translated: string[] = [];
    for (let i = 0; i < texts.length; i++) {
      const match = content.match(new RegExp(`\\[${i + 1}\\]\\s*([\\s\\S]*?)(?=\\[${i + 2}\\]|$)`));
      translated.push(match ? match[1].trim() : texts[i]);
    }

    res.json({ translated });
  } catch (err) {
    next(err);
  }
});

export default router;
