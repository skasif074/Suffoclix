import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { signInWithGoogle } from '../services/firebase';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.message);
        return;
      }
      const res = await authAPI.googleLogin({
        name: result.user.name,
        email: result.user.email,
        photo: result.user.photo,
      });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(229,9,20,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #e50914, #ff6b6b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textDecoration: 'none',
          }}>
            🎬 Suffoclix
          </Link>
          <p style={{
            color: 'var(--text-secondary)',
            marginTop: '8px',
            fontSize: '14px',
          }}>
            Create your account and start watching!
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(229,9,20,0.1)',
              border: '1px solid rgba(229,9,20,0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--accent)',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'white',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '20px',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s',
              opacity: googleLoading ? 0.7 : 1,
            }}
          >
            {googleLoading ? (
              '⏳ Signing up...'
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                  <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or register with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '6px',
                color: 'var(--text-secondary)',
              }}>
                Full Name
              </label>
              <input
                className="input"
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '6px',
                color: 'var(--text-secondary)',
              }}>
                Email Address
              </label>
              <input
                className="input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '6px',
                color: 'var(--text-secondary)',
              }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '6px',
                color: 'var(--text-secondary)',
              }}>
                Confirm Password
              </label>
              <input
                className="input"
                type="password"
                name="confirm"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password strength */}
            {form.password && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginBottom: '6px'
                }}>
                  Password strength
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{
                    width: form.password.length < 6 ? '30%'
                      : form.password.length < 10 ? '60%'
                      : '100%',
                    background: form.password.length < 6 ? 'var(--accent)'
                      : form.password.length < 10 ? 'var(--warning)'
                      : 'var(--success)',
                  }} />
                </div>
                <div style={{
                  fontSize: '11px',
                  marginTop: '4px',
                  color: form.password.length < 6 ? 'var(--accent)'
                    : form.password.length < 10 ? 'var(--warning)'
                    : 'var(--success)',
                }}>
                  {form.password.length < 6 ? 'Weak'
                    : form.password.length < 10 ? 'Medium'
                    : 'Strong'}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '13px',
                fontSize: '15px',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          {/* Terms */}
          <p style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: '1.5',
          }}>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>

          {/* Login Link */}
          <p style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: 'var(--accent)',
              fontWeight: '600',
              textDecoration: 'none',
            }}>
              Sign In
            </Link>
          </p>
        </div>

        {/* Back */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;