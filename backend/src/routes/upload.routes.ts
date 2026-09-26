import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import env from '../env';

const router = express.Router();

// Config Cloudinary
let useCloudinary = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  useCloudinary = true;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

// Memory storage for Cloudinary upload
const memoryStorage = multer.memoryStorage();

// Disk storage for local fallback
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
const bannersDir = path.resolve(uploadsDir, 'banners');

if (!useCloudinary) {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(bannersDir)) fs.mkdirSync(bannersDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
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
  storage: useCloudinary ? memoryStorage : diskStorage,
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
  upload.single('image')(req, res, async (err) => {
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

      if (useCloudinary) {
        // Upload to Cloudinary from memory buffer
        const streamUpload = (req: express.Request) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: 'apple_store/uploads' },
              (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(error);
                }
              }
            );
            streamifier.createReadStream(req.file!.buffer).pipe(stream);
          });
        };

        const result: any = await streamUpload(req);
        return res.status(200).json({
          message: 'Tải ảnh lên thành công',
          url: result.secure_url,
          imageUrl: result.secure_url,
        });

      } else {
        // Local upload (fallback)
        const relativePath = `/uploads/banners/${req.file.filename}`;
        return res.status(200).json({
          message: 'Tải ảnh lên thành công',
          url: relativePath,
          imageUrl: relativePath,
        });
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ message: 'Lỗi server khi tải ảnh lên.' });
    }
  });
});

export default router;
