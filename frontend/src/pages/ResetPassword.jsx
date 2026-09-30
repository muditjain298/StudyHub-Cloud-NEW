import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { account } from '../lib/appwrite';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!userId || !secret) {
      setError(
        'Invalid or expired reset link. Please request a new password reset link.'
      );
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      await account.updateRecovery({
        userId,
        secret,
        password,
      });

      setDone(true);

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      console.error('[ResetPassword] Appwrite recovery error:', err);

      setError(
        err?.message ||
          'Unable to reset password. The recovery link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <BookOpen className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-4" />

        {done ? (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Password Reset!
            </h2>

            <p className="text-gray-500 dark:text-gray-400">
              Your password has been successfully changed.
            </p>

            <p className="text-sm text-gray-400 mt-2">
              Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Set New Password
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Enter a new password for your account.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>

                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>

                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
              >
                {loading && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;