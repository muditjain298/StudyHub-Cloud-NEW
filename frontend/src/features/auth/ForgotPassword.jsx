import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './ForgotPassword.css'; // Optional styling

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.createPasswordRecovery(email);
      setSent(true);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to send recovery email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <h2>Check Your Email</h2>
          <div className="success-message">
            <p>✓ We've sent a password reset link to:</p>
            <p className="email-highlight">{email}</p>
          </div>
          
          <div className="instructions">
            <h3>What to do next:</h3>
            <ol>
              <li>Check your inbox for an email from us</li>
              <li>Click the "Reset Password" link in the email</li>
              <li>Follow the instructions to create a new password</li>
            </ol>
            <p className="note">💡 The link will expire in 1 hour</p>
          </div>

          <div className="actions">
            <button onClick={() => setSent(false)} className="btn-secondary">
              Try Another Email
            </button>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Back to Login
            </button>
          </div>

          <p className="help-text">
            Didn't receive the email? Check your spam folder or <button onClick={() => setSent(false)}>try again</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>Forgot Your Password?</h2>
        <p className="subtitle">Enter your email address and we'll send you a link to reset your password.</p>

        <form onSubmit={handleForgot}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !email}
            className="btn-primary btn-full"
          >
            {loading ? 'Sending Recovery Link...' : 'Send Recovery Link'}
          </button>
        </form>

        <div className="divider">or</div>

        <div className="links">
          <p>
            Remember your password? 
            <button onClick={() => navigate('/login')} className="link-btn">
              Back to Login
            </button>
          </p>
          <p>
            Don't have an account? 
            <button onClick={() => navigate('/register')} className="link-btn">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
