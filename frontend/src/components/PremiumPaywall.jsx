import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Crown,
  FileText,
  PlaySquare,
  Presentation,
  Download,
  Loader2,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';

import premiumService from '../features/premium/premiumService';

const RAZORPAY_SCRIPT =
  'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

function PremiumPaywall() {
  const { user } = useSelector((state) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadRazorpayScript().then((loaded) => {
      if (mounted) {
        setRazorpayReady(loaded);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handlePayment = async () => {
    if (isLoading) return;

    if (!user?.$id) {
      toast.error('Please login again before making payment.');
      return;
    }

    if (!razorpayReady || !window.Razorpay) {
      toast.error(
        'Razorpay failed to load. Please refresh and try again.'
      );
      return;
    }

    setIsLoading(true);

    try {
      /*
       * Step 1:
       * Create Razorpay order through existing Appwrite Function.
       */
      const orderResponse =
        await premiumService.createOrder();

      /*
       * Backend may return the order directly or inside `order`.
       * Handle both cases.
       */
      const order =
        orderResponse?.order ||
        orderResponse?.data ||
        orderResponse;

      const orderId =
        order?.id ||
        order?.order_id ||
        order?.razorpay_order_id;

      const amount = Number(order?.amount);

      const currency =
        order?.currency || 'INR';

      const keyId =
        order?.key_id ||
        order?.keyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!orderId) {
        throw new Error(
          'Razorpay order ID was not returned by the server.'
        );
      }

      if (!amount || amount <= 0) {
        throw new Error(
          'Invalid payment amount received from server.'
        );
      }

      if (!keyId) {
        throw new Error(
          'Razorpay Key ID is not configured.'
        );
      }

      /*
       * Step 2:
       * Open Razorpay Checkout.
       */
      const options = {
        key: keyId,
        amount,
        currency,
        order_id: orderId,

        name: 'notezy',
        description: 'notezy Premium Access',

        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },

        notes: {
          userId: user.$id,
        },

        theme: {
          color: '#7c3aed',
        },

        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },

        /*
         * Step 3:
         * Razorpay returns payment details here.
         */
        handler: async (response) => {
          try {
            setIsLoading(true);

            /*
             * Step 4:
             * Send payment details to existing backend
             * verification function.
             */
            const verification =
              await premiumService.verifyPayment({
                userId: user.$id,

                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,
              });

            if (!verification?.verified) {
              throw new Error(
                verification?.error ||
                  'Payment verification failed.'
              );
            }

            toast.success(
              'Payment successful! Premium access unlocked.'
            );

            /*
             * Backend updates Appwrite user prefs:
             * isPremium = true
             *
             * Reload so App.jsx/auth state reads the
             * updated premium status and opens
             * PremiumDashboard.
             */
            window.location.reload();
          } catch (error) {
            console.error(
              '[Razorpay] Verification error:',
              error
            );

            toast.error(
              error?.message ||
                'Payment succeeded but verification failed.'
            );

            setIsLoading(false);
          }
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        'payment.failed',
        (response) => {
          console.error(
            '[Razorpay] Payment failed:',
            response
          );

          toast.error(
            response?.error?.description ||
              'Payment failed. Please try again.'
          );

          setIsLoading(false);
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        '[Razorpay] Checkout error:',
        error
      );

      toast.error(
        error?.message ||
          'Unable to start payment.'
      );

      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-300/20 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 p-6 shadow-xl sm:p-8">
      <div className="flex items-center gap-2 text-purple-300">
        <Crown className="h-5 w-5" />
        <span className="text-xs font-bold uppercase tracking-[0.18em]">
          notezy Premium
        </span>
      </div>

      <h1 className="mt-4 text-3xl font-bold text-white">
        A quieter place to study deeper.
      </h1>

      <p className="mt-3 max-w-2xl text-gray-300">
        Unlock admin-curated notes, question banks,
        reports, PPTs, and embedded video lessons
        with one secure payment.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          ['Notes', FileText],
          ['Video lessons', PlaySquare],
          ['PPTs and reports', Presentation],
          ['Downloadable question banks', Download],
        ].map(([label, Icon]) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-200"
          >
            <Icon className="h-5 w-5 text-purple-300" />
            {label}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handlePayment}
          disabled={isLoading || !razorpayReady}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-purple-900 shadow-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pay with Razorpay
            </>
          )}
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-300">
          <ShieldCheck className="h-4 w-4 text-green-400" />
          Secure server-side payment verification
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        One-time payment. Access is verified
        server-side before premium access is granted.
      </p>
    </div>
  );
}

export default PremiumPaywall;