import crypto from 'crypto';

const SECRET = process.env.SYNC_API_KEY || 'fetcher-cargo-captcha-secret';
const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function generateCaptcha(): { question: string; token: string } {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const ops = ['+', '-'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  const answer = op === '+' ? a + b : a - b;
  const question = `${a} ${op} ${b}`;
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${answer}:${timestamp}`)
    .digest('hex');

  return {
    question,
    token: `${signature}:${timestamp}`,
  };
}

export function verifyCaptcha(answer: string, token: string): boolean {
  const parts = token.split(':');
  if (parts.length !== 2) return false;

  const [signature, timestamp] = parts;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Date.now() - ts > EXPIRY_MS) return false;

  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(`${answer.trim()}:${timestamp}`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
