const crypto = require("crypto");

const PRICE = parseInt(process.env.PRICE_PAISE || "34900", 10);
const b64 = (b) => Buffer.from(b).toString("base64url");

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Server is missing ${name}`);
  return v;
}

function razorpayAuth() {
  return "Basic " + Buffer.from(`${need("RAZORPAY_KEY_ID")}:${need("RAZORPAY_KEY_SECRET")}`).toString("base64");
}

async function razorpay(path, init = {}) {
  const res = await fetch("https://api.razorpay.com/v1" + path, {
    ...init,
    headers: { Authorization: razorpayAuth(), "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.description || `Razorpay error ${res.status}`);
  return data;
}

// Download token: base64url(JSON {o: orderId}) + "." + HMAC. No database needed.
function signToken(orderId) {
  const body = b64(JSON.stringify({ o: orderId }));
  const sig = crypto.createHmac("sha256", need("DOWNLOAD_SECRET")).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function checkToken(token) {
  if (typeof token !== "string" || token.length > 400) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const good = crypto.createHmac("sha256", need("DOWNLOAD_SECRET")).update(body).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(good);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const validEmail = (e) => typeof e === "string" && e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

async function sendEmail(to, link) {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to,
        subject: "Your ClipMate Kit download",
        html: `<p>Thanks for your purchase!</p><p><a href="${link}">Open your private download page</a></p><p>Keep this link safe. It is yours for good.</p>`,
      }),
    });
    return r.ok;
  } catch { return false; }
}

const origin = (req) => `https://${req.headers["x-forwarded-host"] || req.headers.host}`;

module.exports = { PRICE, razorpay, signToken, checkToken, validEmail, sendEmail, origin, need };
