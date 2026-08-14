import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { account } from '../appwriteConfig'; // Path check kar lena

const API = "/api/auth";

function Login() {
  const [tab, setTab] = useState('email'); // 'email' | 'phone'
  const [showForgot, setShowForgot] = useState(false);

  // Email/password form
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  // Phone OTP form
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isLoading, isError, isSuccess, message } = useSelector((s) => s.auth);

const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentAccount = await account.get();
        if (currentAccount) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkUserSession();
  }, []);

  if (isCheckingAuth) {
    return <div className="flex h-screen items-center justify-center">Loading StudyHub...</div>;
  }

  const onEmailLogin = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) return alert('Please enter your phone number');
    setSendingOtp(true);
    try {
      const res = await axios.post(`${API}/send-otp`, { phone });
      setOtpSent(true);
      setOtpMessage(res.data.message);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <button onClick={() => { setShowForgot(false); setForgotMessage(''); }}
            className="text-indigo-600 dark:text-indigo-400 text-sm mb-6 flex items-center gap-1 hover:underline">
            ← Back to Login
          </button>
          <BookOpen className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Forgot Password?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your email and we'll send a reset link.</p>

          {forgotMessage ? (
            <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm">{forgotMessage}</div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email" required value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button type="submit" disabled={forgotLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50">
                {forgotLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reset Link
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Image Panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80"
          alt="Students studying"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-indigo-900/60" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <BookOpen className="h-12 w-12 mb-6 text-indigo-300" />
          <h1 className="text-4xl font-bold mb-4">Welcome to StudyHub</h1>
          <p className="text-lg text-indigo-200">Your all-in-one academic resource manager.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="h-9 w-9 text-indigo-600 dark:text-indigo-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">StudyHub</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Sign In</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Register</Link>
          </p>

          {/* Tab Switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${tab === 'email' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
            <button
              onClick={() => setTab('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${tab === 'phone' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              <Phone className="w-4 h-4" /> Phone OTP
            </button>
          </div>

          {/* ── EMAIL TAB ── */}
          {tab === 'email' && (
            <form onSubmit={onEmailLogin} className="space-y-4">
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

              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </form>
          )}

          {/* ── PHONE OTP TAB ── */}
          {tab === 'phone' && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <input
                      type="tel" required value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <button type="submit" disabled={sendingOtp}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50">
                    {sendingOtp && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send OTP
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">{otpMessage}</div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter 6-digit OTP</label>
                    <input
                      type="text" required maxLength={6} value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="• • • • • •"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-center tracking-[0.5em] text-xl font-bold"
                    />
                  </div>
                  <button type="submit" disabled={verifyingOtp}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50">
                    {verifyingOtp && <Loader2 className="w-4 h-4 animate-spin" />}
                    Verify & Sign In
                  </button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 hover:underline">
                    ← Change phone number
                  </button>
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
