import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videoAPI, watchAPI } from '../services/api';
import Navbar from '../components/Navbar';

const VideoPage = () => {
  const { id } = useParams();
  const { user, isSubscribed, isAdmin } = useAuth();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeout = useRef(null);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const token = localStorage.getItem('token');
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const videoSrc = `${apiBase}/api/content/${id}/stream?token=${token}`;

  useEffect(() => {
    fetchVideo();
    return () => {
      clearInterval(progressInterval.current);
      clearTimeout(controlsTimeout.current);
    };
  }, [id]);

  const fetchVideo = async () => {
    try {
      const [videoRes, progressRes] = await Promise.all([
        videoAPI.getOne(id),
        (isSubscribed || isAdmin)
          ? watchAPI.getProgress(id)
          : Promise.resolve({ data: { progress: null } }),
      ]);
      setVideo(videoRes.data.video);
      if (progressRes.data.progress?.watched_seconds > 10) {
        setSavedProgress(progressRes.data.progress.watched_seconds);
        setShowResumePrompt(true);
      }
    } catch (err) {
      setError('Video not found.');
    } finally {
      setLoading(false);
    }
  };

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    if (isPlaying) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  const startProgressTracking = useCallback(() => {
    clearInterval(progressInterval.current);
    progressInterval.current = setInterval(async () => {
      const v = videoRef.current;
      if (!v || !v.currentTime) return;
      try {
        await watchAPI.updateProgress({
          content_id: parseInt(id),
          watched_seconds: Math.floor(v.currentTime),
          total_seconds: Math.floor(v.duration || 0),
        });
      } catch (err) {
        console.error('Progress save error:', err);
      }
    }, 10000);
  }, [id]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      startProgressTracking();
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      clearInterval(progressInterval.current);
    }
  };

  const togglePlay = () => {
    if (isPlaying) handlePause();
    else handlePlay();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100 || 0);
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !v.duration || isNaN(v.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    v.currentTime = pct * v.duration;
    setProgress(pct * 100);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) setVolume(0);
      else { setVolume(1); videoRef.current.volume = 1; }
    }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      el?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleResume = () => {
    if (videoRef.current && savedProgress) {
      videoRef.current.currentTime = savedProgress;
    }
    setShowResumePrompt(false);
    handlePlay();
  };

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setShowSettings(false);
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      const v = videoRef.current;
      v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + seconds));
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': skip(10); break;
        case 'ArrowLeft': skip(-10); break;
        case 'f': toggleFullscreen(); break;
        case 'm': toggleMute(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, isMuted]);

  if (loading) return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-loader">
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading video...</p>
      </div>
    </div>
  );

  if (error || !video) return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-loader" style={{ flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🎬</div>
        <h2>Video not found</h2>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  if (!isSubscribed && !isAdmin) return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-loader" style={{ flexDirection: 'column', gap: '20px' }}>
        <div style={{ fontSize: '64px' }}>🔒</div>
        <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Subscription Required</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
          Subscribe to watch <strong>{video.title}</strong> and unlock all content.
        </p>
        <Link to="/subscribe" className="btn btn-primary" style={{ padding: '14px 40px', fontSize: '16px' }}>
          ⭐ Subscribe Now
        </Link>
        <Link to="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 24px 60px' }}>

        {/* ── VIDEO PLAYER ── */}
        <div
          ref={containerRef}
          onMouseMove={resetControlsTimer}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          style={{
            position: 'relative',
            background: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            aspectRatio: '16/9',
            width: '100%',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
            cursor: showControls ? 'default' : 'none',
            marginBottom: '24px',
          }}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={videoSrc}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setBuffering(true)}
            onCanPlay={() => setBuffering(false)}
            onEnded={() => {
              setIsPlaying(false);
              clearInterval(progressInterval.current);
            }}
            onClick={togglePlay}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Buffering */}
          {buffering && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)',
            }}>
              <div className="spinner" />
            </div>
          )}

          {/* Resume Prompt */}
          {showResumePrompt && (
            <div style={{
              position: 'absolute',
              bottom: '90px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(10,10,15,0.95)',
              border: '1px solid rgba(229,9,20,0.3)',
              borderRadius: '14px',
              padding: '20px 28px',
              textAlign: 'center',
              zIndex: 10,
              minWidth: '280px',
              backdropFilter: 'blur(10px)',
            }}>
              <p style={{ marginBottom: '16px', fontSize: '14px', color: 'white' }}>
                Resume from <strong style={{ color: 'var(--accent)' }}>{formatTime(savedProgress)}</strong>?
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={handleResume} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                  ▶ Resume
                </button>
                <button onClick={() => { setShowResumePrompt(false); handlePlay(); }} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                  ↩ Start Over
                </button>
              </div>
            </div>
          )}

          {/* Center Play Button */}
          {!isPlaying && !buffering && !showResumePrompt && (
            <div onClick={togglePlay} style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(229,9,20,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px',
                boxShadow: '0 8px 32px rgba(229,9,20,0.5)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.2s',
              }}>▶</div>
            </div>
          )}

          {/* Controls */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.95))',
            padding: '48px 16px 14px',
            transition: 'opacity 0.3s',
            opacity: showControls ? 1 : 0,
          }}>
            {/* Progress Bar */}
            <div onClick={handleSeek} style={{
              height: '5px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '3px',
              cursor: 'pointer',
              marginBottom: '10px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${progress}%`,
                background: 'var(--accent)',
                borderRadius: '3px',
                transition: 'width 0.1s',
              }} />
              <div style={{
                position: 'absolute',
                top: '50%', left: `${progress}%`,
                transform: 'translate(-50%, -50%)',
                width: '13px', height: '13px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              }} />
            </div>

            {/* Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              {/* Left */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ControlBtn onClick={togglePlay}>{isPlaying ? '⏸' : '▶'}</ControlBtn>
                <ControlBtn onClick={() => skip(-10)}>⏪</ControlBtn>
                <ControlBtn onClick={() => skip(10)}>⏩</ControlBtn>

                {/* Volume */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <ControlBtn onClick={toggleMute}>
                    {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                  </ControlBtn>
                  {showVolumeSlider && (
                    <input type="range" min="0" max="1" step="0.05" value={volume}
                      onChange={handleVolumeChange}
                      style={{ width: '70px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                  )}
                </div>

                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <ControlBtn onClick={() => setShowSettings(!showSettings)}>
                    {playbackRate}x
                  </ControlBtn>
                  {showSettings && (
                    <div style={{
                      position: 'absolute', bottom: '42px', right: 0,
                      background: 'rgba(15,15,20,0.98)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      overflow: 'hidden', minWidth: '90px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                        <button key={rate} onClick={() => changePlaybackRate(rate)} style={{
                          display: 'block', width: '100%', padding: '8px 14px',
                          background: playbackRate === rate ? 'rgba(229,9,20,0.2)' : 'transparent',
                          color: playbackRate === rate ? 'var(--accent)' : 'white',
                          border: 'none', cursor: 'pointer', fontSize: '13px',
                          textAlign: 'left', fontFamily: 'Inter, sans-serif',
                        }}>
                          {rate}x {playbackRate === rate ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <ControlBtn onClick={toggleFullscreen}>
                  {isFullscreen ? '⊡' : '⛶'}
                </ControlBtn>
              </div>
            </div>
          </div>

          {/* Keyboard hint */}
          {showControls && (
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '6px', padding: '5px 10px',
              fontSize: '10px', color: 'rgba(255,255,255,0.4)',
            }}>
              Space: Play • ←→: Skip • F: Fullscreen • M: Mute
            </div>
          )}
        </div>

        {/* ── VIDEO INFO ── */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span className={`badge ${video.type === 'movie' ? 'badge-red' : 'badge-yellow'}`}>
                  {video.type === 'movie' ? '🎬 Movie' : '📺 Series'}
                </span>
                {video.genre && <span className="badge badge-gray">{video.genre}</span>}
                {video.language && <span className="badge badge-gray">{video.language}</span>}
                {video.release_year && <span className="badge badge-gray">{video.release_year}</span>}
              </div>

              <h1 style={{ fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: '800', marginBottom: '8px' }}>
                {video.title}
              </h1>

              {video.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', maxWidth: '600px' }}>
                  {video.description}
                </p>
              )}
            </div>

            {/* Progress */}
            {(isSubscribed || isAdmin) && progress > 0 && (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px 20px',
                minWidth: '140px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--accent)', marginBottom: '4px' }}>
                  {Math.round(progress)}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Watched</div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ControlBtn = ({ onClick, children, title }) => (
  <button onClick={onClick} title={title} style={{
    background: 'rgba(255,255,255,0.08)',
    border: 'none', borderRadius: '6px', color: 'white',
    width: '34px', height: '34px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s',
    fontFamily: 'Inter, sans-serif',
  }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
  >
    {children}
  </button>
);

export default VideoPage;