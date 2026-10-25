/**
 * Vercel Serverless Function: POST /api/order
 * Пересылает заказ в Telegram, не раскрывая токен бота в браузере.
 * Переменные окружения (Vercel → Settings → Environment Variables):
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */
const MAX_TEXT = 3500;

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

module.exports = async function handler(req, res) {
  const send = (status, data) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  };

  if (req.method !== 'POST') return send(405, { ok: false, error: 'Method Not Allowed' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return send(500, { ok: false, error: 'Telegram is not configured' });

  let body;
  try {
    body = await readJson(req);
  } catch (_err) {
    return send(400, { ok: false, error: 'Invalid JSON' });
  }

  const text = String(body.text || '').slice(0, MAX_TEXT);
  const phoneDigits = String(body.phone || '').replace(/\D/g, '');
  if (!text || phoneDigits.length < 9) return send(400, { ok: false, error: 'Invalid order' });

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
    });
    return send(tgRes.ok ? 200 : 502, { ok: tgRes.ok });
  } catch (_err) {
    return send(502, { ok: false });
  }
};
