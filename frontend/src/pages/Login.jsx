import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { BookOpen, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = "/api/auth";

function Login() {
  const navigate = useNavigate();
  const [showForgot, setShowForgot] = useState(false);

  // Email/password form
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // NOTE: No useEffect / session-check here anymore.
  // App.jsx already decides whether to render <Login /> at all
  // (it only renders Login when isAuthenticated is false).
  // Checking the session again here was racing with App.jsx's own
  // check and causing the redirect loop.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);

    try {
      try {
        await account.deleteSession('current');
      } catch {
        // No active session to clear.
      }

      await account.createEmailPasswordSession(formData.email, formData.password);
      await account.get();
      navigate('/');
    } catch (error) {
      setLoginError(error.message || 'Login failed');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    const successUrl = `${window.location.origin}/`;
    const failureUrl = `${window.location.origin}/login`;
    account.createOAuth2Session(provider, successUrl, failureUrl);
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
      <div className="auth-page flex min-h-screen items-center justify-center px-6 py-10">
        <div className="auth-card w-full max-w-md p-8">
          <button onClick={() => setShowForgot(false)} className="auth-back mb-8">← Back to Login</button>
          <h2 className="auth-title mb-2">Forgot password?</h2>
          <p className="auth-subtitle mb-7">We&apos;ll send a reset link to your email.</p>
          {forgotMessage ? (
            <p className="auth-success">{forgotMessage}</p>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Email ID" className="auth-input w-full" />
              <button type="submit" disabled={forgotLoading} className="auth-submit w-full">{forgotLoading ? 'Sending...' : 'Send Reset Link'}</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page min-h-screen overflow-hidden px-6 py-8 lg:px-12">
      <div className="auth-orb auth-orb-top" />
      <div className="auth-orb auth-orb-bottom" />

      <main className="auth-layout mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-between gap-12">
        <section className="auth-hero hidden lg:block">
          <div className="auth-rule" />
          <h1>Welcome Back<span>!</span></h1>
          <div className="auth-tagline">Skip the lag ?</div>
        </section>

        <section className="auth-card w-full max-w-[362px] p-7 sm:p-8">
          <div className="mb-6">
            <div className="auth-brand-mark"><BookOpen size={17} /></div>
            <h2 className="auth-title">Login</h2>
            <p className="auth-subtitle">Glad you&apos;re back!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="auth-field">
              <span>Email ID</span>
              <input type="email" name="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="you@example.com" className="auth-input" />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter your password" className="auth-input w-full pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="auth-icon-button" aria-label={showPass ? 'Hide password' : 'Show password'}>{showPass ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </label>

            <label className="auth-remember"><input type="checkbox" defaultChecked /><span><Check size={10} /></span>Remember me</label>
            <button type="submit" disabled={isLoginLoading} className="auth-submit w-full">{isLoginLoading && <Loader2 className="animate-spin" size={16} />}Login</button>
            {loginError && <p className="auth-error" role="alert">{loginError}</p>}
            <button type="button" onClick={() => setShowForgot(true)} className="auth-forgot">Forgot password?</button>
          </form>

          <div className="auth-divider"><span>Or</span></div>
          <div className="auth-socials">
            <button type="button" onClick={() => handleOAuthLogin('google')} aria-label="Continue with Google" className="social-google"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.22Z"/><path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"/><path fill="#FBBC05" d="M6.54 13.6a5.86 5.86 0 0 1 0-3.2V7.87H3.3a9.75 9.75 0 0 0 0 8.26l3.24-2.53Z"/><path fill="#EA4335" d="M12 6.37c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.42 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.37l3.24 2.53C7.31 8.09 9.46 6.37 12 6.37Z"/></svg><span>Google</span></button>
            <button type="button" onClick={() => handleOAuthLogin('github')} aria-label="Continue with GitHub" className="social-github"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.8 9.8 0 0 0-3.1 19.1c.49.09.67-.21.67-.47v-1.67c-2.73.59-3.3-1.16-3.3-1.16-.45-1.14-1.1-1.45-1.1-1.45-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.18-.25-4.47-1.09-4.47-4.85 0-1.07.38-1.95 1.02-2.64-.1-.25-.44-1.25.1-2.6 0 0 .83-.27 2.69 1.01A9.38 9.38 0 0 1 12 7.05c.84 0 1.68.11 2.46.33 1.86-1.28 2.69-1.01 2.69-1.01.54 1.35.2 2.35.1 2.6.64.69 1.02 1.57 1.02 2.64 0 3.77-2.3 4.6-4.48 4.84.35.3.67.9.67 1.82v2.69c0 .26.18.57.68.47A9.8 9.8 0 0 0 12 2.2Z"/></svg><span>GitHub</span></button>
          </div>
          <p className="auth-register">Don&apos;t have an account ? <a href="/register">Signup</a></p>
          <nav className="auth-footer"><a href="#terms">Terms &amp; Conditions</a><a href="#support">Support</a><a href="#care">Customer Care</a></nav>
        </section>
      </main>
    </div>
  );
}

export default Login;