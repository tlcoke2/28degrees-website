// ESM. Uses fetch -> OpenAI Chat Completions with stream:true
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not set. /ai/chat/stream will fail.');
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const DEFAULT_TEMP = Number(process.env.AI_TEMPERATURE ?? 0.3);
const DEFAULT_MAXTOK = Number(process.env.AI_MAX_TOKENS ?? 512);

/**
 * Build messages for OpenAI. `userText` is required; `history` optional.
 * history format: [{ role: 'user'|'assistant'|'system', content: '...' }, ...]
 */
function buildMessages(userText, history = []) {
  const messages = [];
  // Optional system priming
  messages.push({
    role: 'system',
    content:
      "You are 28 Degrees West's helpful assistant. Be concise, friendly, and accurate about tours, bookings, and policies.",
  });
  for (const m of history) {
    if (!m?.role || !m?.content) continue;
    messages.push({ role: m.role, content: m.content });
  }
  messages.push({ role: 'user', content: userText });
  return messages;
}

/**
 * Starts a streamed completion. Returns the raw Response from OpenAI fetch.
 */
export async function openAIStream({ userText, history, model, temperature, maxTokens }) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  const body = {
    model: model || DEFAULT_MODEL,
    stream: true,
    temperature: typeof temperature === 'number' ? temperature : DEFAULT_TEMP,
    max_tokens: typeof maxTokens === 'number' ? maxTokens : DEFAULT_MAXTOK,
    messages: buildMessages(userText, history),
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`OpenAI error: ${resp.status} ${resp.statusText} ${errText}`);
  }

  return resp; // has ReadableStream in resp.body
}

/**
 * Parses the OpenAI SSE stream and calls `onToken(token)` for each delta,
 * `onDone()` on completion, and `onError(err)` for errors.
 */
export async function pipeOpenAIToSSE(resp, { onToken, onDone, onError }) {
  try {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Split on SSE blocks
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        // Each part has lines like: "data: {json}" or "data: [DONE]"
        const lines = part.split('\n').filter(Boolean);
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.replace(/^data:\s*/, '');
          if (data === '[DONE]') {
            onDone?.();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            // OpenAI delta tokens live here:
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) onToken?.(delta);
          } catch (e) {
            // non-JSON line (comment/keepalive)
          }
        }
      }
    }
    onDone?.();
  } catch (err) {
    onError?.(err);
  }
}
