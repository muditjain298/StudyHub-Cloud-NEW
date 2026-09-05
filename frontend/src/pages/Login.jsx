import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { account } from '../lib/appwrite';
// import { login } from '../features/auth/authSlice'; // Agar direct Appwrite use kar rahe ho toh iski zaroorat nahi
import { BookOpen, Mail, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios'; // Aapke code mein axios use ho raha tha par import nahi tha

const API = "/api/auth";

function Login() {
  const [tab, setTab] = useState('email'); 
  const [showForgot, setShowForgot] = useState(false);

  // Email/password form
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false); // Naya loading state email login ke liye

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
  
  // Auth Check States
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 1. FIXED: Page load hote hi session check karega aur direct dashboard bhej dega
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentAccount = await account.get();
        if (currentAccount) {
          navigate('/dashboard'); // Agar pehle se logged in hai, direct bhej do
        }
      } catch (error) {
        // User logged in nahi hai, kuch mat karo form dikhne do
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkUserSession();
  }, [navigate]);

  // 2. FIXED: Double try-catch wala logic yahan daal diya
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);

    try {
      // Step A: Check if session already exists
      try {
        const currentUser = await account.get();
        if (currentUser) {
          navigate('/dashboard'); 
          return;
        }
      } catch (err) { /* Ignore - move to login */ }

      // Step B: Create New Session
      await account.createEmailPasswordSession(formData.email, formData.password);
      navigate('/dashboard'); // Login successful, dashboard bhej do

    } catch (error) {
      console.error("Login failed:", error.message);
      alert(error.message); // User ko error dikhao
    } finally {
      setIsLoginLoading(false);
    }
  };

  // ... (Baaki ke functions same rahenge)
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

  if (isCheckingAuth) {
    return <div className="flex h-screen items-center justify-center">Loading StudyHub...</div>;
  }

  // ... (Forgot Password UI code exactly same)
  if (showForgot) {
    // ... aapka existing showForgot return block
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* ... aapka left panel UI same rahega ... */}

      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* ... aapka Header / Tabs UI same rahega ... */}

          {/* ── EMAIL TAB ── */}
          {tab === 'email' && (
            // 3. FIXED: onEmailLogin hata kar handleEmailLogin lagaya
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

              {/* 4. FIXED: isLoading (redux) ki jagah isLoginLoading use kiya */}
              <button type="submit" disabled={isLoginLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50">
                {isLoginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </form>
          )}

          {/* ... aapka PHONE OTP TAB UI exactly same rahega ... */}
        </div>
      </div>
    </div>
  );
}

export default Login;