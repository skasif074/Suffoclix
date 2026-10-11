import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playlistAPI, videoAPI, watchAPI } from '../services/api';
import Navbar from '../components/Navbar';

// ─────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────
const HomeIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#fff" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.8"}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PlaylistIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M19 11H5M19 6H5M19 16H5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const MoreVerticalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5"/>
    <circle cx="12" cy="12" r="1.5"/>
    <circle cx="12" cy="19" r="1.5"/>
  </svg>
);

// Helper function to randomly shuffle videos array (YouTube recommendation style)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ─────────────────────────────────────────────
// CSS STYLESHEET INJECTION
// ─────────────────────────────────────────────
const ytStyles = `
  .yt-shell {
    display: flex;
    min-height: calc(100vh - 56px);
    background-color: #0f0f0f;
    color: #f1f1f1;
    font-family: "Roboto", "Arial", sans-serif;
  }

  .yt-sidebar {
    width: 240px;
    background-color: #0f0f0f;
    padding: 12px;
    flex-shrink: 0;
    display: none;
    height: calc(100vh - 56px);
    position: sticky;
    top: 56px;
    overflow-y: auto;
  }
  @media (min-width: 1200px) {
    .yt-sidebar { display: block; }
  }

  .yt-sidebar-item {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 10px 12px;
    border-radius: 10px;
    color: #f1f1f1;
    text-decoration: none;
    font-size: 14px;
    font-weight: 400;
    transition: background 0.15s;
  }
  .yt-sidebar-item:hover { background-color: #272727; }
  .yt-sidebar-item.active { background-color: #272727; font-weight: 500; }

  .yt-main-feed {
    flex: 1;
    padding: 16px 24px;
    min-width: 0;
  }

  .yt-chips-container {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 16px;
    margin-bottom: 20px;
    scrollbar-width: none;
  }
  .yt-chip {
    background: #272727;
    color: #f1f1f1;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    border: none;
    transition: background 0.2s;
  }
  .yt-chip:hover { background: #3f3f3f; }
  .yt-chip.active { background: #f1f1f1; color: #0f0f0f; }

  .yt-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px 16px;
  }
  @media (min-width: 600px) {
    .yt-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 960px) {
    .yt-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (min-width: 1400px) {
    .yt-grid { grid-template-columns: repeat(4, 1fr); }
  }

  .yt-card-thumb {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    background-color: #272727;
  }
  .yt-card-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #10b981;
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
  }
`;

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
  const [randomizedFeed, setRandomizedFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeChip, setActiveChip] = useState('All');

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
          const vids = res.data.playlist.videos || [];
          // Attach parent playlist details to each video object so player page knows which playlist it belongs to
          return {
            ...p,
            videos: vids.map(v => ({
              ...v,
              playlist_id: p.id,
              playlist_title: p.title
            }))
          };
        })
      );

      setPlaylists(playlistsWithVideos);
      setContinueWatching(continueRes.data.videos || []);

      // Extract all videos across all playlists and shuffle them for random YouTube Home Feed
      const extractedVideos = playlistsWithVideos.flatMap(p => p.videos || []);
      setRandomizedFeed(shuffleArray(extractedVideos));

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
      <style>{ytStyles}</style>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #272727', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
      <style>{ytStyles}</style>
      <Navbar />

      <div className="yt-shell">
        {/* Left Sidebar */}
        <aside className="yt-sidebar">
          <Link to="/dashboard" className="yt-sidebar-item active">
            <HomeIcon active={true} />
            <span>Home</span>
          </Link>
          <Link to="/history" className="yt-sidebar-item">
            <HistoryIcon />
            <span>History</span>
          </Link>
          <div style={{ height: '1px', background: '#272727', margin: '12px 0' }} />
          <div style={{ fontSize: '14px', fontWeight: '500', padding: '0 12px 8px', color: '#aaa' }}>
            Subscriptions
          </div>
          {playlists.map(p => (
            <Link key={p.id} to={`/playlist/${p.id}`} className="yt-sidebar-item">
              <PlaylistIcon />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
            </Link>
          ))}
        </aside>

        {/* Main Feed Section */}
        <main className="yt-main-feed">
          {/* Category Chip Bar */}
          <div className="yt-chips-container">
            {['All', 'Continue Watching', ...playlists.map(p => p.title)].map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveChip(chip)}
                className={`yt-chip ${activeChip === chip ? 'active' : ''}`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Search Results Display */}
          {searchQuery ? (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '20px' }}>
                Search results for <span style={{ color: '#fff', fontWeight: '700' }}>"{searchQuery}"</span>
              </h2>
              {searchLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Searching...</div>
              ) : (
                <div className="yt-grid">
                  {searchResults.map(video => (
                    <VideoCard key={video.id} video={video} isSubscribed={isSubscribed} isAdmin={isAdmin} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Continue Watching Section */}
              {(activeChip === 'All' || activeChip === 'Continue Watching') && continueWatching.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>Continue watching</h2>
                  </div>
                  <div className="yt-grid">
                    {continueWatching.map(video => (
                      <VideoCard key={video.video_id || video.id} video={{ ...video, id: video.video_id }} isSubscribed={isSubscribed} isAdmin={isAdmin} isContinue={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Main Feed Video Grid (Randomized for 'All', or Filtered by Playlist Tag) */}
              {activeChip !== 'Continue Watching' && (
                <div className="yt-grid">
                  {(activeChip === 'All' 
                    ? randomizedFeed 
                    : playlists.find(p => p.title === activeChip)?.videos || []
                  ).map((video, idx) => (
                    <VideoCard key={video.id || idx} video={video} isSubscribed={isSubscribed} isAdmin={isAdmin} />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// YOUTUBE VIDEO CARD COMPONENT
// ─────────────────────────────────────────────
const VideoCard = ({ video, isSubscribed, isAdmin, isContinue }) => {
  const canWatch = isSubscribed || isAdmin;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Construct target watch URL. If video has a parent playlist_id, pass it in query string so Video/Watch page loads its playlist automatically!
  const targetUrl = canWatch 
    ? (video.playlist_id ? `/video/${video.id}?playlist=${video.playlist_id}` : `/video/${video.id}`)
    : '/subscribe';

  return (
    <Link to={targetUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 16:9 Thumbnail Box */}
        <div className="yt-card-thumb" style={{
          backgroundImage: video.thumbnail_path ? `url(${apiBase}/${video.thumbnail_path})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          {!canWatch && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LockIcon />
            </div>
          )}

          {/* Badge */}
          <div style={{
            position: 'absolute', bottom: '8px', right: '8px',
            background: 'rgba(0, 0, 0, 0.8)', color: '#fff',
            fontSize: '12px', fontWeight: '500', padding: '2px 4px', borderRadius: '4px'
          }}>
            {video.type === 'movie' ? 'MOVIE' : 'EP'}
          </div>

          {/* Progress Bar for Continue Watching */}
          {isContinue && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.2)' }}>
              <div style={{ height: '100%', width: `${video.progress_percent || 0}%`, background: '#10b981' }} />
            </div>
          )}
        </div>

        {/* Video Info Stack */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div className="yt-card-avatar">
            {video.title ? video.title.charAt(0).toUpperCase() : 'V'}
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '15px', fontWeight: '500', color: '#f1f1f1',
              lineHeight: '1.3', margin: '0 0 4px 0',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {video.title}
            </h3>

            <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.4' }}>
              <div>{video.playlist_title || video.genre || 'Suffoclix Original'}</div>
              <div>{isContinue ? `${video.progress_percent || 0}% completed` : 'Official Release • HD'}</div>
            </div>
          </div>

          <div style={{ color: '#aaa', cursor: 'pointer' }}>
            <MoreVerticalIcon />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Dashboard;
