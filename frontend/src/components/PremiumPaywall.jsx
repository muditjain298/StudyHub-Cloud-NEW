import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Crown, FileText, PlaySquare, Presentation, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import premiumService from '../features/premium/premiumService';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve();
  const script = document.createElement('script');
  script.src = RAZORPAY_SCRIPT;
  script.onload = resolve;
  script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
  document.body.appendChild(script);
});

function PremiumPaywall() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.prefs?.role === 'admin';
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      const order = await premiumService.createOrder();
      await loadRazorpay();
      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'StudyHub Cloud',
        description: 'StudyHub Premium access',
        prefill: { name: user.name, email: user.email },
        method: { card: false, netbanking: false, wallet: false, paylater: false, upi: true },
        handler: async (response) => {
          await premiumService.verifyPayment({ ...response, userId: user.$id });
          toast.success('Premium unlocked. Please refresh once.');
          window.location.reload();
        },
      });
      razorpay.on('payment.failed', () => toast.error('Payment failed. No premium access was granted.'));
      razorpay.open();
    } catch (error) {
      toast.error(error.message || 'Could not start payment.');
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin) return null;

  return <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-purple-800/50 bg-gradient-to-br from-gray-900 via-purple-950/70 to-gray-900 p-8 text-white shadow-2xl">
    <div className="flex items-center gap-3 text-purple-300"><Crown /> <span className="text-sm font-semibold uppercase tracking-[0.2em]">StudyHub Premium</span></div>
    <h1 className="mt-5 text-3xl font-bold">A quieter place to study deeper.</h1>
    <p className="mt-3 max-w-2xl text-gray-300">Unlock admin-curated notes, question banks, reports, PPTs, and embedded video lessons with one secure UPI payment.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {[['Notes', FileText], ['Video lessons', PlaySquare], ['PPTs and reports', Presentation], ['Downloadable question banks', Download]].map(([label, Icon]) => <div key={label} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-200"><Icon className="h-5 w-5 text-purple-300" />{label}</div>)}
    </div>
    <button onClick={pay} disabled={loading} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-purple-500 px-5 py-3 font-semibold text-white transition hover:bg-purple-400 disabled:opacity-60">
      {loading && <Loader2 className="h-4 w-4 animate-spin" />} Pay with UPI
    </button>
    <p className="mt-3 text-xs text-gray-400">One-time payment. Access is verified server-side before it is granted.</p>
  </div>;
}

export default PremiumPaywall;