import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads and uploads/banners directories exist reliably
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
const bannersDir = path.resolve(uploadsDir, 'banners');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

// Configure storage for banners
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, bannersDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
    const uniqueSuffix = `banner-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên hình ảnh hợp lệ (JPG, PNG, WEBP, GIF, SVG)!'));
    }
  },
});

// POST /api/upload
router.post('/', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Ảnh vượt quá kích thước 5MB cho phép.' });
      }
      return res.status(400).json({ message: `Lỗi tải tệp: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: (err as Error).message || 'Lỗi kiểm tra tệp tải lên.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Không tìm thấy file ảnh.' });
      }

      // Return relative path to avoid hardcoding localhost or domains in database
      const relativePath = `/uploads/banners/${req.file.filename}`;

      return res.status(200).json({
        message: 'Tải ảnh lên thành công',
        url: relativePath,
        imageUrl: relativePath,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ message: 'Lỗi server khi tải ảnh lên.' });
    }
  });
});

export default router;
