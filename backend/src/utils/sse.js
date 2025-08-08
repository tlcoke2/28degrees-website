// ESM
export function sseInit(res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering (nginx/railway edge)
  res.flushHeaders?.();
}

export function sseSend(res, data) {
  // data must be a string
  res.write(`data: ${data}\n\n`);
}

export function sseEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${data}\n\n`);
}

export function ssePing(res) {
  res.write(': ping\n\n'); // comment line = heartbeat
}

export function sseClose(res) {
  res.write('data: [DONE]\n\n');
  res.end();
}
