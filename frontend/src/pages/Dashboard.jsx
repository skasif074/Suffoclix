import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playlistAPI, videoAPI, watchAPI } from '../services/api';
import Navbar from '../components/Navbar';

// ─────────────────────────────────────────────
// SVG ICONS (Replacing Emojis)
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
// DASHBOARD COMPONENT
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
    <div style={{ background: '#070d0a', minHeight: '100vh', color: '#fff' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 70px)' }}>
        <div style={{
          width: '38px', height: '38px',
          border: '3px solid rgba(16, 185, 129, 0.15)',
          borderTop: '3px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#9ca3af', marginTop: '16px', fontSize: '13px', letterSpacing: '0.5px', fontWeight: '500' }}>
          Loading content...
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#070d0a', minHeight: '100vh', color: '#f3f4f6', fontFamily: 'Roboto, Arial, sans-serif' }}>
      <Navbar />

      {/* YouTube Featured Header Banner */}
      {!searchQuery && (
        <div style={{
          position: 'relative',
          padding: '40px 4%',
          background: 'radial-gradient(ellipse at 20% 40%, rgba(16, 185, 129, 0.12) 0%, rgba(7, 13, 10, 1) 70%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '20px'
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px', padding: '3px 8px',
              fontSize: '11px', color: '#34d399',
              fontWeight: '700', marginBottom: '14px', letterSpacing: '1px', textTransform: 'uppercase'
            }}>
              OFFICIAL PLATFORM
            </div>
            
            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800',
              lineHeight: '1.15', marginBottom: '12px', color: '#ffffff', letterSpacing: '-0.5px'
            }}>
              Welcome back,{' '}
              <span style={{ color: '#34d399' }}>
                {user?.name?.split(' ')[0]}
              </span>
            </h1>

            <p style={{ color: '#9ca3af', fontSize: '15px', lineHeight: '1.5', marginBottom: '24px', maxWidth: '600px' }}>
              {isSubscribed || isAdmin
                ? `Active Subscription • ${playlists.length} channels available`
                : 'Subscribe to gain full access to premium media streams'}
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {isSubscribed || isAdmin ? (
                <Link to={playlists[0] ? `/playlist/${playlists[0].id}` : '/dashboard'} style={{
                  padding: '10px 22px', fontSize: '14px', borderRadius: '18px',
                  background: '#10b981', color: '#000', fontWeight: '700',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
                  transition: 'background 0.2s'
                }}>
                  <PlayIcon size={14} color="#000" /> Start Watching
                </Link>
              ) : (
                <Link to="/subscribe" style={{
                  padding: '10px 22px', fontSize: '14px', borderRadius: '18px',
                  background: '#10b981', color: '#000', fontWeight: '700',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px'
                }}>
                  Subscribe Now
                </Link>
              )}

              <Link to="/history" style={{
                padding: '10px 20px', fontSize: '14px', borderRadius: '18px',
                background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}>
                <HistoryIcon size={15} color="#fff" /> Watch History
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
        {searchQuery && (
          <div style={{ padding: '20px 4%' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '20px', color: '#9ca3af' }}>
              Results for <span style={{ color: '#fff', fontWeight: '700' }}>"{searchQuery}"</span>
            </h2>
            
            {searchLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div style={{
                  width: '32px', height: '32px',
                  border: '3px solid rgba(16, 185, 129, 0.15)',
                  borderTop: '3px solid #10b981',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#4b5563' }}>
                  <SearchIcon size={56} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '6px', color: '#e5e7eb' }}>
                  No results found
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                  Try different keywords or check spelling
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
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
            textAlign: 'center', padding: '80px 20px',
            maxWidth: '480px', margin: '40px auto',
            background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#374151' }}>
              <VideoPlaceholderIcon size={48} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#f3f4f6' }}>
              No Playlists Available
            </h3>
            <p style={{ color: '#9ca3af', marginBottom: '20px', fontSize: '14px' }}>
              {isAdmin ? 'Add playlists from the Admin Dashboard.' : 'Check back later for new content updates.'}
            </p>
            {isAdmin && (
              <Link to="/admin" style={{
                padding: '10px 20px', background: '#10b981', color: '#000',
                borderRadius: '18px', fontWeight: '700', textDecoration: 'none', fontSize: '14px'
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
  const short = description.length > 120;
  return (
    <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px', maxWidth: '720px', lineHeight: '1.4' }}>
      {expanded || !short ? description : `${description.slice(0, 120)}...`}
      {short && (
        <span
          onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
          style={{ color: '#34d399', cursor: 'pointer', marginLeft: '6px', fontWeight: '600' }}
        >
          {expanded ? ' Show Less' : ' Read More'}
        </span>
      )}
    </p>
  );
};

// ─────────────────────────────────────────────
// PLAYLIST ROW (YouTube Horizontally Scrollable Section)
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
    el.scrollBy({ left: dir * 600, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  if (videos.length === 0) return null;

  return (
    <div style={{ marginBottom: '32px', position: 'relative' }}>
      {/* YouTube Section Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: '0 4%', marginBottom: '14px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' }}>
              {title}
            </h2>
            {isFeatured && (
              <span style={{
                background: '#10b981', color: '#000',
                fontSize: '10px', fontWeight: '800',
                padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.5px', textTransform: 'uppercase'
              }}>
                Featured
              </span>
            )}
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              • {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            </span>
          </div>
          {description && <ExpandableDescription description={description} />}
        </div>

        {playlistId && (
          <Link to={`/playlist/${playlistId}`} style={{
            color: '#34d399', fontSize: '13px', fontWeight: '600',
            textDecoration: 'none', display: 'flex', alignItems: 'center',
            gap: '4px', flexShrink: 0, marginLeft: '16px'
          }}>
            View All
          </Link>
        )}
      </div>

      {/* Row Carousel Area */}
      <div style={{ position: 'relative', width: '100%' }}>
        {canScrollLeft && (
          <button onClick={() => scroll(-1)} style={{
            position: 'absolute', left: '10px', top: '40%',
            transform: 'translateY(-50%)', zIndex: 10,
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(15, 23, 20, 0.9)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            <ChevronLeft />
          </button>
        )}

        <div
          ref={rowRef}
          onScroll={checkScroll}
          style={{
            display: 'flex', gap: '12px', overflowX: 'auto',
            padding: '4px 4%', scrollbarWidth: 'none', msOverflowStyle: 'none',
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
          <button onClick={() => scroll(1)} style={{
            position: 'absolute', right: '10px', top: '40%',
            transform: 'translateY(-50%)', zIndex: 10,
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(15, 23, 20, 0.9)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            <ChevronRight />
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// YOUTUBE-STYLE VIDEO CARD
// ─────────────────────────────────────────────
const VideoCard = ({ video, index, isSubscribed, isAdmin }) => {
  const canWatch = isSubscribed || isAdmin;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [hovered, setHovered] = useState(false);

  return (
    <Link to={canWatch ? `/video/${video.id}` : '/subscribe'} style={{ textDecoration: 'none', width: '210px', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ width: '100%' }}
      >
        {/* Thumbnail Area (16:9 Aspect Ratio) */}
        <div style={{
          width: '100%', height: '118px', borderRadius: '10px',
          background: video.thumbnail_path
            ? `url(${apiBase}/${video.thumbnail_path}) center/cover`
            : 'linear-gradient(135deg, #122019, #08120d)',
          position: 'relative', overflow: 'hidden', marginBottom: '8px',
          border: hovered ? '2px solid #10b981' : '2px solid transparent',
          transition: 'all 0.2s ease'
        }}>
          {!video.thumbnail_path && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f382b'
            }}>
              <VideoPlaceholderIcon size={36} />
            </div>
          )}

          {!canWatch && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(7, 13, 10, 0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)'
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '50%', color: '#34d399'
              }}>
                <LockIcon size={20} />
              </div>
            </div>
          )}

          {canWatch && hovered && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000', boxShadow: '0 0 12px rgba(16,185,129,0.5)'
              }}>
                <PlayIcon size={14} color="#000" />
              </div>
            </div>
          )}

          {index !== undefined && (
            <div style={{
              position: 'absolute', top: '6px', left: '6px',
              background: 'rgba(0,0,0,0.8)', borderRadius: '4px',
              padding: '2px 6px', fontSize: '10px', fontWeight: '700', color: '#d1d5db'
            }}>
              {index + 1}
            </div>
          )}

          <div style={{
            position: 'absolute', bottom: '6px', right: '6px',
            background: video.type === 'movie' ? '#10b981' : 'rgba(0,0,0,0.85)',
            borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: '700',
            color: video.type === 'movie' ? '#000' : '#fff', textTransform: 'uppercase'
          }}>
            {video.type === 'movie' ? 'Movie' : 'EP'}
          </div>
        </div>

        {/* Details Area */}
        <div style={{ padding: '0 2px' }}>
          <div style={{
            fontSize: '14px', fontWeight: '600',
            color: hovered ? '#34d399' : '#f3f4f6',
            lineHeight: '1.3', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px',
            transition: 'color 0.2s'
          }}>
            {video.title}
          </div>
          
          <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{video.genre || 'Media'}</span>
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
    <Link to={`/video/${video.id || video.video_id}`} style={{ textDecoration: 'none', width: '230px', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ width: '100%' }}
      >
        <div style={{
          width: '100%', height: '128px', borderRadius: '10px',
          background: video.thumbnail_path
            ? `url(${apiBase}/${video.thumbnail_path}) center/cover`
            : 'linear-gradient(135deg, #122019, #08120d)',
          position: 'relative', overflow: 'hidden', marginBottom: '8px',
          border: hovered ? '2px solid #10b981' : '2px solid transparent',
          transition: 'all 0.2s ease'
        }}>
          {!video.thumbnail_path && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f382b'
            }}>
              <VideoPlaceholderIcon size={40} />
            </div>
          )}

          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#000', opacity: hovered ? 1 : 0.85, transition: 'opacity 0.2s'
            }}>
              <PlayIcon size={14} color="#000" />
            </div>
          </div>

          {/* YouTube-style Progress Bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '3px', background: 'rgba(255,255,255,0.2)'
          }}>
            <div style={{ height: '100%', width: `${video.progress_percent || 0}%`, background: '#10b981' }} />
          </div>
        </div>

        <div style={{
          fontSize: '14px', fontWeight: '600',
          color: hovered ? '#34d399' : '#f3f4f6',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px'
        }}>
          {video.title}
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          {video.progress_percent || 0}% completed
        </div>
      </div>
    </Link>
  );
};

export default Dashboard;
