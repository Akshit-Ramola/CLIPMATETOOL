const { PRICE, razorpay, validEmail, need } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { email, phone } = req.body || {};
    if (!validEmail(email)) return res.status(400).json({ error: "Enter a valid email." });
    const order = await razorpay("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: PRICE, currency: "INR", receipt: "kit_" + Date.now(),
        notes: { email, phone: String(phone || "").slice(0, 20), product: "ClipMate Kit" },
      }),
    });
    res.json({ orderId: order.id, amount: order.amount, keyId: need("RAZORPAY_KEY_ID") });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Couldn't start checkout. Try again." });
  }
};
