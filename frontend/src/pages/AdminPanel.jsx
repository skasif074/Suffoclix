import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, videoAPI, playlistAPI } from '../services/api';
import Navbar from '../components/Navbar';

const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB per chunk

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, usersRes, videosRes, playlistsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        videoAPI.getAll(),
        playlistAPI.getAll(),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setVideos(videosRes.data.videos);
      setPlaylists(playlistsRes.data.playlists);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'upload', label: '🎬 Upload' },
    { key: 'bulkupload', label: '📦 Bulk Upload' },
    { key: 'editvideo', label: '✏️ Edit Metadata' },
    { key: 'playlists', label: '📚 Playlists' },
    { key: 'videos', label: '🎥 Videos' },
    { key: 'users', label: '👥 Users' },
    { key: 'settings', label: '⚙️ Settings' },
  ];

  if (loading) return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-loader"><div className="spinner" /></div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800', marginBottom: '6px' }}>
            ⚙️ Admin Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Welcome, {user?.name}! Manage your OTT platform.
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
          overflowX: 'auto',
          flexWrap: 'nowrap',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.key ? 'var(--gradient)' : 'transparent',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                transition: 'var(--transition)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <DashboardTab stats={stats} />
        )}
        {activeTab === 'upload' && (
          <UploadTab showToast={showToast} onSuccess={() => { fetchAll(); setActiveTab('videos'); }} />
        )}
        {activeTab === 'bulkupload' && (
          <BulkUploadTab showToast={showToast} onSuccess={() => { fetchAll(); setActiveTab('videos'); }} />
        )}
        {activeTab === 'editvideo' && (
          <EditVideoTab videos={videos} showToast={showToast} onRefresh={fetchAll} />
        )}
        {activeTab === 'playlists' && (
          <PlaylistsTab
            playlists={playlists}
            videos={videos}
            showToast={showToast}
            onRefresh={fetchAll}
          />
        )}
        {activeTab === 'videos' && (
          <VideosTab videos={videos} showToast={showToast} onRefresh={fetchAll} />
        )}
        {activeTab === 'users' && (
          <UsersTab users={users} showToast={showToast} onRefresh={fetchAll} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab stats={stats} showToast={showToast} onRefresh={fetchAll} />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// DASHBOARD TAB
// ─────────────────────────────────────────────
const DashboardTab = ({ stats }) => {
  if (!stats) return null;
  const statCards = [
    { label: 'Total Users', value: stats.total_users, icon: '👥', color: '#4285f4' },
    { label: 'Subscribed', value: stats.subscribed_users, icon: '⭐', color: '#e50914' },
    { label: 'Total Videos', value: stats.total_videos, icon: '🎬', color: '#46d369' },
    { label: 'Playlists', value: stats.total_playlists, icon: '📚', color: '#ffd700' },
    { label: 'Total Watches', value: stats.total_watches, icon: '▶', color: '#ff6b6b' },
    { label: 'Sub Price', value: `₹${stats.subscription?.price}`, icon: '💰', color: '#46d369' },
  ];

  return (
    <div>
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {statCards.map((card, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: `${card.color}20`,
              border: `1px solid ${card.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: card.color }}>
                {card.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subscription info */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(229,9,20,0.1), rgba(178,7,16,0.05))',
        border: '1px solid rgba(229,9,20,0.2)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
          💰 Subscription Overview
        </h3>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Price</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)' }}>
              ₹{stats.subscription?.price}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Duration</div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>
              {stats.subscription?.duration_days} days
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Conversion Rate</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)' }}>
              {stats.total_users > 0
                ? Math.round((stats.subscribed_users / stats.total_users) * 100)
                : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// UPLOAD TAB
// ─────────────────────────────────────────────
const UploadTab = ({ showToast, onSuccess }) => {
  const fileRef = useRef(null);
  const thumbRef = useRef(null);
  const [form, setForm] = useState({
    title: '', description: '', type: 'movie',
    genre: '', language: '', release_year: '',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadState, setUploadState] = useState({
    phase: '', // 'uploading' | 'merging' | 'done'
    percent: 0,
    speed: '',
    timeLeft: '',
    currentChunk: 0,
    totalChunks: 0,
  });
  const cancelRef = useRef(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const formatTime = (secs) => {
    if (secs < 60) return `${Math.round(secs)}s`;
    if (secs < 3600) return `${Math.round(secs / 60)}m ${Math.round(secs % 60)}s`;
    return `${Math.round(secs / 3600)}h ${Math.round((secs % 3600) / 60)}m`;
  };

  const handleUpload = async () => {
    if (!form.title || !videoFile) {
      showToast('Title and video file are required.', 'error');
      return;
    }

    setUploading(true);
    cancelRef.current = false;

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const totalChunks = Math.ceil(videoFile.size / CHUNK_SIZE);

    try {
      let uploadedBytes = 0;
      const startTime = Date.now();

      setUploadState({
        phase: 'uploading',
        percent: 0,
        speed: '',
        timeLeft: 'Calculating...',
        currentChunk: 0,
        totalChunks,
      });

      const CONCURRENT_UPLOADS = 4;

      for (let batch = 0; batch < totalChunks; batch += CONCURRENT_UPLOADS) {
        // Check for cancellation before starting the next batch
        if (cancelRef.current) {
          await videoAPI.cancelUpload(uploadId);
          showToast('Upload cancelled.', 'error');
          setUploading(false);
          return;
        }

        const promises = [];
        console.log("Starting batch", batch);

        for (
          let i = batch;
          i < Math.min(batch + CONCURRENT_UPLOADS, totalChunks);
          i++
        ) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, videoFile.size);
          const chunk = videoFile.slice(start, end);

          const formData = new FormData();
          formData.append('chunk', chunk);
          formData.append('chunkIndex', i);
          formData.append('totalChunks', totalChunks);
          formData.append('fileName', videoFile.name);
          formData.append('uploadId', uploadId);

          console.log("Uploading chunk", i);
          promises.push(
            videoAPI.uploadChunk(formData).then(() => {
              // Update state accurately as chunks complete
              uploadedBytes += (end - start);
              const elapsed = (Date.now() - startTime) / 1000;
              const speed = uploadedBytes / Math.max(elapsed, 0.1);
              const remaining = Math.max(0, (videoFile.size - uploadedBytes) / speed);
              const overallPercent = Math.round((uploadedBytes / videoFile.size) * 100);

              setUploadState({
                phase: 'uploading',
                percent: overallPercent,
                speed: formatBytes(speed),
                timeLeft: formatTime(remaining),
                currentChunk: Math.min(batch + CONCURRENT_UPLOADS, totalChunks),
                totalChunks,
              });
            })
          );
        }

        console.log("Waiting for", promises.length, "uploads");
        await Promise.all(promises);
        console.log("Batch finished");
      }

      // Merge chunks
      setUploadState(prev => ({ ...prev, phase: 'merging', percent: 100 }));

      const mergeForm = new FormData();
      mergeForm.append('uploadId', uploadId);
      mergeForm.append('fileName', videoFile.name);
      mergeForm.append('totalChunks', totalChunks);
      mergeForm.append('title', form.title);
      mergeForm.append('description', form.description);
      mergeForm.append('type', form.type);
      mergeForm.append('genre', form.genre);
      mergeForm.append('language', form.language);
      mergeForm.append('release_year', form.release_year);
      if (thumbFile) mergeForm.append('thumbnail', thumbFile);

      await videoAPI.mergeChunks(mergeForm);

      setUploadState(prev => ({ ...prev, phase: 'done' }));
      showToast('🎬 Video uploaded successfully!');
      setForm({ title: '', description: '', type: 'movie', genre: '', language: '', release_year: '' });
      setVideoFile(null);
      setThumbFile(null);
      setTimeout(() => onSuccess(), 1500);

    } catch (err) {
      console.error('Upload error:', err);
      showToast('Upload failed. Try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
        🎬 Upload New Content
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Title *
          </label>
          <input className="input" name="title" placeholder="Movie or Series title" value={form.title} onChange={handleChange} />
        </div>

        {/* Type */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Type *
          </label>
          <select className="input" name="type" value={form.type} onChange={handleChange}>
            <option value="movie">🎬 Movie</option>
            <option value="series">📺 Series</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Description
          </label>
          <textarea
            className="input"
            name="description"
            placeholder="Brief description..."
            value={form.description}
            onChange={handleChange}
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Genre + Language + Year */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Genre
            </label>
            <select className="input" name="genre" value={form.genre} onChange={handleChange}>
              <option value="">Select Genre</option>
              {['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Sci-Fi', 'Animation', 'Documentary', 'Crime'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Language
            </label>
            <select className="input" name="language" value={form.language} onChange={handleChange}>
              <option value="">Select Language</option>
              {['Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Release Year
            </label>
            <input
              className="input"
              name="release_year"
              type="number"
              placeholder="2024"
              min="1900"
              max="2099"
              value={form.release_year}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Thumbnail */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Thumbnail (JPG/PNG/WEBP)
          </label>
          <div
            onClick={() => thumbRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'var(--transition)',
              background: thumbFile ? 'rgba(70,211,105,0.05)' : 'transparent',
              borderColor: thumbFile ? 'var(--success)' : 'var(--border)',
            }}
          >
            {thumbFile ? (
              <div style={{ color: 'var(--success)', fontSize: '14px' }}>
                🖼️ {thumbFile.name}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                🖼️ Click to upload thumbnail
              </div>
            )}
          </div>
          <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => setThumbFile(e.target.files[0])} />
        </div>

        {/* Video File */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Video File (MP4/MKV/WEBM) *
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: '10px',
              padding: '32px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'var(--transition)',
              background: videoFile ? 'rgba(70,211,105,0.05)' : 'rgba(229,9,20,0.02)',
              borderColor: videoFile ? 'var(--success)' : 'rgba(229,9,20,0.3)',
            }}
          >
            {videoFile ? (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎬</div>
                <div style={{ color: 'var(--success)', fontWeight: '600', fontSize: '14px' }}>
                  {videoFile.name}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  {(videoFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB •{' '}
                  {Math.ceil(videoFile.size / CHUNK_SIZE)} chunks
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>
                  Click to select video file
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  MP4, MKV, WEBM • Up to 10GB • Chunked upload
                </div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
            onChange={e => setVideoFile(e.target.files[0])} />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {uploadState.phase === 'merging' ? '🔄 Merging chunks...' : uploadState.phase === 'done' ? '✅ Done!' : '⬆️ Uploading...'}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent)' }}>
                {uploadState.percent}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar" style={{ height: '8px', marginBottom: '12px' }}>
              <div className="progress-bar-fill" style={{
                width: `${uploadState.percent}%`,
                background: uploadState.phase === 'done' ? 'var(--success)' : 'var(--gradient)',
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* Stats */}
            {uploadState.phase === 'uploading' && (
              <div style={{
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Speed: </span>
                  <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{uploadState.speed}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Time left: </span>
                  <span style={{ fontWeight: '600' }}>{uploadState.timeLeft}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Chunk: </span>
                  <span style={{ fontWeight: '600' }}>{uploadState.currentChunk}/{uploadState.totalChunks}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Uploaded: </span>
                  <span style={{ fontWeight: '600' }}>
                    {((uploadState.percent / 100) * videoFile?.size / (1024 * 1024)).toFixed(1)} MB / {(videoFile?.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              </div>
            )}

            {/* Cancel Button */}
            {uploadState.phase === 'uploading' && (
              <button
                onClick={() => cancelRef.current = true}
                className="btn btn-danger"
                style={{ marginTop: '12px', padding: '8px 16px', fontSize: '12px' }}
              >
                ✕ Cancel Upload
              </button>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || !videoFile || !form.title}
          className="btn btn-primary"
          style={{
            padding: '14px',
            fontSize: '15px',
            fontWeight: '700',
            justifyContent: 'center',
            opacity: uploading || !videoFile || !form.title ? 0.6 : 1,
          }}
        >
          {uploading ? '⬆️ Uploading...' : '🚀 Upload Video'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// BULK UPLOAD TAB
// ─────────────────────────────────────────────
const BulkUploadTab = ({ showToast, onSuccess }) => {
  const [files, setFiles] = useState([]); // [{ file, status, percent, error }]
  const [type, setType] = useState('movie');
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = (e) => {
    const selected = Array.from(e.target.files).map(file => ({
      file,
      status: 'pending', // pending | uploading | merging | done | error
      percent: 0,
    }));
    setFiles(selected);
  };

  const updateFileState = (index, updates) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const uploadOneFile = async (item, index) => {
    const { file } = item;
    const uploadId = `bulk_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    updateFileState(index, { status: 'uploading', percent: 0 });

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', i);
        formData.append('totalChunks', totalChunks);
        formData.append('fileName', file.name);
        formData.append('uploadId', uploadId);

        await videoAPI.uploadChunk(formData);
        updateFileState(index, { percent: Math.round(((i + 1) / totalChunks) * 100) });
      }

      updateFileState(index, { status: 'merging' });

      const mergeForm = new FormData();
      mergeForm.append('uploadId', uploadId);
      mergeForm.append('fileName', file.name);
      mergeForm.append('totalChunks', totalChunks);
      mergeForm.append('type', type);

      await videoAPI.mergeChunks(mergeForm);

      updateFileState(index, { status: 'done', percent: 100 });
    } catch (err) {
      console.error('Bulk upload error:', err);
      updateFileState(index, { status: 'error', error: err.response?.data?.message || 'Upload failed.' });
    }
  };

  const handleBulkUpload = async () => {
    if (files.length === 0) return showToast('Select videos to upload.', 'error');
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      await uploadOneFile(files[i], i);
    }

    setUploading(false);
    const successCount = files.filter(f => f.status === 'done').length;
    showToast(`Bulk upload finished: ${successCount}/${files.length} succeeded.`);
    onSuccess();
  };

  return (
    <div style={{ maxWidth: '700px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
        📦 Bulk Upload
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
        Select multiple videos at once. Titles are auto-generated from filenames and thumbnails are auto-captured from each video.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Content Type
          </label>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            <option value="movie">🎬 Movie</option>
            <option value="series">📺 Series / Episode</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Video Files
          </label>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleFilesSelected}
            disabled={uploading}
            className="input"
          />
        </div>

        {files.length > 0 && (
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            maxHeight: '360px',
            overflowY: 'auto',
          }}>
            {files.map((f, i) => (
              <div key={i} style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
                fontSize: '13px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.file.name}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color:
                      f.status === 'done' ? 'var(--success)' :
                      f.status === 'error' ? 'var(--danger, #e50914)' :
                      'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {f.status === 'pending' && 'Waiting...'}
                    {f.status === 'uploading' && `Uploading ${f.percent}%`}
                    {f.status === 'merging' && 'Processing...'}
                    {f.status === 'done' && '✅ Done'}
                    {f.status === 'error' && `❌ ${f.error || 'Failed'}`}
                  </span>
                </div>
                {(f.status === 'uploading' || f.status === 'merging') && (
                  <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${f.status === 'merging' ? 100 : f.percent}%`,
                      background: 'var(--gradient)',
                      transition: 'width 0.2s',
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleBulkUpload}
          disabled={uploading || files.length === 0}
          className="btn btn-primary"
          style={{ padding: '12px', opacity: uploading || files.length === 0 ? 0.6 : 1 }}
        >
          {uploading ? 'Uploading...' : `Upload ${files.length || ''} Video${files.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// EDIT VIDEO METADATA TAB
// ─────────────────────────────────────────────
const EditVideoTab = ({ videos, showToast, onRefresh }) => {
  const [filter, setFilter] = useState('all'); // all | movie | series
  const [search, setSearch] = useState('');
  const [editingVideo, setEditingVideo] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', type: 'movie',
    genre: '', language: '', release_year: '',
  });
  const [thumbFile, setThumbFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const thumbRef = useRef(null);

  const filtered = videos.filter(v => {
    const matchesFilter = filter === 'all' || v.type === filter;
    const matchesSearch = v.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openEdit = (video) => {
    setEditingVideo(video);
    setForm({
      title: video.title || '',
      description: video.description || '',
      type: video.type || 'movie',
      genre: video.genre || '',
      language: video.language || '',
      release_year: video.release_year || '',
    });
    setThumbFile(null);
  };

  const closeEdit = () => {
    setEditingVideo(null);
    setThumbFile(null);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.title) return showToast('Title is required.', 'error');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('type', form.type);
      formData.append('genre', form.genre);
      formData.append('language', form.language);
      formData.append('release_year', form.release_year);
      if (thumbFile) formData.append('thumbnail', thumbFile);

      await videoAPI.update(editingVideo.id, formData);
      showToast('Video updated!');
      closeEdit();
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update video.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getThumbUrl = (video) => {
    if (!video.thumbnail_path) return null;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${base}/${video.thumbnail_path}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>✏️ Edit Video Metadata</h2>
        <input className="input" style={{ width: '240px' }} placeholder="🔍 Search videos..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'movie', label: '🎬 Movies' },
          { key: 'series', label: '📺 Episodes' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Video list */}
      {!editingVideo && (
        filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
            <h3>No videos found</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(video => (
              <div key={video.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '14px 18px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '8px',
                    background: 'var(--bg-secondary)', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                  }}>
                    {getThumbUrl(video)
                      ? <img src={getThumbUrl(video)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (video.type === 'movie' ? '🎬' : '📺')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {video.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {video.genre && `${video.genre} • `}
                      {video.language && `${video.language} • `}
                      {video.release_year && `${video.release_year}`}
                    </div>
                  </div>
                </div>
                <button onClick={() => openEdit(video)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                  ✏️ Edit
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Edit form */}
      {editingVideo && (
        <div style={{ maxWidth: '700px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Editing: {editingVideo.title}</h3>
            <button onClick={closeEdit} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
              ← Back to list
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Title *
              </label>
              <input className="input" name="title" value={form.title} onChange={handleChange} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Type *
              </label>
              <select className="input" name="type" value={form.type} onChange={handleChange}>
                <option value="movie">🎬 Movie</option>
                <option value="series">📺 Series</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea className="input" name="description" value={form.description} onChange={handleChange} rows={3} style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Genre
                </label>
                <select className="input" name="genre" value={form.genre} onChange={handleChange}>
                  <option value="">Select Genre</option>
                  {['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Sci-Fi', 'Animation', 'Documentary', 'Crime'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Language
                </label>
                <select className="input" name="language" value={form.language} onChange={handleChange}>
                  <option value="">Select Language</option>
                  {['Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Release Year
                </label>
                <input className="input" name="release_year" type="number" min="1900" max="2099" value={form.release_year} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Thumbnail
              </label>
              <div
                onClick={() => thumbRef.current?.click()}
                style={{
                  border: '2px dashed var(--border)', borderRadius: '10px', padding: '16px',
                  display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
                }}
              >
                {(thumbFile || getThumbUrl(editingVideo)) && (
                  <img
                    src={thumbFile ? URL.createObjectURL(thumbFile) : getThumbUrl(editingVideo)}
                    alt=""
                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                )}
                <div style={{ color: thumbFile ? 'var(--success)' : 'var(--text-muted)', fontSize: '13px' }}>
                  {thumbFile ? thumbFile.name : 'Click to replace thumbnail'}
                </div>
              </div>
              <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => setThumbFile(e.target.files[0])} />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !form.title}
              className="btn btn-primary"
              style={{ padding: '14px', fontSize: '15px', fontWeight: '700', justifyContent: 'center', opacity: saving || !form.title ? 0.6 : 1 }}
            >
              {saving ? '💾 Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// PLAYLISTS TAB
// ─────────────────────────────────────────────
const PlaylistsTab = ({ playlists, videos, showToast, onRefresh }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', is_featured: false });
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [addingVideo, setAddingVideo] = useState('');
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [videoSearch, setVideoSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.title) return showToast('Title required.', 'error');
    setCreating(true);
    try {
      await playlistAPI.create(form);
      showToast('Playlist created!');
      setForm({ title: '', description: '', is_featured: false });
      setShowCreate(false);
      onRefresh();
    } catch (err) {
      showToast('Failed to create playlist.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const toggleVideoSelect = (id) => {
    setSelectedVideos(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleAddVideo = async (playlistId) => {
    if (selectedVideos.length === 0) return showToast('Select at least one video.', 'error');
    setAdding(true);
    let successCount = 0;
    let failCount = 0;
    for (const id of selectedVideos) {
      try {
        await playlistAPI.addContent(playlistId, { content_id: id });
        successCount++;
      } catch (err) {
        failCount++;
      }
    }
    setAdding(false);
    setSelectedVideos([]);
    setVideoSearch('');
    if (successCount > 0) showToast(`${successCount} video(s) added!${failCount ? ` (${failCount} failed)` : ''}`);
    else showToast('Failed to add videos.', 'error');
    onRefresh();
  };

  const handleRemoveVideo = async (playlistId, contentId) => {
    try {
      await playlistAPI.removeContent(playlistId, contentId);
      showToast('Video removed.');
      onRefresh();
    } catch (err) {
      showToast('Failed to remove video.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this playlist?')) return;
    try {
      await playlistAPI.delete(id);
      showToast('Playlist deleted.');
      setSelectedPlaylist(null);
      onRefresh();
    } catch (err) {
      showToast('Failed to delete playlist.', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>📚 Playlists ({playlists.length})</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">
          + New Playlist
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Create Playlist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input className="input" placeholder="Playlist title *" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea className="input" placeholder="Description (optional)" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_featured}
                onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
              ⭐ Mark as Featured (shows on top)
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleCreate} disabled={creating} className="btn btn-primary">
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Playlists List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {playlists.map(playlist => (
          <div key={playlist.id} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}>
            {/* Playlist Header */}
            <div style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              cursor: 'pointer',
            }}
              onClick={() => setSelectedPlaylist(selectedPlaylist?.id === playlist.id ? null : playlist)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(229,9,20,0.2), rgba(178,7,16,0.1))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                }}>🎬</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700' }}>{playlist.title}</span>
                    {playlist.is_featured && <span className="badge badge-yellow">⭐ Featured</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {playlist.video_count || 0} videos
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(playlist.id); }}
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  🗑 Delete
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>
                  {selectedPlaylist?.id === playlist.id ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Expanded Playlist */}
            {selectedPlaylist?.id === playlist.id && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
                {/* Add Video */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <input
                      className="input"
                      style={{ flex: 1, minWidth: '200px' }}
                      placeholder="🔍 Search videos to add..."
                      value={videoSearch}
                      onChange={e => setVideoSearch(e.target.value)}
                    />
                    <button
                      onClick={() => handleAddVideo(playlist.id)}
                      disabled={adding || selectedVideos.length === 0}
                      className="btn btn-success"
                      style={{ padding: '10px 16px' }}
                    >
                      {adding ? 'Adding...' : `+ Add Selected (${selectedVideos.length})`}
                    </button>
                  </div>

                  <div style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                  }}>
                    {videos
                      .filter(v => v.title.toLowerCase().includes(videoSearch.toLowerCase()))
                      .map(v => {
                        const alreadyIn = (playlist.videos || []).some(pv => pv.id === v.id);
                        const isChecked = selectedVideos.includes(v.id);
                        return (
                          <label
                            key={v.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              cursor: alreadyIn ? 'not-allowed' : 'pointer',
                              opacity: alreadyIn ? 0.4 : 1,
                              borderBottom: '1px solid var(--border)',
                              fontSize: '13px',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={alreadyIn}
                              onChange={() => toggleVideoSelect(v.id)}
                            />
                            <span>{v.type === 'movie' ? '🎬' : '📺'} {v.title}</span>
                            {alreadyIn && (
                              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                                already added
                              </span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Videos in playlist */}
                {playlist.videos?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No videos yet. Add some above!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {playlist.videos?.map((v, i) => (
                      <div key={v.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        gap: '10px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', minWidth: '20px' }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: '16px' }}>{v.type === 'movie' ? '🎬' : '📺'}</span>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{v.title}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveVideo(playlist.id, v.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// VIDEOS TAB (Simple Version)
// ─────────────────────────────────────────────
const VideosTab = ({ videos, showToast, onRefresh }) => {
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const filtered = videos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this video? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await videoAPI.delete(id);
      showToast('Video deleted.');
      onRefresh();
    } catch (err) {
      showToast('Failed to delete video.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>🎥 Videos ({videos.length})</h2>
        <input className="input" style={{ width: '240px' }} placeholder="🔍 Search videos..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
          <h3>No videos found</h3>
          <p>Upload videos from the Upload tab.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(video => (
            <div key={video.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '14px 18px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                }}>
                  {video.type === 'movie' ? '🎬' : '📺'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {video.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {video.genre && `${video.genre} • `}
                    {video.language && `${video.language} • `}
                    {video.release_year && `${video.release_year} • `}
                    {(video.file_size / (1024 * 1024)).toFixed(0)} MB
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <span className={`badge ${video.type === 'movie' ? 'badge-red' : 'badge-yellow'}`}>
                  {video.type}
                </span>
                <button onClick={() => handleDelete(video.id)} disabled={deleting === video.id}
                  className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  {deleting === video.id ? '...' : '🗑 Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// USERS TAB
// ─────────────────────────────────────────────
const UsersTab = ({ users, showToast, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleSub = async (userId, currentStatus) => {
    setToggling(userId);
    try {
      await adminAPI.toggleSubscription(userId, { is_subscribed: !currentStatus });
      showToast(`Subscription ${!currentStatus ? 'activated' : 'deactivated'}!`);
      onRefresh();
    } catch (err) {
      showToast('Failed to toggle subscription.', 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(userId);
    try {
      await adminAPI.deleteUser(userId);
      showToast('User deleted.');
      onRefresh();
    } catch (err) {
      showToast('Failed to delete user.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>👥 Users ({users.length})</h2>
        <input
          className="input"
          style={{ width: '240px' }}
          placeholder="🔍 Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(user => (
          <div key={user.id} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: user.role === 'admin' ? 'var(--gradient)' : 'var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: '700', color: 'white', flexShrink: 0,
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {user.name}
                  {user.role === 'admin' && <span className="badge badge-red">Admin</span>}
                  {user.is_subscribed && <span className="badge badge-green">Pro</span>}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {user.email} • Joined {new Date(user.created_at).toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>

            {user.role !== 'admin' && (
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => handleToggleSub(user.id, user.is_subscribed)}
                  disabled={toggling === user.id}
                  className={`btn ${user.is_subscribed ? 'btn-danger' : 'btn-success'}`}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {toggling === user.id ? '...' : user.is_subscribed ? '❌ Revoke' : '✅ Activate'}
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={deleting === user.id}
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  {deleting === user.id ? '...' : '🗑'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SETTINGS TAB
// ─────────────────────────────────────────────
const SettingsTab = ({ stats, showToast, onRefresh }) => {
  const [price, setPrice] = useState(stats?.subscription?.price || 1);
  const [days, setDays] = useState(stats?.subscription?.duration_days || 30);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!price || price <= 0) return showToast('Valid price required.', 'error');
    setSaving(true);
    try {
      await adminAPI.updateSubscriptionPrice({ price: parseFloat(price), duration_days: parseInt(days) });
      showToast('Settings saved!');
      onRefresh();
    } catch (err) {
      showToast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>⚙️ Platform Settings</h2>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '20px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
          💰 Subscription Settings
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Subscription Price (₹)
            </label>
            <input
              className="input"
              type="number"
              min="1"
              step="0.5"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Subscription Duration (days)
            </label>
            <input
              className="input"
              type="number"
              min="1"
              value={days}
              onChange={e => setDays(e.target.value)}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '12px', justifyContent: 'center', fontWeight: '700' }}
          >
            {saving ? '⏳ Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      {/* Current Settings */}
      <div style={{
        background: 'rgba(70,211,105,0.05)',
        border: '1px solid rgba(70,211,105,0.2)',
        borderRadius: '12px',
        padding: '16px 20px',
      }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Current Active Settings</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--success)' }}>₹{stats?.subscription?.price}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Price</div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800' }}>{stats?.subscription?.duration_days}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Days</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
