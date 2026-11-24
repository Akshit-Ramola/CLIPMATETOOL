const { PRICE, razorpay, signToken, validEmail, sendEmail, origin } = require("./_lib");

// "Already paid?" : email + Razorpay payment ID (pay_...) from the receipt -> new link, only if Razorpay confirms it.
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { email, paymentId } = req.body || {};
    if (!validEmail(email) || !/^pay_[A-Za-z0-9]{8,30}$/.test(paymentId || "")) return res.status(400).json({ error: "Check your email and payment ID (starts with pay_)." });
    const pay = await razorpay(`/payments/${paymentId}`).catch(() => null);
    const ok = pay && pay.status === "captured" && pay.amount >= PRICE && pay.order_id &&
      [pay.email, pay.notes?.email].some((e) => e && e.toLowerCase() === email.toLowerCase());
    if (!ok) return res.status(404).json({ error: "We couldn't match that payment. Email us and we'll sort it." });
    const link = `${origin(req)}/download.html?t=${signToken(pay.order_id)}`;
    await sendEmail(email, link);
    res.json({ link });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
};
