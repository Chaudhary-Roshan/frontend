/**
 * otp.js – Google Apps Script OTP helper
 *
 * Environment variables (set in Cloudflare Pages → Settings → Env Vars):
 *   VITE_GAS_URL   – The deployed Web App URL from Google Apps Script
 *   VITE_GAS_TOKEN – The secret token set in GAS Script Properties
 *
 * Usage:
 *   import { requestOtpViaGas, resendOtpViaGas } from '../utils/otp';
 */

const GAS_URL   = import.meta.env.VITE_GAS_URL;
const GAS_TOKEN = import.meta.env.VITE_GAS_TOKEN;

/**
 * Request a new OTP for a user.
 * Calls the GAS Web App which generates the OTP and sends it via cssc.dice@gmail.com.
 *
 * @param {string} email  – Recipient email address
 * @param {string} name   – Recipient display name (shown in the email body)
 * @returns {Promise<{status: string, masked_email: string, message: string}>}
 */
export async function requestOtpViaGas(email, name) {
  if (!GAS_URL) {
    throw new Error('VITE_GAS_URL is not configured. Please set it in your environment variables.');
  }

  const resp = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name: name || 'User',
      token: GAS_TOKEN || '',
    }),
    // GAS Web Apps do not support CORS pre-flight, use no-cors only if
    // you have configured your GAS to respond with correct CORS headers.
    // In practice the default GAS Web App handles POST correctly.
  });

  if (!resp.ok) {
    let errDetail = resp.statusText;
    try { errDetail = (await resp.json()).error || errDetail; } catch (_) { /* noop */ }
    throw new Error(`GAS OTP request failed: ${errDetail}`);
  }

  return resp.json(); // { status, masked_email, message }
}

/**
 * Re-send an OTP via GAS (alias for requestOtpViaGas – same endpoint handles both).
 */
export const resendOtpViaGas = requestOtpViaGas;

/**
 * Check whether the GAS integration is configured in this environment.
 * Returns false when VITE_GAS_URL is not set, which is safe to use as a
 * feature flag so the app gracefully falls back to the Django SMTP path.
 */
export function isGasConfigured() {
  return Boolean(GAS_URL);
}
