/**
 * Resolves media URLs by prepending the backend API base URL if the path is relative.
 * Avoids hardcoding localhost in components and gracefully handles both relative paths (/uploads/...)
 * and full URLs (http/https).
 */
export function resolveMediaUrl(src?: string | null): string {
  if (!src) return '';

  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  if (/^https?:\/\//i.test(src)) {
    // If it's a legacy localhost URL pointing to /uploads/, rewrite to current API base URL
    const localhostUploadsMatch = src.match(/^https?:\/\/localhost:\d+(\/uploads\/.+)$/i);
    if (localhostUploadsMatch) {
      return `${apiUrl}${localhostUploadsMatch[1]}`;
    }
    return src;
  }

  const cleanPath = src.startsWith('/') ? src : `/${src}`;
  return `${apiUrl}${cleanPath}`;
}

export default resolveMediaUrl;
