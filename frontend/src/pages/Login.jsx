import { useState } from 'react';
import { account } from '../lib/appwrite';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = "/api/auth";

function Login() {
  const [tab, setTab] = useState('email');
  const [showForgot, setShowForgot] = useState(false);

  // Email/password form
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Phone OTP form
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // NOTE: No useEffect / session-check here anymore.
  // App.jsx already decides whether to render <Login /> at all
  // (it only renders Login when isAuthenticated is false).
  // Checking the session again here was racing with App.jsx's own
  // check and causing the redirect loop.

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);

    try {
      await account.createEmailPasswordSession(formData.email, formData.password);
      // Hard reload so App.jsx's auth-check runs fresh and picks up
      // the new session correctly (instead of navigate() which would
      // leave App.jsx's isAuthenticated state stale at `false`).
      window.location.href = '/';
    } catch (error) {
      console.error("Login failed:", error.message);
      alert(error.message);
      setIsLoginLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) return alert('Please enter your phone number');
    setSendingOtp(true);
    try {
      await axios.post(`${API}/send-otp`, { phone });
      setOtpSent(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setVerifyingOtp(true);
    try {
      const res = await axios.post(`${API}/verify-otp`, { phone, otp });
      localStorage.setItem('user', JSON.stringify(res.data));
      window.location.href = '/';
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const res = await axios.post(`${API}/forgotpassword`, { email: forgotEmail });
      setForgotMessage(res.data.message);
    } catch (err) {
      setForgotMessage(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
          <button onClick={() => setShowForgot(false)} className="text-indigo-600 text-sm mb-4">← Back to Login</button>
          <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
          {forgotMessage ? (
            <p className="text-green-600">{forgotMessage}</p>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Email" className="w-full p-3 rounded-xl border" />
              <button type="submit" disabled={forgotLoading} className="w-full py-3 bg-indigo-600 text-white rounded-xl">Send Reset Link</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-indigo-900 p-12 text-white flex-col justify-center">
        <BookOpen className="h-12 w-12 mb-6" />
        <h1 className="text-4xl font-bold mb-2">Welcome to StudyHub</h1>
        <p>Your all-in-one academic resource manager.</p>
      </div>

      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6">Sign In</h2>

          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
            <button onClick={() => setTab('email')} className={`flex-1 py-2 rounded-lg text-sm ${tab === 'email' ? 'bg-white shadow' : ''}`}>Email</button>
            <button onClick={() => setTab('phone')} className={`flex-1 py-2 rounded-lg text-sm ${tab === 'phone' ? 'bg-white shadow' : ''}`}>Phone OTP</button>
          </div>

          {tab === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email" name="email" required value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} name="password" required value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition pr-12"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setShowForgot(true)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={isLoginLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50">
                {isLoginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </form>
          )}

          {tab === 'phone' && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-3 rounded-xl border" />
                  <button type="submit" disabled={sendingOtp} className="w-full py-3 bg-indigo-600 text-white rounded-xl">Send OTP</button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <input type="text" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="• • • • • •" className="w-full p-3 rounded-xl border text-center tracking-widest text-xl" />
                  <button type="submit" disabled={verifyingOtp} className="w-full py-3 bg-indigo-600 text-white rounded-xl">Verify & Sign In</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;