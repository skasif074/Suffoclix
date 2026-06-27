import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playlistAPI } from '../services/api';
import Navbar from '../components/Navbar';

const PlaylistPage = () => {
  const { id } = useParams();
  const { isSubscribed, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    try {
      const res = await playlistAPI.getOne(id);
      setPlaylist(res.data.playlist);
    } catch (err) {
      setError('Playlist not found.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = playlist?.videos?.filter(v => {
    if (filter === 'all') return true;
    return v.type === filter;
  }) || [];

  if (loading) return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-loader">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading playlist...</p>
      </div>
    </div>
  );

  if (error || !playlist) return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-loader" style={{ flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>📚</div>
        <h2>Playlist not found</h2>
        <Link to="/dashboard" className="btn btn-primary">← Back to Dashboard</Link>
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />

      {/* ── HERO BANNER ── */}
      <div style={{
        position: 'relative',
        background: playlist.thumbnail_path
          ? `url(${import.meta.env.VITE_API_URL}/${playlist.thumbnail_path}) center/cover`
          : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        minHeight: '340px',
        display: 'flex',
        alignItems: 'flex-end',
        overflow: 'hidden',
      }}>
        {/* Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(0deg, rgba(10,10,15,1) 0%, rgba(10,10,15,0.7) 50%, rgba(10,10,15,0.3) 100%)',
        }} />

        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(229,9,20,0.08)',
          top: '-100px',
          right: '-100px',
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: '40px',
          width: '100%',
        }}>
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              marginBottom: '24px',
              backdropFilter: 'blur(10px)',
            }}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
            {/* Playlist Icon */}
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(229,9,20,0.3), rgba(178,7,16,0.1))',
              border: '1px solid rgba(229,9,20,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              flexShrink: 0,
            }}>
              🎬
            </div>

            <div style={{ flex: 1 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span className="badge badge-red">📚 Playlist</span>
                {playlist.is_featured && (
                  <span className="badge badge-yellow">⭐ Featured</span>
                )}
                <span className="badge badge-gray">
                  {playlist.videos?.length || 0} Videos
                </span>
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: 'clamp(24px, 4vw, 40px)',
                fontWeight: '800',
                marginBottom: '8px',
                letterSpacing: '-0.5px',
              }}>
                {playlist.title}
              </h1>

              {/* Description */}
              {playlist.description && (
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  maxWidth: '600px',
                }}>
                  {playlist.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>

        {/* Filter Tabs */}
        {playlist.videos?.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '28px',
            flexWrap: 'wrap',
          }}>
            {['all', 'movie', 'series'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '50px',
                  border: filter === f ? 'none' : '1px solid var(--border)',
                  background: filter === f ? 'var(--gradient)' : 'var(--bg-card)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'var(--transition)',
                  textTransform: 'capitalize',
                }}
              >
                {f === 'all' ? '🎯 All' : f === 'movie' ? '🎬 Movies' : '📺 Series'}
              </button>
            ))}

            <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '13px', alignSelf: 'center' }}>
              {filteredVideos.length} result{filteredVideos.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Videos Grid */}
        {filteredVideos.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
            <h3>No videos found</h3>
            <p>
              {playlist.videos?.length === 0
                ? 'This playlist has no videos yet.'
                : 'No videos match this filter.'}
            </p>
            {isAdmin && (
              <Link to="/admin" className="btn btn-primary" style={{ marginTop: '20px' }}>
                + Add Videos
              </Link>
            )}
          </div>
        ) : (
          <div className="grid-4">
            {filteredVideos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                index={index}
                isSubscribed={isSubscribed}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// VIDEO CARD
// ─────────────────────────────────────────────
const VideoCard = ({ video, index, isSubscribed, isAdmin }) => {
  const canWatch = isSubscribed || isAdmin;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <Link
      to={canWatch ? `/video/${video.id}` : '/subscribe'}
      style={{ textDecoration: 'none' }}
    >
      <div
        className="card"
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        {/* Thumbnail */}
        <div style={{
          height: '160px',
          background: video.thumbnail_path
            ? `url(${apiBase}/${video.thumbnail_path}) center/cover`
            : 'linear-gradient(135deg, #1a1a2e, #16213e)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {!video.thumbnail_path && (video.type === 'movie' ? '🎬' : '📺')}

          {/* Lock overlay */}
          {!canWatch && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(2px)',
            }}>
              <div style={{
                textAlign: 'center',
                color: 'white',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>🔒</div>
                <div style={{ fontSize: '11px', fontWeight: '600' }}>Subscribe to Watch</div>
              </div>
            </div>
          )}

          {/* Play button on hover */}
          {canWatch && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
              className="play-overlay"
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(229,9,20,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
                className="play-btn"
              >
                ▶
              </div>
            </div>
          )}

          {/* Index number */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--text-secondary)',
          }}>
            {index + 1}
          </div>

          {/* Type Badge */}
          <span className={`badge ${video.type === 'movie' ? 'badge-red' : 'badge-yellow'}`}
            style={{ position: 'absolute', top: '10px', right: '10px' }}
          >
            {video.type === 'movie' ? '🎬' : '📺'}
          </span>
        </div>

        {/* Info */}
        <div style={{ padding: '14px' }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '700',
            marginBottom: '6px',
            color: 'var(--text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4',
          }}>
            {video.title}
          </h3>

          <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '8px',
          }}>
            {video.genre && (
              <span style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'var(--bg-secondary)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {video.genre}
              </span>
            )}
            {video.language && (
              <span style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'var(--bg-secondary)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {video.language}
              </span>
            )}
          </div>

          {video.description && (
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {video.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PlaylistPage;