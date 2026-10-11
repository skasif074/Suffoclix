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
    <div style={{ background: '#050b08', minHeight: '100vh', color: '#fff' }}>
      <Navbar />
      <div className="page-loader" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(16, 185, 129, 0.2)', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#9ca3af', marginTop: '16px', fontSize: '14px', letterSpacing: '0.5px' }}>Loading your cinematic experience...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#050b08', minHeight: '100vh', color: '#f3f4f6', overflowX: 'hidden' }}>
      <Navbar />

      {/* Hero Banner (Hidden during search) */}
      {!searchQuery && (
        <div style={{
          position: 'relative',
          minHeight: '440px',
          background: 'linear-gradient(135deg, #050b08 0%, #062316 50%, #050b08 100%)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 25% 50%, rgba(16,185,129,0.18) 0%, transparent 65%)',
          }} />
          <div style={{
            position: 'absolute',
            width: '600px', height: '600px',
            borderRadius: '50%',
            background: 'rgba(16,185,129,0.06)',
            right: '-150px', top: '-150px',
            filter: 'blur(60px)',
          }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '40px 24px', maxWidth: '750px', margin: '0 5%' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.35)',
              borderRadius: '50px', padding: '6px 16px',
              fontSize: '12px', color: '#34d399',
              fontWeight: '700', marginBottom: '20px', letterSpacing: '1.2px',
            }}>
              🟢 CRYSTAL PRIME ORIGINALS
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '900',
              lineHeight: '1.1', marginBottom: '16px', letterSpacing: '-1px',
            }}>
              Welcome back,{' '}
              <span style={{
                background: 'linear-gradient(135deg, #34d399, #059669)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {user?.name?.split(' ')[0]}!
              </span>
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px', maxWidth: '580px' }}>
              {isSubscribed || isAdmin
                ? `Active Premium Access • Stream through ${playlists.length} curated crystal vaults.`
                : 'Unlock unlimited high-definition content with a single pass.'}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              {isSubscribed || isAdmin ? (
                <Link to={playlists[0] ? `/playlist/${playlists[0].id}` : '/dashboard'} style={{
                  padding: '14px 30px', fontSize: '15px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                  fontWeight: '700', textDecoration: 'none', boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px'
                }}>
                  ▶ Start Streaming
                </Link>
              ) : (
                <Link to="/subscribe" style={{
                  padding: '14px 30px', fontSize: '15px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                  fontWeight: '700', textDecoration: 'none', boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                  display: 'inline-flex', alignItems: 'center', gap: '8px'
                }}>
                  ⭐ Upgrade Plan
                </Link>
              )}
              <Link to="/history" style={{
                padding: '14px 28px', fontSize: '15px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                fontWeight: '600', textDecoration: 'none', backdropFilter: 'blur(8px)',
                display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}>
                📜 Watch History
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ padding: '0 0 80px' }}>
        {searchQuery && (
          <div style={{ padding: '32px 5%' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', color: '#9ca3af' }}>
              🔍 Search Results for <span style={{ color: '#fff' }}>"{searchQuery}"</span>
            </h2>
            {searchLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>🍃</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>No media found</h3>
                <p style={{ color: '#9ca3af' }}>Try looking up different terms or keywords</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                {searchResults.map(video => (
                  <VideoCard key={video.id} video={video} isSubscribed={isSubscribed} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </div>
        )}

        {!searchQuery && continueWatching.length > 0 && (
          <PlaylistRow
            title="▶ Jump Back In"
            videos={continueWatching.map(v => ({ ...v, id: v.video_id, progress_percent: v.progress_percent }))}
            isSubscribed={isSubscribed}
            isAdmin={isAdmin}
            isContinue={true}
          />
        )}

        {!searchQuery && playlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '450px', margin: '40px auto', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.1)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎬</div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>No Vault Playlists</h3>
            <p style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '14px' }}>{isAdmin ? 'Deploy your media assets from the Admin Panel.' : 'New streams are arriving shortly!'}</p>
            {isAdmin && (
              <Link to="/admin" style={{ padding: '12px 24px', background: '#10b981', color: '#fff', borderRadius: '8px', fontWeight: '700', textDecoration: 'none' }}>+ Create Playlist</Link>
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
  const short = description.length > 130;
  return (
    <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px', maxWidth: '700px', lineHeight: '1.55' }}>
      {expanded || !short ? description : `${description.slice(0, 130)}...`}
      {short && (
        <span
          onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
          style={{ color: '#34d399', cursor: 'pointer', marginLeft: '6px', fontWeight: '600' }}
        >
          {expanded ? 'show less' : 'show more'}
        </span>
      )}
    </p>
  );
};

// ─────────────────────────────────────────────
// PLAYLIST ROW
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
    el.scrollBy({ left: dir * 650, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  if (videos.length === 0) return null;

  return (
    <div style={{ marginBottom: '44px', position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '0 5%', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '4px', minHeight: '24px',
            background: 'linear-gradient(135deg, #10b981, #34d399)', borderRadius: '4px', marginTop: '3px', flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '21px', fontWeight: '800', letterSpacing: '-0.3px', color: '#fff' }}>
                {title}
              </h2>
              {isFeatured && (
                <span style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white',
                  fontSize: '10px', fontWeight: '700',
                  padding: '3px 9px', borderRadius: '6px', letterSpacing: '0.8px',
                }}>
                  FEATURED
                </span>
              )}
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                {videos.length} {videos.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            {description && <ExpandableDescription description={description} />}
          </div>
        </div>

        {playlistId && (
          <Link to={`/playlist/${playlistId}`} style={{
            color: '#34d399', fontSize: '13px', fontWeight: '600',
            textDecoration: 'none', display: 'flex', alignItems: 'center',
            gap: '4px', opacity: 0.9, transition: 'opacity 0.2s', flexShrink: 0, marginLeft: '16px',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.9}
          >
            Explore All →
          </Link>
        )}
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        {canScrollLeft && (
          <button onClick={() => scroll(-1)} style={{
            position: 'absolute', left: 0, top: '50%',
            transform: 'translateY(-50%)', zIndex: 10,
            width: '56px', height: '100%',
            background: 'linear-gradient(to right, rgba(5,11,8,0.96), transparent)',
            border: 'none', color: '#fff', fontSize: '26px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
            paddingLeft: '12px', transition: 'background 0.2s'
          }}>‹</button>
        )}

        <div
          ref={rowRef}
          onScroll={checkScroll}
          style={{
            display: 'flex', gap: '14px', overflowX: 'auto',
            padding: '8px 5%', scrollbarWidth: 'none', msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
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
            position: 'absolute', right: 0, top: '50%',
            transform: 'translateY(-50%)', zIndex: 10,
            width: '56px', height: '100%',
            background: 'linear-gradient(to left, rgba(5,11,8,0.96), transparent)',
            border: 'none', color: '#fff', fontSize: '26px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            paddingRight: '12px', transition: 'background 0.2s'
          }}>›</button>
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
  const [hovered, setHovered] = useState(false);

  return (
    <Link to={canWatch ? `/video/${video.id}` : '/subscribe'} style={{ textDecoration: 'none', flexShrink: 0 }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '190px', transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: hovered ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)',
          transformOrigin: 'center bottom',
        }}
      >
        <div style={{
          width: '190px', height: '108px', borderRadius: '10px',
          background: video.thumbnail_path
            ? `url(${apiBase}/${video.thumbnail_path}) center/cover`
            : 'linear-gradient(135deg, #0d1b14, #062316)',
          position: 'relative', overflow: 'hidden', marginBottom: '10px',
          border: hovered ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.06)',
          boxShadow: hovered ? '0 10px 25px rgba(16,185,129,0.25)' : 'none',
          transition: 'all 0.25s ease',
        }}>
          {!video.thumbnail_path && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
            }}>
              {video.type === 'movie' ? '🎬' : '📺'}
            </div>
          )}
          {!canWatch && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(5,11,8,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)',
            }}>
              <span style={{ fontSize: '20px' }}>🔒</span>
            </div>
          )}
          {canWatch && hovered && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(5,11,8,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: '#10b981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', color: '#fff', boxShadow: '0 0 15px rgba(16,185,129,0.5)',
              }}>▶</div>
            </div>
          )}
          {index !== undefined && (
            <div style={{
              position: 'absolute', top: '6px', left: '6px',
              background: 'rgba(5,11,8,0.8)', borderRadius: '6px',
              padding: '2px 7px', fontSize: '11px', fontWeight: '700', color: '#d1d5db',
              backdropFilter: 'blur(4px)',
            }}>
              {index + 1}
            </div>
          )}
          <div style={{
            position: 'absolute', top: '6px', right: '6px',
            background: video.type === 'movie' ? 'rgba(16,185,129,0.9)' : 'rgba(234,179,8,0.9)',
            borderRadius: '6px', padding: '2px 7px', fontSize: '9px', fontWeight: '800',
            color: video.type === 'movie' ? '#fff' : '#000', textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {video.type === 'movie' ? 'Movie' : 'EP'}
          </div>
        </div>
        <div style={{ padding: '0 2px' }}>
          <div style={{
            fontSize: '13px', fontWeight: '600',
            color: hovered ? '#34d399' : '#e5e7eb',
            transition: 'color 0.2s', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px',
          }}>
            {video.title}
          </div>
          {video.genre && (
            <div style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.3px' }}>{video.genre}</div>
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
        style={{ width: '230px', transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)', transform: hovered ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)' }}
      >
        <div style={{
          width: '230px', height: '130px', borderRadius: '10px',
          background: video.thumbnail_path
            ? `url(${apiBase}/${video.thumbnail_path}) center/cover`
            : 'linear-gradient(135deg, #0d1b14, #062316)',
          position: 'relative', overflow: 'hidden', marginBottom: '8px',
          border: hovered ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.06)',
          boxShadow: hovered ? '0 10px 25px rgba(16,185,129,0.25)' : 'none',
          transition: 'all 0.25s ease',
        }}>
          {!video.thumbnail_path && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
            }}>▶</div>
          )}
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(5,11,8,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%',
              background: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', color: '#fff',
              opacity: hovered ? 1 : 0.85, transition: 'all 0.2s',
              boxShadow: '0 0 15px rgba(16,185,129,0.4)',
            }}>▶</div>
          </div>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '4px', background: 'rgba(255,255,255,0.15)',
          }}>
            <div style={{ height: '100%', width: `${video.progress_percent || 0}%`, background: '#10b981' }} />
          </div>
        </div>
        <div style={{
          fontSize: '13px', fontWeight: '600',
          color: hovered ? '#34d399' : '#e5e7eb',
          transition: 'color 0.2s', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px',
        }}>
          {video.title}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>
          {video.progress_percent || 0}% completed
        </div>
      </div>
    </Link>
  );
};

export default Dashboard;
