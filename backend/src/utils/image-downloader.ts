import axios from 'axios';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import streamifier from 'streamifier';
import { URL } from 'url';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';

export function isPublicImageAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 169 && b === 254
      || a === 172 && b >= 16 && b <= 31 || a === 192 && (b === 168 || b === 0)
      || a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19));
  }
  // Fail closed for IPv4-mapped, local, link-local, multicast and reserved IPv6.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:db8:/i.test(address);
}

// Helper to prevent SSRF
function isSafeUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    // Basic IP check for common private networks
    const hostname = url.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
    ) {
      return false;
    }
    const literal = hostname.replace(/^\[|\]$/g, '');
    if (isIP(literal)) return isPublicImageAddress(literal);
    return true;
  } catch {
    return false;
  }
}

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

/** Original URL first, then decoded form, then URL without imgproxy `unsafe/.../filters` wrapper. */
function buildUrlCandidates(url: string): string[] {
  const list: string[] = [url];
  try {
    const decoded = decodeURIComponent(url);
    if (decoded !== url) list.push(decoded);
    const m = decoded.match(/^(https?:\/\/[^/]+)\/unsafe\/[^/]+\/(?:filters:[^/]*\/)?(.+)$/);
    if (m) list.push(`${m[1]}/${m[2]}`);
  } catch { /* ignore malformed encoding */ }
  return Array.from(new Set(list));
}

let useCloudinary = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  useCloudinary = true;
}

const localUploadsDir = path.resolve(__dirname, '..', '..', 'uploads', 'products');
if (!useCloudinary && !fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

/**
 * Download, process and save an image.
 * Returns the URL/path of the saved image.
 */
export async function downloadAndProcessImage(imageUrl: string): Promise<string> {
  if (!imageUrl || typeof imageUrl !== 'string') throw new Error('Invalid URL');

  const trimmedUrl = imageUrl.trim();
  if (!isSafeUrl(trimmedUrl)) {
    throw new Error('Unsafe URL rejected');
  }

  console.log(`\n[IMAGE IMPORT]`);
  console.log(`Remote URL: ${trimmedUrl}`);
  console.log(`[IMAGE IMPORT] Downloading...`);

  // 1. Download image (try original, then normalized variants; e.g. FPT CDN
  //    rejects percent-encoded `filters%3Aformat%28webp%29` with 404)
  const candidates = buildUrlCandidates(trimmedUrl).filter(isSafeUrl);
  let response: any;
  let lastError: any;
  for (const candidate of candidates) {
    try {
      const target = new URL(candidate);
      const hostname = target.hostname.replace(/^\[|\]$/g, '');
      const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await lookup(hostname, { all: true });
      if (!addresses.length || addresses.some(entry => !isPublicImageAddress(entry.address))) throw new Error('Non-public image host rejected');
      // Pin validated DNS results to avoid a second lookup/rebinding. Do not follow redirects to an unchecked host.
      const pinnedLookup: any = (_host: string, options: any, callback: any) => options?.all
        ? callback(null, addresses) : callback(null, addresses[0].address, addresses[0].family);
      if (candidate !== trimmedUrl) console.log(`[IMAGE IMPORT] Retrying with normalized URL: ${candidate}`);
      response = await axios.get(candidate, {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxRedirects: 0,
        proxy: false,
        httpAgent: new HttpAgent({ lookup: pinnedLookup }),
        httpsAgent: new HttpsAgent({ lookup: pinnedLookup }),
        maxContentLength: 10 * 1024 * 1024, // 10MB limit
        headers: { 'User-Agent': BROWSER_UA, Accept: 'image/*,*/*;q=0.8' },
      });
      break;
    } catch (error: any) {
      const status = error.response?.status;
      lastError = new Error(status ? `Image download HTTP ${status}` : 'Image host unavailable or rejected');
      console.error(`[IMAGE IMPORT ERROR] ${lastError.message}`);
    }
  }
  if (!response) throw lastError || new Error('Download failed');

  console.log(`[IMAGE IMPORT] HTTP status: ${response.status}`);
  if (response.status !== 200) {
    const reason = `Failed to download image, HTTP status: ${response.status}`;
    console.error(`[IMAGE IMPORT ERROR]\nURL: ${trimmedUrl}\nReason: ${reason}`);
    throw new Error(reason);
  }

  const rawContentType = response.headers['content-type'];
  const contentType = Array.isArray(rawContentType) ? rawContentType[0] : String(rawContentType || '');
  console.log(`[IMAGE IMPORT] Content-Type: ${contentType}`);

  if (!contentType.startsWith('image/')) {
    const reason = `Invalid content type: ${contentType}`;
    console.error(`[IMAGE IMPORT ERROR]\nURL: ${trimmedUrl}\nReason: ${reason}`);
    throw new Error(reason);
  }

  const buffer = Buffer.from(response.data);
  console.log(`[IMAGE IMPORT] Size: ${(buffer.length / 1024).toFixed(2)} KB`);
  console.log(`[IMAGE IMPORT] Processing WebP...`);

  // 2. Process to WebP using sharp
  let webpBuffer;
  try {
    webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
  } catch (error: any) {
    console.error(`[IMAGE IMPORT ERROR]\nURL: ${trimmedUrl}\nReason: Sharp processing failed - ${error.message}`);
    throw error;
  }

  console.log(`[IMAGE IMPORT] Uploading storage... (Cloudinary: ${useCloudinary})`);

  // 3. Upload to Cloudinary or save locally
  const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;

  if (useCloudinary) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'apple_store/uploads', format: 'webp' },
        (error, result) => {
          if (result && result.secure_url) {
            console.log(`[IMAGE IMPORT] Stored URL: ${result.secure_url}`);
            resolve(result.secure_url);
          } else {
            console.error(`[IMAGE IMPORT ERROR]\nURL: ${trimmedUrl}\nReason: Cloudinary error - ${error?.message || 'Unknown'}`);
            reject(error || new Error('Unknown Cloudinary error'));
          }
        }
      );
      streamifier.createReadStream(webpBuffer).pipe(stream);
    });
  } else {
    // Local fallback
    try {
      const filePath = path.join(localUploadsDir, filename);
      fs.writeFileSync(filePath, webpBuffer);
      const storedUrl = `/uploads/products/${filename}`;
      console.log(`[IMAGE IMPORT] Stored URL: ${storedUrl}`);
      return storedUrl;
    } catch (error: any) {
      console.error(`[IMAGE IMPORT ERROR]\nURL: ${trimmedUrl}\nReason: Local file write failed - ${error.message}`);
      throw error;
    }
  }
}
