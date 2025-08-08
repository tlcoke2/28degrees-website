import { sseInit, sseSend, ssePing, sseClose } from '../utils/sse.js';
import { openAIStream, pipeOpenAIToSSE } from '../services/ai.service.js';

/**
 * GET /api/v1/ai/chat/stream?message=... 
 * Optional: history in base64 JSON via ?h=
 * Optional POST (application/json) body { message, history }
 */
export async function chatStream(req, res) {
  try {
    sseInit(res);

    // Pull message from query or body
    let { message, model, temperature, maxTokens } = req.method === 'GET' ? req.query : req.body || {};
    if (!message || !String(message).trim()) {
      sseSend(res, 'Please provide a "message" query or body param.');
      return sseClose(res);
    }
    message = String(message);

    // Optional history: either in body as array, or query param `h` base64(JSON)
    let history = [];
    try {
      if (req.method === 'GET' && req.query.h) {
        const json = Buffer.from(String(req.query.h), 'base64').toString('utf8');
        history = JSON.parse(json);
      } else if (req.body?.history) {
        history = Array.isArray(req.body.history) ? req.body.history : [];
      }
    } catch {
      // ignore bad history
    }

    // Ping heartbeat every 15s to keep the connection alive behind proxies
    const heartbeat = setInterval(() => ssePing(res), 15000);

    const resp = await openAIStream({
      userText: message,
      history,
      model,
      temperature: temperature != null ? Number(temperature) : undefined,
      maxTokens: maxTokens != null ? Number(maxTokens) : undefined,
    });

    await pipeOpenAIToSSE(resp, {
      onToken: (token) => sseSend(res, token),
      onDone: () => {
        clearInterval(heartbeat);
        sseClose(res);
      },
      onError: (err) => {
        clearInterval(heartbeat);
        sseSend(res, `\n[Stream error: ${err?.message || err}]\n`);
        sseClose(res);
      },
    });
  } catch (err) {
    sseSend(res, `\n[Setup error: ${err?.message || err}]\n`);
    sseClose(res);
  }
}
