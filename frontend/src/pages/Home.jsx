import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Home = () => {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Hero Section */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 24px',
      }}>
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(229,9,20,0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }} />

        {/* Animated background circles */}
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'rgba(229,9,20,0.05)',
          top: '-200px',
          right: '-200px',
          animation: 'pulse 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(229,9,20,0.05)',
          bottom: '-100px',
          left: '-100px',
          animation: 'pulse 4s ease-in-out infinite 2s',
        }} />

        <div style={{
          textAlign: 'center',
          maxWidth: '800px',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            background: 'rgba(229,9,20,0.1)',
            border: '1px solid rgba(229,9,20,0.3)',
            borderRadius: '50px',
            fontSize: '13px',
            color: 'var(--accent)',
            fontWeight: '600',
            marginBottom: '32px',
          }}>
            🎬 Stream Unlimited Content
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(40px, 8vw, 80px)',
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '24px',
            letterSpacing: '-2px',
          }}>
            Watch Anywhere,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #e50914, #ff6b6b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Anytime
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: 'var(--text-secondary)',
            marginBottom: '48px',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 48px',
          }}>
            Stream movies and series in stunning quality. 
            Starting at just <strong style={{ color: 'white' }}>₹1/month</strong>. 
            No hidden fees, cancel anytime.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary" style={{
                  padding: '16px 40px',
                  fontSize: '16px',
                  borderRadius: '50px',
                }}>
                  ▶ Start Watching
                </Link>
                <Link to="/subscribe" className="btn btn-secondary" style={{
                  padding: '16px 40px',
                  fontSize: '16px',
                  borderRadius: '50px',
                }}>
                  ⭐ View Plans
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary" style={{
                  padding: '16px 40px',
                  fontSize: '16px',
                  borderRadius: '50px',
                }}>
                  🚀 Get Started Free
                </Link>
                <Link to="/login" className="btn btn-secondary" style={{
                  padding: '16px 40px',
                  fontSize: '16px',
                  borderRadius: '50px',
                }}>
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '48px',
            justifyContent: 'center',
            marginTop: '64px',
            flexWrap: 'wrap',
          }}>
            {[
              { value: '1000+', label: 'Movies & Series' },
              { value: '₹1', label: 'Starting Price' },
              { value: 'HD', label: 'Stream Quality' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '800',
                  color: 'var(--accent)',
                  marginBottom: '4px',
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ background: 'var(--bg-secondary)', padding: '80px 24px' }}>
        <div className="container">
          <h2 style={{
            textAlign: 'center',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '800',
            marginBottom: '16px',
          }}>
            Why Choose Suffoclix?
          </h2>
          <p style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            marginBottom: '56px',
            fontSize: '16px',
          }}>
            Everything you need for an amazing streaming experience
          </p>

          <div className="grid-3">
            {[
              { icon: '🎬', title: 'Huge Library', desc: 'Movies, series and more curated into amazing playlists.' },
              { icon: '📱', title: 'Watch Anywhere', desc: 'Stream on any device — phone, tablet, laptop or TV.' },
              { icon: '⚡', title: 'Fast Streaming', desc: 'Optimized video delivery for buffer-free experience.' },
              { icon: '📜', title: 'Watch History', desc: 'Resume exactly where you left off, every time.' },
              { icon: '💰', title: 'Affordable Plans', desc: 'Starting at just ₹1/month. No hidden charges.' },
              { icon: '🔒', title: 'Secure & Private', desc: 'Your data is encrypted and never shared.' },
            ].map((feature, i) => (
              <div key={i} className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div style={{ padding: '80px 24px' }}>
        <div className="container">
          <h2 style={{
            textAlign: 'center',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '800',
            marginBottom: '16px',
          }}>
            Simple Pricing
          </h2>
          <p style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            marginBottom: '56px',
          }}>
            No hidden fees. Cancel anytime.
          </p>

          <div style={{
            display: 'flex',
            gap: '24px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            {[
              { name: 'Basic', price: '₹1', period: '1 Month', features: ['All Movies & Series', 'HD Quality', 'Watch History', 'Cancel Anytime'], popular: false },
              { name: 'Standard', price: '₹2', period: '2 Months', features: ['All Movies & Series', 'HD Quality', 'Watch History', 'Cancel Anytime', 'Save 0%'], popular: true },
              { name: 'Premium', price: '₹3', period: '3 Months', features: ['All Movies & Series', 'HD Quality', 'Watch History', 'Cancel Anytime', 'Best Value'], popular: false },
            ].map((plan, i) => (
              <div key={i} style={{
                flex: '1',
                minWidth: '240px',
                maxWidth: '280px',
                background: plan.popular ? 'linear-gradient(135deg, rgba(229,9,20,0.15), rgba(178,7,16,0.1))' : 'var(--bg-card)',
                border: plan.popular ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                position: 'relative',
                textAlign: 'center',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--gradient)',
                    color: 'white',
                    padding: '4px 20px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}>
                    POPULAR
                  </div>
                )}
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                  {plan.name}
                </h3>
                <div style={{
                  fontSize: '48px',
                  fontWeight: '800',
                  color: plan.popular ? 'var(--accent)' : 'white',
                  marginBottom: '4px',
                }}>
                  {plan.price}
                </div>
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  marginBottom: '24px',
                }}>
                  {plan.period}
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '28px',
                  textAlign: 'left',
                }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                    }}>
                      <span style={{ color: 'var(--success)' }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <Link
                  to={user ? '/subscribe' : '/register'}
                  className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        padding: '32px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '14px',
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #e50914, #ff6b6b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
        }}>
          🎬 Suffoclix
        </div>
        <p>© 2024 Suffoclix. All rights reserved.</p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default Home;