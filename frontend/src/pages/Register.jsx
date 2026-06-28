import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Register = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
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
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
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
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(229,9,20,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
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
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
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

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input className="input" type="text" name="name" placeholder="John Doe"
                value={form.name} onChange={handleChange} required />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input className="input" type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input className="input" type="password" name="password" placeholder="Min 6 characters"
                value={form.password} onChange={handleChange} required />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Confirm Password
              </label>
              <input className="input" type="password" name="confirm" placeholder="Re-enter password"
                value={form.confirm} onChange={handleChange} required />
            </div>

            {/* Password strength */}
            {form.password && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Password strength
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{
                    width: form.password.length < 6 ? '30%' : form.password.length < 10 ? '60%' : '100%',
                    background: form.password.length < 6 ? 'var(--accent)' : form.password.length < 10 ? 'var(--warning)' : 'var(--success)',
                  }} />
                </div>
                <div style={{
                  fontSize: '11px', marginTop: '4px',
                  color: form.password.length < 6 ? 'var(--accent)' : form.password.length < 10 ? 'var(--warning)' : 'var(--success)',
                }}>
                  {form.password.length < 6 ? 'Weak' : form.password.length < 10 ? 'Medium' : 'Strong'}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px', opacity: loading ? 0.7 : 1 }}>
              {loading ? '⏳ Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>

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