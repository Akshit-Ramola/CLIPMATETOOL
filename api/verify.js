const crypto = require("crypto");
const { signToken, sendEmail, origin, need } = require("./_lib");

// Called by the browser after Razorpay Checkout succeeds. Verifies Razorpay's signature, then returns the download link.
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { razorpay_order_id: o, razorpay_payment_id: p, razorpay_signature: s, email } = req.body || {};
    if (![o, p, s].every((v) => typeof v === "string" && v.length < 100)) return res.status(400).json({ error: "Bad request" });
    const good = crypto.createHmac("sha256", need("RAZORPAY_KEY_SECRET")).update(`${o}|${p}`).digest("hex");
    const a = Buffer.from(s), b = Buffer.from(good);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json({ error: "Payment could not be verified." });
    const link = `${origin(req)}/download.html?t=${signToken(o)}`;
    if (typeof email === "string") await sendEmail(email, link);
    res.json({ link });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Verification failed. Email us your payment ID." });
  }
};
