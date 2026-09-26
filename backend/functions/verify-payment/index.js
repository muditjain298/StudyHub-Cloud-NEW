const crypto = require('crypto');
const Razorpay = require('razorpay');
const sdk = require('node-appwrite');

const client = new sdk.Client()
  .setEndpoint(
    process.env.APPWRITE_ENDPOINT ||
      'https://sgp.cloud.appwrite.io/v1'
  )
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const users = new sdk.Users(client);
const tablesDB = new sdk.TablesDB(client);

module.exports = async ({ req, res, error }) => {
  try {
    console.log('[VERIFY] Function started');

    const payload = JSON.parse(req.body || '{}');

    const {
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = payload;

    console.log('[VERIFY] Payload received');
    console.log('[VERIFY] User ID:', userId);
    console.log('[VERIFY] Order ID:', razorpay_order_id);
    console.log('[VERIFY] Payment ID:', razorpay_payment_id);

    // --------------------------------------------------
    // 1. Validate required data
    // --------------------------------------------------

    if (
      !userId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      console.log('[VERIFY] Missing payment data');

      return res.json(
        {
          error: 'Missing payment verification data',
        },
        400
      );
    }

    // --------------------------------------------------
    // 2. Verify Razorpay signature
    // --------------------------------------------------

    console.log('[VERIFY] Checking signature');

    const expectedSignature = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest('hex');

    const expectedBuffer =
      Buffer.from(expectedSignature);

    const receivedBuffer =
      Buffer.from(razorpay_signature);

    if (
      expectedBuffer.length !==
        receivedBuffer.length ||
      !crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      )
    ) {
      console.log('[VERIFY] Invalid signature');

      return res.json(
        {
          error: 'Invalid payment signature',
        },
        400
      );
    }

    console.log('[VERIFY] Signature valid');

    // --------------------------------------------------
    // 3. Razorpay client
    // --------------------------------------------------

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // --------------------------------------------------
    // 4. Verify Razorpay order belongs to this user
    // --------------------------------------------------

    console.log('[VERIFY] Fetching Razorpay order');

    const order = await razorpay.orders.fetch(
      razorpay_order_id
    );

    console.log('[VERIFY] Razorpay order fetched');

    const orderUserId =
      order.notes?.userId;

    if (
      orderUserId &&
      orderUserId !== userId
    ) {
      console.log(
        '[VERIFY] User mismatch'
      );

      return res.json(
        {
          error: 'Payment user mismatch',
        },
        403
      );
    }

    // --------------------------------------------------
    // 5. Verify payment status
    // --------------------------------------------------

    console.log(
      '[VERIFY] Fetching Razorpay payment'
    );

    const payment =
      await razorpay.payments.fetch(
        razorpay_payment_id
      );

    console.log(
      '[VERIFY] Payment status:',
      payment.status
    );

    if (
      payment.order_id &&
      payment.order_id !== razorpay_order_id
    ) {
      return res.json(
        {
          error: 'Payment order mismatch',
        },
        400
      );
    }

    if (
      payment.status !== 'captured'
    ) {
      return res.json(
        {
          error: 'Payment is not captured',
        },
        400
      );
    }

    // --------------------------------------------------
    // 6. Make user Premium
    // --------------------------------------------------

    console.log(
      '[VERIFY] Updating user premium status'
    );

    const currentUser =
      await users.get(userId);

    await users.updatePrefs(
      userId,
      {
        ...(currentUser.prefs || {}),
        isPremium: true,
      }
    );

    console.log(
      '[VERIFY] User marked as premium'
    );

    // --------------------------------------------------
    // 7. Save payment record
    // --------------------------------------------------

    const paymentTableId =
      process.env.APPWRITE_PAYMENTS_COLLECTION_ID;

    if (paymentTableId) {
      console.log(
        '[VERIFY] Saving payment record'
      );

      await tablesDB.createRow({
        databaseId:
          process.env.APPWRITE_DATABASE_ID,

        tableId:
          paymentTableId,

        rowId:
          sdk.ID.unique(),

        data: {
          userId: userId,

          razorpayPaymentId:
            razorpay_payment_id,

          razorpayOrderId:
            razorpay_order_id,

          amount:
            payment.amount,

          status:
            'captured',

          timestamp:
            new Date().toISOString(),
        },
      });

      console.log(
        '[VERIFY] Payment record saved'
      );
    } else {
      console.log(
        '[VERIFY] Payment table ID not configured'
      );
    }

    // --------------------------------------------------
    // 8. Success
    // --------------------------------------------------

    console.log(
      '[VERIFY] PAYMENT VERIFIED SUCCESSFULLY'
    );

    return res.json({
      verified: true,
      message:
        'Payment verified successfully',
    });

  } catch (err) {
    console.error(
      '[VERIFY] ERROR:',
      err
    );

    if (error) {
      error(
        err?.stack ||
          err?.message ||
          'Payment verification failed'
      );
    }

    return res.json(
      {
        error:
          'Payment verification failed',
      },
      500
    );
  }
};