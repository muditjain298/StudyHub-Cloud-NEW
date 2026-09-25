const crypto = require('crypto');
const Razorpay = require('razorpay');

const {
  tablesDB,
  ids,
  sdk,
  getCaller,
  users,
} = require('../shared/appwrite');

module.exports = async ({ req, res, error }) => {
  try {
    const payload = JSON.parse(req.body || '{}');

    const caller = await getCaller(req.headers);

    if (
      payload.userId &&
      payload.userId !== caller.$id
    ) {
      return res.json(
        { error: 'Payment user mismatch' },
        403
      );
    }

    const expected = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`
      )
      .digest('hex');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(
          payload.razorpay_signature || ''
        )
      )
    ) {
      return res.json(
        { error: 'Invalid payment signature' },
        400
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const payment = await razorpay.payments.fetch(
      payload.razorpay_payment_id
    );

    if (payment.status !== 'captured') {
      return res.json(
        { error: 'Payment is not captured' },
        400
      );
    }

    await users.updatePrefs(caller.$id, {
      ...caller.prefs,
      isPremium: true,
    });

    await tablesDB.createRow({
      databaseId: ids.database,
      tableId: ids.payments,
      rowId: sdk.ID.unique(),
      data: {
        userId: caller.$id,
        razorpayPaymentId:
          payload.razorpay_payment_id,
        razorpayOrderId:
          payload.razorpay_order_id,
        amount: payment.amount,
        status: 'captured',
        timestamp: new Date().toISOString(),
      },
    });

    return res.json({
      verified: true,
    });
  } catch (err) {
    error(err.message);

    return res.json(
      { error: 'Payment verification failed' },
      400
    );
  }
};