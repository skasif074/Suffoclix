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
  const controlsTimeout = useRef(null);

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
        (isSubscribed || isAdmin) ? watchAPI.getProgress(id) : Promise.resolve({ data: { progress: null } }),
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

  // Auto hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    if (isPlaying) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  // Save progress every 10 seconds
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
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
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
      else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
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

  const handlePlayFromStart = () => {
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
      videoRef.current.currentTime += seconds;
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': skip(10); break;
        case 'ArrowLeft': skip(-10); break;
        case 'ArrowUp': e.preventDefault(); setVolume(v => Math.min(1, v + 0.1)); break;
        case 'ArrowDown': e.preventDefault(); setVolume(v => Math.max(0, v - 0.1)); break;
        case 'f': toggleFullscreen(); break;
        case 'm': toggleMute(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, isMuted]);

  if (loading) return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
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
      <div className="page-loader">
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
          Subscribe to watch <strong>{video.title}</strong> and thousands of other titles.
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

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const videoSrc = `${apiBase}/api/content/${id}/stream`;

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 0 40px' }}>

        {/* ── VIDEO PLAYER ── */}
        <div
          ref={containerRef}
          onMouseMove={resetControlsTimer}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          style={{
            position: 'relative',
            background: '#000',
            aspectRatio: '16/9',
            width: '100%',
            overflow: 'hidden',
            cursor: showControls ? 'default' : 'none',
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

          {/* Buffering Spinner */}
          {buffering && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
            }}>
              <div className="spinner" />
            </div>
          )}

          {/* Resume Prompt */}
          {showResumePrompt && (
            <div style={{
              position: 'absolute',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.9)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px 28px',
              textAlign: 'center',
              zIndex: 10,
              minWidth: '300px',
            }}>
              <p style={{ marginBottom: '16px', fontSize: '14px' }}>
                Resume from <strong>{formatTime(savedProgress)}</strong>?
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={handleResume} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                  ▶ Resume
                </button>
                <button onClick={handlePlayFromStart} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
                  ↩ Start Over
                </button>
              </div>
            </div>
          )}

          {/* Center Play Button */}
          {!isPlaying && !buffering && !showResumePrompt && (
            <div
              onClick={togglePlay}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(229,9,20,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(229,9,20,0.4)',
                transition: 'transform 0.2s',
              }}>
                ▶
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
            padding: '40px 20px 16px',
            transition: 'opacity 0.3s',
            opacity: showControls ? 1 : 0,
          }}>
            {/* Progress Bar */}
            <div
              onClick={handleSeek}
              style={{
                height: '4px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                cursor: 'pointer',
                marginBottom: '12px',
                position: 'relative',
              }}
            >
              {/* Buffered */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${progress}%`,
                background: 'var(--accent)',
                borderRadius: '2px',
                transition: 'width 0.1s',
              }} />
              {/* Thumb */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: `${progress}%`,
                transform: 'translate(-50%, -50%)',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }} />
            </div>

            {/* Controls Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              {/* Left Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Play/Pause */}
                <ControlBtn onClick={togglePlay}>
                  {isPlaying ? '⏸' : '▶'}
                </ControlBtn>

                {/* Skip Back */}
                <ControlBtn onClick={() => skip(-10)} title="-10s">⏪</ControlBtn>

                {/* Skip Forward */}
                <ControlBtn onClick={() => skip(10)} title="+10s">⏩</ControlBtn>

                {/* Volume */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <ControlBtn onClick={toggleMute}>
                    {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                  </ControlBtn>
                  {showVolumeSlider && (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      style={{
                        width: '80px',
                        accentColor: 'var(--accent)',
                        cursor: 'pointer',
                      }}
                    />
                  )}
                </div>

                {/* Time */}
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                {/* Playback Speed */}
                <div style={{ position: 'relative' }}>
                  <ControlBtn onClick={() => setShowSettings(!showSettings)}>
                    {playbackRate}x
                  </ControlBtn>
                  {showSettings && (
                    <div style={{
                      position: 'absolute',
                      bottom: '44px',
                      right: 0,
                      background: 'rgba(20,20,20,0.95)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      minWidth: '100px',
                    }}>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '8px 16px',
                            background: playbackRate === rate ? 'rgba(229,9,20,0.2)' : 'transparent',
                            color: playbackRate === rate ? 'var(--accent)' : 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '13px',
                            textAlign: 'left',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {rate}x {playbackRate === rate ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <ControlBtn onClick={toggleFullscreen}>
                  {isFullscreen ? '⊡' : '⛶'}
                </ControlBtn>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts hint */}
          {showControls && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0,0,0,0.6)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
            }}>
              Space: Play/Pause • ←→: Skip • F: Fullscreen • M: Mute
            </div>
          )}
        </div>

        {/* ── VIDEO INFO ── */}
        <div style={{ padding: '24px 24px 0', background: 'var(--bg-primary)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span className={`badge ${video.type === 'movie' ? 'badge-red' : 'badge-yellow'}`}>
                  {video.type === 'movie' ? '🎬 Movie' : '📺 Series'}
                </span>
                {video.genre && <span className="badge badge-gray">{video.genre}</span>}
                {video.language && <span className="badge badge-gray">{video.language}</span>}
                {video.release_year && <span className="badge badge-gray">{video.release_year}</span>}
              </div>
              <h1 style={{
                fontSize: 'clamp(20px, 3vw, 28px)',
                fontWeight: '800',
                marginBottom: '8px',
              }}>
                {video.title}
              </h1>
              {video.description && (
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  lineHeight: '1.7',
                  maxWidth: '700px',
                }}>
                  {video.description}
                </p>
              )}
            </div>

            {/* Progress indicator */}
            {(isSubscribed || isAdmin) && progress > 0 && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px 20px',
                minWidth: '160px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: 'var(--accent)',
                  marginBottom: '4px',
                }}>
                  {Math.round(progress)}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Watched
                </div>
                <div className="progress-bar" style={{ marginTop: '8px' }}>
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{ padding: '10px 20px', fontSize: '13px' }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CONTROL BUTTON
// ─────────────────────────────────────────────
const ControlBtn = ({ onClick, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '6px',
      color: 'white',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background 0.2s',
      fontFamily: 'Inter, sans-serif',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
  >
    {children}
  </button>
);

export default VideoPage;