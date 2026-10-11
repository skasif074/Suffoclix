import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playlistAPI, videoAPI, watchAPI } from '../services/api';
import Navbar from '../components/Navbar';

// ─────────────────────────────────────────────
// SVG ICONS (Clean YouTube Style)
// ─────────────────────────────────────────────
const PlayIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" fill={color} />
  </svg>
);

const LockIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const HistoryIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SearchIcon = ({ size = 48, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronLeft = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const VideoPlaceholderIcon = ({ size = 32, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
);

// ─────────────────────────────────────────────
// RESPONSIVE STYLES INJECTION
// ─────────────────────────────────────────────
const styleTag = `
  .yt-container {
    padding-left: 16px;
    padding-right: 16px;
  }
  @media (min-width: 768px) {
    .yt-container {
      padding-left: 24px;
      padding-right: 24px;
    }
  }

  .yt-card {
    width: 160px;
  }
  @media (min-width: 640px) {
    .yt-card {
      width: 210px;
    }
  }

  .yt-continue-card {
    width: 200px;
  }
  @media (min-width: 640px) {
    .yt-continue-card {
      width: 240px;
    }
  }

  .yt-nav-btn {
    display: none !important;
  }
  @media (min-width: 768px) {
    .yt-nav-btn {
      display: flex !important;
    }
  }

  .yt-row-scroll {
    scroll-padding-left: 16px;
  }
  @media (min-width: 768px) {
    .yt-row-scroll {
      scroll-padding-left: 24px;
    }
  }

  .yt-section-title {
    font-size: 16px !important;
    font-weight: 700;
  }
  @media (min-width: 640px) {
    .yt-section-title {
      font-size: 19px !important;
    }
  }
`;

// ─────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────
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
    <div style={{ background: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>
      <style>{styleTag}</style>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 70px)' }}>
        <div style={{
          width: '36px', height: '36px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTop: '3px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#aaa', marginTop: '14px', fontSize: '13px', letterSpacing: '0.2px' }}>
          Loading YouTube Stream...
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh', color: '#f1f1f1', fontFamily: 'Roboto, Arial, sans-serif' }}>
      <style>{styleTag}</style>
      <Navbar />

      {/* YouTube Compact Banner */}
      {!searchQuery && (
        <div style={{
          position: 'relative',
          padding: '24px 0',
          background: 'radial-gradient(ellipse at 15% 50%, rgba(16, 185, 129, 0.12) 0%, rgba(15, 15, 15, 1) 70%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px'
        }}>
          <div className="yt-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px', padding: '2px 6px',
              fontSize: '10px', color: '#34d399',
              fontWeight: '700', marginBottom: '10px', letterSpacing: '0.8px', textTransform: 'uppercase'
            }}>
              OFFICIAL STREAMING
            </div>
            
            <h1 style={{
              fontSize: 'clamp(20px, 3.5vw, 32px)', fontWeight: '700',
              lineHeight: '1.2', marginBottom: '8px', color: '#ffffff'
            }}>
              Welcome back,{' '}
              <span style={{ color: '#34d399' }}>
                {user?.name?.split(' ')[0]}
              </span>
            </h1>

            <p style={{ color: '#aaa', fontSize: '13px', lineHeight: '1.4', marginBottom: '18px', maxWidth: '540px' }}>
              {isSubscribed || isAdmin
                ? `Subscription active • ${playlists.length} playlists unlocked`
                : 'Subscribe to access full episode lists and movies'}
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {isSubscribed || isAdmin ? (
                <Link to={playlists[0] ? `/playlist/${playlists[0].id}` : '/dashboard'} style={{
                  padding: '8px 18px', fontSize: '13px', borderRadius: '18px',
                  background: '#10b981', color: '#0f0f0f', fontWeight: '700',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}>
                  <PlayIcon size={13} color="#0f0f0f" /> Start Watching
                </Link>
              ) : (
                <Link to="/subscribe" style={{
                  padding: '8px 18px', fontSize: '13px', borderRadius: '18px',
                  background: '#10b981', color: '#0f0f0f', fontWeight: '700',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}>
                  Subscribe Now
                </Link>
              )}

              <Link to="/history" style={{
                padding: '8px 16px', fontSize: '13px', borderRadius: '18px',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                fontWeight: '500', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}>
                <HistoryIcon size={14} color="#fff" /> Watch History
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Stream Rows */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
        {searchQuery && (
          <div className="yt-container" style={{ paddingTop: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px', color: '#aaa' }}>
              Results for <span style={{ color: '#fff', fontWeight: '700' }}>"{searchQuery}"</span>
            </h2>
            
            {searchLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div style={{
                  width: '32px', height: '32px',
                  border: '3px solid rgba(16, 185, 129, 0.2)',
                  borderTop: '3px solid #10b981',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#666' }}>
                  <SearchIcon size={44} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#f1f1f1' }}>
                  No results found
                </h3>
                <p style={{ color: '#aaa', fontSize: '13px' }}>Try searching with different terms</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '16px'
              }}>
                {searchResults.map(video => (
                  <VideoCard key={video.id} video={video} isSubscribed={isSubscribed} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </div>
        )}

        {!searchQuery && continueWatching.length > 0 && (
          <PlaylistRow
            title="Continue Watching"
            videos={continueWatching.map(v => ({ ...v, id: v.video_id, progress_percent: v.progress_percent }))}
            isSubscribed={isSubscribed}
            isAdmin={isAdmin}
            isContinue={true}
          />
        )}

        {!searchQuery && playlists.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            maxWidth: '420px', margin: '30px auto',
            background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#555' }}>
              <VideoPlaceholderIcon size={40} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>
              No Playlists Available
            </h3>
            <p style={{ color: '#aaa', marginBottom: '16px', fontSize: '13px' }}>
              {isAdmin ? 'Create new playlists from your Admin Panel.' : 'New streams will be uploaded soon.'}
            </p>
            {isAdmin && (
              <Link to="/admin" style={{
                padding: '8px 18px', background: '#10b981', color: '#0f0f0f',
                borderRadius: '18px', fontWeight: '700', textDecoration: 'none', fontSize: '13px'
              }}>
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
// EXPANDABLE DESCRIPTION
// ─────────────────────────────────────────────
const ExpandableDescription = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  const short = description.length > 90;
  return (
    <p style={{ fontSize: '12px', color: '#aaa', marginTop: '2px', maxWidth: '680px', lineHeight: '1.4' }}>
      {expanded || !short ? description : `${description.slice(0, 90)}...`}
      {short && (
        <span
          onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
          style={{ color: '#34d399', cursor: 'pointer', marginLeft: '6px', fontWeight: '600' }}
        >
          {expanded ? ' Less' : ' More'}
        </span>
      )}
    </p>
  );
};

// ─────────────────────────────────────────────
// PLAYLIST ROW (Mobile Touch Carousel + Desktop Navigation)
// ─────────────────────────────────────────────
const PlaylistRow = ({ title, playlistId, description, videos, isSubscribed, isAdmin, isContinue, isFeatured }) => {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [videos]);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 450, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  if (videos.length === 0) return null;

  return (
    <div style={{ marginBottom: '28px', position: 'relative' }}>
      {/* YouTube Section Header */}
      <div className="yt-container" style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: '10px'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 className="yt-section-title" style={{ color: '#fff', letterSpacing: '-0.2px', margin: 0, textTransform: 'none' }}>
              {title}
            </h2>
            {isFeatured && (
              <span style={{
                background: '#10b981', color: '#0f0f0f',
                fontSize: '9px', fontWeight: '800',
                padding: '2px 5px', borderRadius: '3px', textTransform: 'uppercase'
              }}>
                Featured
              </span>
            )}
            <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '400' }}>
              • {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            </span>
          </div>
          {description && <ExpandableDescription description={description} />}
        </div>

        {playlistId && (
          <Link to={`/playlist/${playlistId}`} style={{
            color: '#34d399', fontSize: '13px', fontWeight: '600',
            textDecoration: 'none', flexShrink: 0, marginLeft: '12px', paddingTop: '2px'
          }}>
            View All
          </Link>
        )}
      </div>

      {/* Row Horizontal Scroll Container */}
      <div style={{ position: 'relative', width: '100%' }}>
        {canScrollLeft && (
          <button className="yt-nav-btn" onClick={() => scroll(-1)} style={{
            position: 'absolute', left: '12px', top: '38%',
            transform: 'translateY(-50%)', zIndex: 10,
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(33, 33, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.6)'
          }}>
            <ChevronLeft />
          </button>
        )}

        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="yt-row-scroll yt-container"
          style={{
            display: 'flex', gap: '12px', overflowX: 'auto',
            paddingTop: '2px', paddingBottom: '6px',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory'
          }}
        >
          {videos.map((video, index) => (
            <div key={video.id || index} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
              {isContinue
                ? <ContinueCard video={video} />
                : <VideoCard video={video} index={index} isSubscribed={isSubscribed} isAdmin={isAdmin} />
              }
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button className="yt-nav-btn" onClick={() => scroll(1)} style={{
            position: 'absolute', right: '12px', top: '38%',
            transform: 'translateY(-50%)', zIndex: 10,
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(33, 33, 33, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.6)'
          }}>
            <ChevronRight />
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// YOUTUBE VIDEO CARD
// ─────────────────────────────────────────────
const VideoCard = ({ video, index, isSubscribed, isAdmin }) => {
  const canWatch = isSubscribed || isAdmin;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [hovered, setHovered] = useState(false);

  return (
    <Link to={canWatch ? `/video/${video.id}` : '/subscribe'} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="yt-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Thumbnail Outer Aspect Container (16:9) */}
        <div style={{
          width: '100%', aspectRatio: '16/9', borderRadius: '8px',
          background: video.thumbnail_path
            ? `url(${apiBase}/${video.thumbnail_path}) center/cover`
            : 'linear-gradient(135deg, #182820, #0f1712)',
          position: 'relative', overflow: 'hidden', marginBottom: '8px',
          border: hovered ? '2px solid #10b981' : '2px solid transparent',
          transition: 'border-color 0.2s'
        }}>
          {!video.thumbnail_path && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#274535'
            }}>
              <VideoPlaceholderIcon size={32} />
            </div>
          )}

          {!canWatch && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(15, 15, 15, 0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)'
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.7)', padding: '6px', borderRadius: '50%', color: '#34d399'
              }}>
                <LockIcon size={16} />
              </div>
            </div>
          )}

          {canWatch && hovered && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0f0f0f'
              }}>
                <PlayIcon size={13} color="#0f0f0f" />
              </div>
            </div>
          )}

          {index !== undefined && (
            <div style={{
              position: 'absolute', top: '4px', left: '4px',
              background: 'rgba(0,0,0,0.8)', borderRadius: '3px',
              padding: '1px 5px', fontSize: '10px', fontWeight: '700', color: '#ccc'
            }}>
              {index + 1}
            </div>
          )}

          <div style={{
            position: 'absolute', bottom: '4px', right: '4px',
            background: video.type === 'movie' ? '#10b981' : 'rgba(0,0,0,0.85)',
            borderRadius: '3px', padding: '1px 5px', fontSize: '9px', fontWeight: '800',
            color: video.type === 'movie' ? '#0f0f0f' : '#fff', textTransform: 'uppercase'
          }}>
            {video.type === 'movie' ? 'Movie' : 'EP'}
          </div>
        </div>

        {/* Video Title and Metadata */}
        <div>
          <div style={{
            fontSize: '13px', fontWeight: '500',
            color: hovered ? '#34d399' : '#f1f1f1',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '3px'
          }}>
            {video.title}
          </div>
          
          <div style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{video.genre || 'Stream'}</span>
            <span>•</span>
            <span>HD</span>
          </div>
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
    <Link to={`/video/${video.id || video.video_id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="yt-continue-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          width: '100%', aspectRatio: '16/9', borderRadius: '8px',
          background: video.thumbnail_path
            ? `url(${apiBase}/${video.thumbnail_path}) center/cover`
            : 'linear-gradient(135deg, #182820, #0f1712)',
          position: 'relative', overflow: 'hidden', marginBottom: '6px',
          border: hovered ? '2px solid #10b981' : '2px solid transparent',
          transition: 'border-color 0.2s'
        }}>
          {!video.thumbnail_path && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#274535'
            }}>
              <VideoPlaceholderIcon size={36} />
            </div>
          )}

          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0f0f0f', opacity: hovered ? 1 : 0.85
            }}>
              <PlayIcon size={13} color="#0f0f0f" />
            </div>
          </div>

          {/* YouTube Bottom Red Progress Indicator switched to Crystal Green */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '3px', background: 'rgba(255,255,255,0.25)'
          }}>
            <div style={{ height: '100%', width: `${video.progress_percent || 0}%`, background: '#10b981' }} />
          </div>
        </div>

        <div style={{
          fontSize: '13px', fontWeight: '500',
          color: hovered ? '#34d399' : '#f1f1f1',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px'
        }}>
          {video.title}
        </div>
        <div style={{ fontSize: '11px', color: '#aaa' }}>
          {video.progress_percent || 0}% completed
        </div>
      </div>
    </Link>
  );
};

export default Dashboard;
