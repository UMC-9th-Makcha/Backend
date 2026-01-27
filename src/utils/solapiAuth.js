// utils/solapiAuth.js
import crypto from 'crypto';

export function createSolapiAuthHeader(apiKey, apiSecret) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const data = date + salt;

  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(data)
    .digest('hex');

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}
