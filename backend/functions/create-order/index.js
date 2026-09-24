const Razorpay = require('razorpay');
const { getCaller } = require('../shared/appwrite');

module.exports = async ({ req, res, error }) => {
  try {
    const caller = await getCaller(req.headers);
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({ amount: Number(process.env.PREMIUM_PRICE_PAISE), currency: 'INR', receipt: `premium_${caller.$id}_${Date.now()}`, notes: { userId: caller.$id } });
    return res.json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) { error(err.message); return res.json({ error: 'Unable to create payment order' }, 500); }
};