import { NextFunction, Request, Response } from 'express';

/** Blocks quotation paths even when separators or path segments are URL encoded. */
export function denyPublicQuotationFiles(req: Request, res: Response, next: NextFunction): void {
  let pathname = req.url.split('?', 1)[0];
  try {
    for (let pass = 0; pass < 16; pass += 1) {
      const decoded = decodeURIComponent(pathname);
      if (decoded === pathname) break;
      pathname = decoded;
      if (pass === 15 && /%[0-9a-f]{2}/i.test(pathname)) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(404).end();
        return;
      }
    }
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(404).end();
    return;
  }

  const segments = pathname.replace(/\\/g, '/').split('/');
  if (segments.some(segment => segment.toLowerCase() === 'quotations')) {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(404).end();
    return;
  }
  next();
}
