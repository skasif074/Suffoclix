import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <Link to="/" style={{
          fontSize: '24px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #e50914, #ff6b6b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textDecoration: 'none',
          letterSpacing: '-0.5px'
        }}>
          🎬 Suffoclix
        </Link>

        {/* Desktop Nav Links */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }} className="desktop-nav">
            <NavLink to="/dashboard" active={isActive('/dashboard')}>Home</NavLink>
            <NavLink to="/history" active={isActive('/history')}>History</NavLink>
            {isAdmin && (
              <NavLink to="/admin" active={isActive('/admin')}>
                ⚙️ Admin
              </NavLink>
            )}
          </div>
        )}

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* Search */}
          {user && (
            <>
              {searchOpen ? (
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    autoFocus
                    className="input"
                    style={{ width: '220px', padding: '8px 14px', fontSize: '13px' }}
                    placeholder="Search movies, series..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }}>
                    🔍
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px' }}
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px' }}
                >
                  🔍
                </button>
              )}
            </>
          )}

          {/* Subscribe Badge */}
          {user && !isSubscribed && !isAdmin && (
            <Link to="/subscribe" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              ⭐ Subscribe
            </Link>
          )}

          {user && isSubscribed && (
            <span className="badge badge-green">✓ Pro</span>
          )}

          {/* User Menu */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e50914, #b20710)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: 'white',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '8px',
                  minWidth: '200px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  zIndex: 1000,
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</div>
                    <div style={{ marginTop: '6px' }}>
                      {isAdmin
                        ? <span className="badge badge-red">Admin</span>
                        : isSubscribed
                          ? <span className="badge badge-green">Pro Member</span>
                          : <span className="badge badge-gray">Free</span>
                      }
                    </div>
                  </div>

                  <MenuItem to="/dashboard" onClick={() => setMenuOpen(false)}>
                    🏠 Dashboard
                  </MenuItem>
                  <MenuItem to="/history" onClick={() => setMenuOpen(false)}>
                    📜 Watch History
                  </MenuItem>
                  {!isSubscribed && !isAdmin && (
                    <MenuItem to="/subscribe" onClick={() => setMenuOpen(false)}>
                      ⭐ Subscribe
                    </MenuItem>
                  )}
                  {isAdmin && (
                    <MenuItem to="/admin" onClick={() => setMenuOpen(false)}>
                      ⚙️ Admin Panel
                    </MenuItem>
                  )}
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: 'rgba(229,9,20,0.1)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(229,9,20,0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        textAlign: 'left',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'var(--transition)',
                      }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          {user && (
            <button
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'none',
              }}
            >
              ☰
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Nav */}
      {user && menuOpen && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '16px',
          zIndex: 998,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }} className="mobile-nav">
          <MobileNavLink to="/dashboard" onClick={() => setMenuOpen(false)}>🏠 Home</MobileNavLink>
          <MobileNavLink to="/history" onClick={() => setMenuOpen(false)}>📜 History</MobileNavLink>
          {!isSubscribed && !isAdmin && (
            <MobileNavLink to="/subscribe" onClick={() => setMenuOpen(false)}>⭐ Subscribe</MobileNavLink>
          )}
          {isAdmin && (
            <MobileNavLink to="/admin" onClick={() => setMenuOpen(false)}>⚙️ Admin Panel</MobileNavLink>
          )}
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
            🚪 Logout
          </button>
        </div>
      )}

      {/* Spacer */}
      <div style={{ height: '64px' }} />

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </>
  );
};

const NavLink = ({ to, children, active }) => (
  <Link to={to} style={{
    padding: '8px 16px',
    borderRadius: '8px',
    color: active ? 'white' : 'var(--text-secondary)',
    background: active ? 'rgba(229,9,20,0.15)' : 'transparent',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'var(--transition)',
    border: active ? '1px solid rgba(229,9,20,0.3)' : '1px solid transparent',
  }}>
    {children}
  </Link>
);

const MenuItem = ({ to, children, onClick }) => (
  <Link to={to} onClick={onClick} style={{
    display: 'block',
    padding: '10px 16px',
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '8px',
    transition: 'var(--transition)',
  }}
    onMouseEnter={e => e.target.style.background = 'var(--bg-hover)'}
    onMouseLeave={e => e.target.style.background = 'transparent'}
  >
    {children}
  </Link>
);

const MobileNavLink = ({ to, children, onClick }) => (
  <Link to={to} onClick={onClick} style={{
    display: 'block',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    borderRadius: '8px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
  }}>
    {children}
  </Link>
);

export default Navbar;