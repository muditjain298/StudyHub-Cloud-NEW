const crypto = require('crypto');
const { databases, ids, sdk, users } = require('../shared/appwrite');

module.exports = async ({ req, res, error }) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(req.body).digest('hex');
    if (!signature || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return res.json({ error: 'Invalid webhook signature' }, 400);
    const event = JSON.parse(req.body);
    const payment = event.payload?.payment?.entity;
    if (!payment) return res.json({ received: true });
    const status = event.event === 'payment.captured' ? 'captured' : event.event === 'payment.failed' ? 'failed' : null;
    if (!status) return res.json({ received: true });
    const userId = payment.notes?.userId;
    if (userId && status === 'captured') {
      const user = await users.get(userId);
      await users.updatePrefs(userId, { ...user.prefs, isPremium: true });
    }
    if (userId) await databases.createDocument(ids.database, ids.payments, sdk.ID.unique(), { userId, razorpayPaymentId: payment.id, razorpayOrderId: payment.order_id, amount: payment.amount, status, timestamp: new Date().toISOString() });
    return res.json({ received: true });
  } catch (err) { error(err.message); return res.json({ error: 'Webhook processing failed' }, 500); }
};