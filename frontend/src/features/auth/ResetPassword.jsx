import { useState } from 'react';
import {
  useSearchParams,
  useNavigate,
} from 'react-router-dom';

import authService from '../features/auth/authService';

import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // Appwrite sends these values in the recovery URL
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  const handleReset = async (e) => {
    e.preventDefault();

    setError('');

    if (!userId || !secret) {
      setError(
        'Invalid or expired reset link. Please request a new one.'
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        'Password must be at least 8 characters long.'
      );
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError(
        'Password must contain at least one uppercase letter.'
      );
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError(
        'Password must contain at least one number.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authService.confirmPasswordRecovery(
        userId,
        secret,
        newPassword
      );

      setSuccess(true);

      setTimeout(() => {
        navigate('/login', {
          replace: true,
        });
      }, 3000);
    } catch (err) {
      console.error(
        '[ResetPassword] Error:',
        err
      );

      setError(
        err?.message ||
          'Failed to reset password. The reset link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="success-icon">
            ✓
          </div>

          <h2>
            Password Reset Successfully!
          </h2>

          <p>
            Your password has been changed.
            Redirecting to login...
          </p>

          <div className="countdown">
            Redirecting in 3 seconds...
          </div>

          <button
            onClick={() => navigate('/login')}
            className="btn-primary btn-full"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>Reset Your Password</h2>

        <p className="subtitle">
          Create a new password for your account.
        </p>

        {!userId || !secret ? (
          <>
            <div className="error-message">
              <span>
                ⚠️ Invalid or expired reset link.
                Please request a new one.
              </span>
            </div>

            <div className="actions">
              <button
                onClick={() =>
                  navigate('/forgot-password')
                }
                className="btn-primary btn-full"
              >
                Request New Reset Link
              </button>

              <button
                onClick={() => navigate('/login')}
                className="btn-secondary btn-full"
              >
                Back to Login
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label htmlFor="newPassword">
                New Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? '👁️'
                    : '👁️‍🗨️'}
                </button>
              </div>

              <div className="password-requirements">
                <p
                  className={
                    newPassword.length >= 8
                      ? 'valid'
                      : ''
                  }
                >
                  ✓ At least 8 characters
                </p>

                <p
                  className={
                    /[A-Z]/.test(newPassword)
                      ? 'valid'
                      : ''
                  }
                >
                  ✓ At least one uppercase letter
                </p>

                <p
                  className={
                    /[0-9]/.test(newPassword)
                      ? 'valid'
                      : ''
                  }
                >
                  ✓ At least one number
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword
                    ? '👁️'
                    : '👁️‍🗨️'}
                </button>
              </div>

              {confirmPassword &&
                newPassword !==
                  confirmPassword && (
                  <p className="match-error">
                    Passwords do not match
                  </p>
                )}

              {confirmPassword &&
                newPassword ===
                  confirmPassword && (
                  <p className="match-success">
                    ✓ Passwords match
                  </p>
                )}
            </div>

            {error && (
              <div className="error-message">
                <span>⚠️ {error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !newPassword ||
                !confirmPassword
              }
              className="btn-primary btn-full"
            >
              {loading
                ? 'Resetting Password...'
                : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="divider">or</div>

        <div className="links">
          <button
            onClick={() => navigate('/login')}
            className="link-btn"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}