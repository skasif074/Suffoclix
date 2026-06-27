import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playlistAPI, videoAPI, watchAPI } from '../services/api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user, isSubscribed, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');

  const [playlists, setPlaylists] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      const [playlistRes, continueRes] = await Promise.all([
        playlistAPI.getAll(),
        isSubscribed ? watchAPI.getContinue() : Promise.resolve({ data: { videos: [] } }),
      ]);
      setPlaylists(playlistRes.data.playlists);
      setContinueWatching(continueRes.data.videos);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchLoading(true);
    try {
      const res = await videoAPI.search(query);
      setSearchResults(res.data.videos);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-loader">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>

        {/* Welcome Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(229,9,20,0.15), rgba(178,7,16,0.05))',
          border: '1px solid rgba(229,9,20,0.2)',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: '800', marginBottom: '6px' }}>
              👋 Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {isSubscribed
                ? '✅ You have an active subscription. Enjoy watching!'
                : '⚠️ Subscribe to unlock all content.'}
            </p>
          </div>
          {!isSubscribed && !isAdmin && (
            <Link to="/subscribe" className="btn btn-primary" style={{ padding: '12px 28px' }}>
              ⭐ Subscribe Now
            </Link>
          )}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="section">
            <div className="section-title">
              🔍 Search results for "{searchQuery}"
            </div>
            {searchLoading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : searchResults.length === 0 ? (
              <div className="empty-state">
                <h3>No results found</h3>
                <p>Try searching with different keywords</p>
              </div>
            ) : (
              <div className="grid-4">
                {searchResults.map(video => (
                  <VideoCard key={video.id} video={video} isSubscribed={isSubscribed} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Continue Watching */}
        {!searchQuery && continueWatching.length > 0 && (
          <div className="section">
            <div className="section-title">▶ Continue Watching</div>
            <div style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '12px',
              scrollbarWidth: 'thin',
            }}>
              {continueWatching.map(video => (
                <ContinueCard key={video.video_id} video={video} />
              ))}
            </div>
          </div>
        )}

        {/* Playlists */}
        {!searchQuery && (
          <div className="section">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}>
              <div className="section-title" style={{ marginBottom: 0 }}>
                📚 Browse Playlists
              </div>
              {isAdmin && (
                <Link to="/admin" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  ⚙️ Manage
                </Link>
              )}
            </div>

            {playlists.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
                <h3>No playlists yet</h3>
                <p>
                  {isAdmin
                    ? 'Create your first playlist from the Admin Panel.'
                    : 'Check back soon for curated content!'}
                </p>
                {isAdmin && (
                  <Link to="/admin" className="btn btn-primary" style={{ marginTop: '20px' }}>
                    + Create Playlist
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid-3">
                {playlists.map(playlist => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PLAYLIST CARD
// ─────────────────────────────────────────────
const PlaylistCard = ({ playlist }) => (
  <Link to={`/playlist/${playlist.id}`} style={{ textDecoration: 'none' }}>
    <div className="card" style={{ cursor: 'pointer' }}>
      {/* Thumbnail */}
      <div style={{
        height: '160px',
        background: playlist.thumbnail_path
          ? `url(${import.meta.env.VITE_API_URL}/${playlist.thumbnail_path}) center/cover`
          : 'linear-gradient(135deg, #1a1a2e, #16213e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        position: 'relative',
      }}>
        {!playlist.thumbnail_path && '🎬'}
        {playlist.is_featured && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'var(--gradient)',
            color: 'white',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
          }}>
            ⭐ FEATURED
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '3px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '600',
        }}>
          {playlist.video_count} videos
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '16px' }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: '700',
          marginBottom: '6px',
          color: 'var(--text-primary)',
        }}>
          {playlist.title}
        </h3>
        {playlist.description && (
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {playlist.description}
          </p>
        )}
      </div>
    </div>
  </Link>
);

// ─────────────────────────────────────────────
// VIDEO CARD (Search Results)
// ─────────────────────────────────────────────
const VideoCard = ({ video, isSubscribed, isAdmin }) => (
  <Link
    to={(isSubscribed || isAdmin) ? `/video/${video.id}` : '/subscribe'}
    style={{ textDecoration: 'none' }}
  >
    <div className="card" style={{ cursor: 'pointer' }}>
      <div style={{
        height: '140px',
        background: video.thumbnail_path
          ? `url(${import.meta.env.VITE_API_URL}/${video.thumbnail_path}) center/cover`
          : 'linear-gradient(135deg, #1a1a2e, #16213e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '36px',
        position: 'relative',
      }}>
        {!video.thumbnail_path && (video.type === 'movie' ? '🎬' : '📺')}
        {!isSubscribed && !isAdmin && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}>
            🔒
          </div>
        )}
        <span className="badge badge-gray" style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
        }}>
          {video.type}
        </span>
      </div>
      <div style={{ padding: '12px' }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '4px',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {video.title}
        </h3>
        {video.genre && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {video.genre}
          </span>
        )}
      </div>
    </div>
  </Link>
);

// ─────────────────────────────────────────────
// CONTINUE WATCHING CARD
// ─────────────────────────────────────────────
const ContinueCard = ({ video }) => (
  <Link to={`/video/${video.video_id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
    <div style={{
      width: '220px',
      background: 'var(--bg-card)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      transition: 'var(--transition)',
    }}>
      <div style={{
        height: '120px',
        background: video.thumbnail_path
          ? `url(${import.meta.env.VITE_API_URL}/${video.thumbnail_path}) center/cover`
          : 'linear-gradient(135deg, #1a1a2e, #16213e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        position: 'relative',
      }}>
        {!video.thumbnail_path && '▶'}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(229,9,20,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}>
            ▶
          </div>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="progress-bar" style={{ borderRadius: 0 }}>
        <div className="progress-bar-fill" style={{ width: `${video.progress_percent || 0}%` }} />
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {video.title}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {video.progress_percent || 0}% watched
        </div>
      </div>
    </div>
  </Link>
);

export default Dashboard;