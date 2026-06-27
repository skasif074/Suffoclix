import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { watchAPI, paymentAPI } from '../services/api';
import Navbar from '../components/Navbar';

const History = () => {
  const { isSubscribed, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [clearing, setClearing] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const promises = [
        (isSubscribed || isAdmin) ? watchAPI.getHistory() : Promise.resolve({ data: { history: [] } }),
        paymentAPI.getHistory(),
      ];
      const [historyRes, paymentRes] = await Promise.all(promises);
      setHistory(historyRes.data.history || []);
      setPayments(paymentRes.data.payments || []);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async (contentId) => {
    setClearing(contentId);
    try {
      await watchAPI.clearHistory(contentId);
      setHistory(prev => prev.filter(h => h.video_id !== contentId));
    } catch (err) {
      console.error('Clear history error:', err);
    } finally {
      setClearing(null);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (secs) => {
    if (!secs) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-loader">
        <div className="spinner" />
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: '800',
            marginBottom: '8px',
          }}>
            📜 My Activity
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Your watch history and payment records
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '4px',
          width: 'fit-content',
        }}>
          {[
            { key: 'history', label: '📺 Watch History', count: history.length },
            { key: 'payments', label: '💳 Payments', count: payments.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.key ? 'var(--gradient)' : 'transparent',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {tab.label}
              <span style={{
                background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '11px',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── WATCH HISTORY TAB ── */}
        {activeTab === 'history' && (
          <>
            {!isSubscribed && !isAdmin ? (
              <div className="empty-state">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h3>Subscribe to Track History</h3>
                <p>Your watch history will appear here once you subscribe.</p>
                <Link to="/subscribe" className="btn btn-primary" style={{ marginTop: '20px' }}>
                  ⭐ Subscribe Now
                </Link>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
                <h3>No Watch History</h3>
                <p>Videos you watch will appear here.</p>
                <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '20px' }}>
                  🎬 Start Watching
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onClear={handleClearHistory}
                    clearing={clearing}
                    formatDate={formatDate}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'payments' && (
          <>
            {payments.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
                <h3>No Payment History</h3>
                <p>Your subscription payments will appear here.</p>
                <Link to="/subscribe" className="btn btn-primary" style={{ marginTop: '20px' }}>
                  ⭐ Subscribe Now
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Summary Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(229,9,20,0.1), rgba(178,7,16,0.05))',
                  border: '1px solid rgba(229,9,20,0.2)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '8px',
                  display: 'flex',
                  gap: '32px',
                  flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Total Spent
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent)' }}>
                      ₹{payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Total Payments
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800' }}>
                      {payments.length}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Total Months
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--success)' }}>
                      {payments.reduce((sum, p) => sum + parseInt(p.months || 0), 0)}
                    </div>
                  </div>
                </div>

                {payments.map((payment) => (
                  <PaymentItem
                    key={payment.id}
                    payment={payment}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// HISTORY ITEM
// ─────────────────────────────────────────────
const HistoryItem = ({ item, onClear, clearing, formatDate, formatTime }) => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
      display: 'flex',
      gap: '0',
      transition: 'var(--transition)',
    }}>
      {/* Thumbnail */}
      <Link to={`/video/${item.video_id}`} style={{
        flexShrink: 0,
        width: '160px',
        minHeight: '100px',
        background: item.thumbnail_path
          ? `url(${apiBase}/${item.thumbnail_path}) center/cover`
          : 'linear-gradient(135deg, #1a1a2e, #16213e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        position: 'relative',
        textDecoration: 'none',
      }}>
        {!item.thumbnail_path && (item.type === 'movie' ? '🎬' : '📺')}

        {/* Play overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(229,9,20,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}>▶</div>
        </div>
      </Link>

      {/* Info */}
      <div style={{
        flex: 1,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minWidth: 0,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span className={`badge ${item.type === 'movie' ? 'badge-red' : 'badge-yellow'}`}>
              {item.type === 'movie' ? '🎬 Movie' : '📺 Series'}
            </span>
            {item.genre && <span className="badge badge-gray">{item.genre}</span>}
            {item.completed && <span className="badge badge-green">✓ Completed</span>}
          </div>

          <Link to={`/video/${item.video_id}`} style={{
            textDecoration: 'none',
            color: 'var(--text-primary)',
          }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: '700',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.title}
            </h3>
          </Link>

          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '12px',
          }}>
            Watched {formatDate(item.last_watched)} •{' '}
            {formatTime(item.watched_seconds)} watched
          </div>
        </div>

        {/* Progress */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}>
            <span>{item.progress_percent || 0}% watched</span>
            {item.total_seconds > 0 && (
              <span>{formatTime(item.total_seconds - item.watched_seconds)} remaining</span>
            )}
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${item.progress_percent || 0}%`,
                background: item.completed ? 'var(--success)' : 'var(--gradient)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Link
          to={`/video/${item.video_id}`}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
        >
          {item.completed ? '↩ Rewatch' : '▶ Resume'}
        </Link>
        <button
          onClick={() => onClear(item.video_id)}
          disabled={clearing === item.video_id}
          className="btn btn-danger"
          style={{ padding: '8px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
        >
          {clearing === item.video_id ? '...' : '🗑 Remove'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PAYMENT ITEM
// ─────────────────────────────────────────────
const PaymentItem = ({ payment, formatDate }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* Icon */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'rgba(70,211,105,0.1)',
        border: '1px solid rgba(70,211,105,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        flexShrink: 0,
      }}>
        💳
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700' }}>
            {payment.plan_name} Plan
          </span>
          <span className="badge badge-green">✓ Success</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {payment.months} Month{payment.months > 1 ? 's' : ''} •{' '}
          {formatDate(payment.created_at)} •{' '}
          ID: {payment.razorpay_payment_id?.slice(-8)}
        </div>
      </div>
    </div>

    <div style={{
      fontSize: '24px',
      fontWeight: '800',
      color: 'var(--success)',
    }}>
      ₹{parseFloat(payment.amount).toFixed(2)}
    </div>
  </div>
);

export default History;