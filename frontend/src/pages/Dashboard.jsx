import { useState, useEffect, useRef } from 'react';
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

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (searchQuery) handleSearch(searchQuery);
    else setSearchResults([]);
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      const [playlistRes, continueRes] = await Promise.all([
        playlistAPI.getAll(),
        (isSubscribed || isAdmin)
          ? watchAPI.getContinue()
          : Promise.resolve({ data: { videos: [] } }),
      ]);

      // Fetch videos for each playlist
      const playlistsWithVideos = await Promise.all(
        playlistRes.data.playlists.map(async (p) => {
          const res = await playlistAPI.getOne(p.id);
          return { ...p, videos: res.data.playlist.videos || [] };
        })
      );

      setPlaylists(playlistsWithVideos);
      setContinueWatching(continueRes.data.videos || []);
    } catch (err) {
      console.error('Dashboard error:', err);
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
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-loader">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>Loading...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero Banner */}
      {!searchQuery && (
        <div style={{
          position: 'relative',
          height: '420px',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a0f 50%, #0a0a0f 100%)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          marginBottom: '8px',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 50%, rgba(229,9,20,0.15) 0%, transparent 60%)',
          }} />
          <div style={{
            position: 'absolute',
            width: '500px', height: '500px',
            borderRadius: '50%',
            background: 'rgba(229,9,20,0.05)',
            right: '-100px', top: '-100px',
          }} />

          <div style={{ position: 'relative', zIndex: 1, padding: '0 48px', maxWidth: '600px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(229,9,20,0.15)',
              border: '1px solid rgba(229,9,20,0.3)',
              borderRadius: '50px',
              padding: '6px 16px',
              fontSize: '12px',
              color: 'var(--accent)',
              fontWeight: '700',
              marginBottom: '20px',
              letterSpacing: '1px',
            }}>
              🎬 SUFFOCLIX ORIGINALS
            </div>

            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 52px)',
              fontWeight: '900',
              lineHeight: '1.1',
              marginBottom: '16px',
              letterSpacing: '-1px',
            }}>
              Welcome back,{' '}
              <span style={{
                background: 'linear-gradient(135deg, #e50914, #ff6b6b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {user?.name?.split(' ')[0]}!
              </span>
            </h1>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '15px',
              lineHeight: '1.6',
              marginBottom: '28px',
            }}>
              {isSubscribed || isAdmin
                ? `✅ Active subscription • ${playlists.length} playlists available`
                : '⚠️ Subscribe to unlock all content'}
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {isSubscribed || isAdmin ? (
                <Link to={playlists[0] ? `/playlist/${playlists[0].id}` : '/dashboard'} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '8px' }}>
                  ▶ Start Watching
                </Link>
              ) : (
                <Link to="/subscribe" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '8px' }}>
                  ⭐ Subscribe Now
                </Link>
              )}
              <Link to="/history" className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '8px' }}>
                📜 My History
              </Link>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 0 60px' }}>

        {/* Search Results */}
        {searchQuery && (
          <div style={{ padding: '32px 48px 0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-secondary)' }}>
              🔍 Results for <span style={{ color: 'white' }}>"{searchQuery}"</span>
            </h2>
            {searchLoading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : searchResults.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <h3>No results found</h3>
                <p>Try different keywords</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '16px',
              }}>
                {searchResults.map(video => (
                  <VideoCard key={video.id} video={video} isSubscribed={isSubscribed} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Continue Watching Row */}
        {!searchQuery && continueWatching.length > 0 && (
          <PlaylistRow
            title="▶ Continue Watching"
            videos={continueWatching.map(v => ({
              ...v,
              id: v.video_id,
              progress_percent: v.progress_percent,
            }))}
            isSubscribed={isSubscribed}
            isAdmin={isAdmin}
            isContinue={true}
          />
        )}

        {/* Playlist Rows */}
        {!searchQuery && playlists.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '60px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎬</div>
            <h3>No playlists yet</h3>
            <p>{isAdmin ? 'Create playlists from Admin Panel.' : 'Check back soon!'}</p>
            {isAdmin && (
              <Link to="/admin" className="btn btn-primary" style={{ marginTop: '20px' }}>
                + Create Playlist
              </Link>
            )}
          </div>
        ) : (
          !searchQuery && playlists.map(playlist => (
            <PlaylistRow
              key={playlist.id}
              title={playlist.title}
              playlistId={playlist.id}
              description={playlist.description}
              videos={playlist.videos || []}
              isSubscribed={isSubscribed}
              isAdmin={isAdmin}
              isFeatured={playlist.is_featured}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PLAYLIST ROW — Horizontal scroll like Hotstar
// ─────────────────────────────────────────────
const PlaylistRow = ({ title, playlistId, description, videos, isSubscribed, isAdmin, isContinue, isFeatured }) => {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 600, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  if (videos.length === 0) return null;

  return (
    <div style={{ marginBottom: '40px', position: 'relative' }}>
      {/* Row Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '4px', height: '22px',
            background: 'var(--gradient)',
            borderRadius: '2px',
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>
                {title}
              </h2>
              {isFeatured && (
                <span style={{
                  background: 'var(--gradient)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.5px',
                }}>
                  FEATURED
                </span>
              )}
              <span style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                fontWeight: '500',
              }}>
                {videos.length} {videos.length === 1 ? 'video' : 'videos'}
              </span>
            </div>
            {description && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {playlistId && (
          <Link to={`/playlist/${playlistId}`} style={{
            color: 'var(--accent)',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
          >
            See All →
          </Link>
        )}
      </div>

      {/* Scroll Container */}
      <div style={{ position: 'relative' }}>
        {/* Left Arrow */}
        {canScrollLeft && (
          <button onClick={() => scroll(-1)} style={{
            position: 'absolute',
            left: 0, top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '48px', height: '100%',
            background: 'linear-gradient(to right, rgba(10,10,15,0.95), transparent)',
            border: 'none',
            color: 'white',
            fontSize: '22px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>‹</button>
        )}

        {/* Videos Row */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            padding: '8px 48px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {videos.map((video, index) => (
            isContinue
              ? <ContinueCard key={video.id || index} video={video} />
              : <VideoCard key={video.id || index} video={video} index={index} isSubscribed={isSubscribed} isAdmin={isAdmin} />
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button onClick={() => scroll(1)} style={{
            position: 'absolute',
            right: 0, top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '48px', height: '100%',
            background: 'linear-gradient(to left, rgba(10,10,15,0.95), transparent)',
            border: 'none',
            color: 'white',
            fontSize: '22px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>›</button>
        )}
      </div>

      <style>{`.scroll-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

// ─────────────────────────────────────────────
// VIDEO CARD
// ─────────────────────────────────────────────
const VideoCard = ({ video, index, isSubscribed, isAdmin }) => {
  const canWatch = isSubscribed || isAdmin;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={canWatch ? `/video/${video.id}` : '/subscribe'}
      style={{ textDecoration: 'none', flexShrink: 0 }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '180px',
          transition: 'transform 0.2s ease',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: 'center bottom',
        }}
      >
        {/* Thumbnail */}
        <div style={{
          width: '180px',
          height: '100px',
          borderRadius: '8px',
          background: video.thumbnail_path
            ? `url(${apiBase}/${video.thumbnail_path}) center/cover`
            : `linear-gradient(135deg, #1a1a2e, #16213e)`,
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '8px',
          border: hovered ? '2px solid var(--accent)' : '2px solid transparent',
          transition: 'border 0.2s',
        }}>
          {!video.thumbnail_path && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px',
            }}>
              {video.type === 'movie' ? '🎬' : '📺'}
            </div>
          )}

          {/* Lock */}
          {!canWatch && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(2px)',
            }}>
              <span style={{ fontSize: '20px' }}>🔒</span>
            </div>
          )}

          {/* Play overlay on hover */}
          {canWatch && hovered && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(229,9,20,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', color: 'white',
              }}>▶</div>
            </div>
          )}

          {/* Episode number */}
          {index !== undefined && (
            <div style={{
              position: 'absolute', top: '6px', left: '6px',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--text-secondary)',
            }}>
              {index + 1}
            </div>
          )}

          {/* Type badge */}
          <div style={{
            position: 'absolute', top: '6px', right: '6px',
            background: video.type === 'movie' ? 'rgba(229,9,20,0.8)' : 'rgba(255,215,0,0.8)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '9px',
            fontWeight: '700',
            color: video.type === 'movie' ? 'white' : '#000',
            textTransform: 'uppercase',
          }}>
            {video.type === 'movie' ? 'Movie' : 'EP'}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '0 2px' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            color: hovered ? 'white' : 'var(--text-secondary)',
            transition: 'color 0.2s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '3px',
          }}>
            {video.title}
          </div>
          {video.genre && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {video.genre}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

// ─────────────────────────────────────────────
// CONTINUE WATCHING CARD
// ─────────────────────────────────────────────
const ContinueCard = ({ video }) => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [hovered, setHovered] = useState(false);

  return (
    <Link to={`/video/${video.id || video.video_id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '220px',
          transition: 'transform 0.2s',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
        }}
      >
        <div style={{
          width: '220px', height: '124px',
          borderRadius: '8px',
          background: video.thumbnail_path
            ? `url(${apiBase}/${video.thumbnail_path}) center/cover`
            : 'linear-gradient(135deg, #1a1a2e, #16213e)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '6px',
          border: hovered ? '2px solid var(--accent)' : '2px solid transparent',
          transition: 'border 0.2s',
        }}>
          {!video.thumbnail_path && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px',
            }}>▶</div>
          )}

          {/* Dark overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(229,9,20,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', color: 'white',
              opacity: hovered ? 1 : 0.7,
              transition: 'opacity 0.2s',
            }}>▶</div>
          </div>

          {/* Progress bar at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '3px',
            background: 'rgba(255,255,255,0.2)',
          }}>
            <div style={{
              height: '100%',
              width: `${video.progress_percent || 0}%`,
              background: 'var(--accent)',
            }} />
          </div>
        </div>

        <div style={{
          fontSize: '13px', fontWeight: '600',
          color: hovered ? 'white' : 'var(--text-secondary)',
          transition: 'color 0.2s',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: '2px',
        }}>
          {video.title}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {video.progress_percent || 0}% watched
        </div>
      </div>
    </Link>
  );
};

export default Dashboard;