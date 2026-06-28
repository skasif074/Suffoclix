const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const uploadChunk = async (req, res) => {
  try {
    const { chunkIndex, totalChunks, fileName, uploadId } = req.body;
    const chunk = req.file;
    if (!chunk) return res.status(400).json({ success: false, message: 'No chunk received.' });
    const tempDir = path.join(__dirname, '../../uploads/temp', uploadId);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
    fs.renameSync(chunk.path, chunkPath);
    res.json({ success: true, message: `Chunk ${chunkIndex} received.`, chunkIndex: parseInt(chunkIndex) });
  } catch (err) {
    console.error('ChunkUpload error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const mergeChunks = async (req, res) => {
  try {
    const { uploadId, fileName, totalChunks, title, description, type, genre, language, release_year } = req.body;
    if (!uploadId || !fileName || !totalChunks) {
      return res.status(400).json({ success: false, message: 'Missing merge params.' });
    }
    const tempDir = path.join(__dirname, '../../uploads/temp', uploadId);
    const fileExt = path.extname(fileName);
    const finalFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${fileExt}`;
    const finalDir = path.join(__dirname, '../../uploads', type === 'series' ? 'series' : 'movies');
    const finalPath = path.join(finalDir, finalFileName);
    if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

    const writeStream = fs.createWriteStream(finalPath);
    for (let i = 0; i < parseInt(totalChunks); i++) {
      const chunkPath = path.join(tempDir, `chunk_${i}`);
      if (!fs.existsSync(chunkPath)) {
        return res.status(400).json({ success: false, message: `Missing chunk ${i}.` });
      }
      const chunkBuffer = fs.readFileSync(chunkPath);
      writeStream.write(chunkBuffer);
    }
    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    fs.rmSync(tempDir, { recursive: true, force: true });

    const fileStat = fs.statSync(finalPath);
    const file_path = `uploads/${type === 'series' ? 'series' : 'movies'}/${finalFileName}`;

    let thumbnail_path = null;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      thumbnail_path = `uploads/thumbnails/${req.files.thumbnail[0].filename}`;
    }

    console.log('💾 Saving to DB:', { title, type, file_path });

    const [result] = await db.query(
      `INSERT INTO videos (title, description, type, genre, language, release_year, file_path, thumbnail_path, file_size, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, type || 'movie', genre || null, language || null, release_year || null, file_path, thumbnail_path, fileStat.size, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: '🎬 Video uploaded successfully!',
      video: { id: result.insertId, title, type, file_path, thumbnail_path }
    });

  } catch (err) {
    console.error('MergeChunks error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getAllVideos = async (req, res) => {
  try {
    const { type, genre, language, search } = req.query;
    let sql = 'SELECT * FROM videos WHERE 1=1';
    const params = [];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (genre) { sql += ' AND genre = ?'; params.push(genre); }
    if (language) { sql += ' AND language = ?'; params.push(language); }
    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR genre LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY created_at DESC';
    const [videos] = await db.query(sql, params);
    res.json({ success: true, videos });
  } catch (err) {
    console.error('GetAllVideos error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getVideo = async (req, res) => {
  try {
    const [videos] = await db.query('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (videos.length === 0) return res.status(404).json({ success: false, message: 'Video not found.' });
    res.json({ success: true, video: videos[0] });
  } catch (err) {
    console.error('GetVideo error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const streamVideo = async (req, res) => {
  try {
    const [users] = await db.query('SELECT is_subscribed FROM users WHERE id = ?', [req.user.id]);
    if (!users[0].is_subscribed) {
      return res.status(403).json({ success: false, message: 'Subscription required.' });
    }
    const [videos] = await db.query('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (videos.length === 0) return res.status(404).json({ success: false, message: 'Video not found.' });

    const videoPath = path.join(__dirname, '../../', videos[0].file_path);
    if (!fs.existsSync(videoPath)) return res.status(404).json({ success: false, message: 'File not found.' });

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      });
      file.pipe(res);
    } else {
      res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': 'video/mp4' });
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error('Stream error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const [videos] = await db.query('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    if (videos.length === 0) return res.status(404).json({ success: false, message: 'Video not found.' });
    const filePath = path.join(__dirname, '../../', videos[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (videos[0].thumbnail_path) {
      const thumbPath = path.join(__dirname, '../../', videos[0].thumbnail_path);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }
    await db.query('DELETE FROM videos WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Video deleted successfully.' });
  } catch (err) {
    console.error('DeleteVideo error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const cancelUpload = async (req, res) => {
  try {
    const { uploadId } = req.params;
    const tempDir = path.join(__dirname, '../../uploads/temp', uploadId);
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    res.json({ success: true, message: 'Upload cancelled.' });
  } catch (err) {
    console.error('CancelUpload error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { uploadChunk, mergeChunks, getAllVideos, getVideo, streamVideo, deleteVideo, cancelUpload };