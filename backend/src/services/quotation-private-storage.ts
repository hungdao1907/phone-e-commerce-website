import path from 'path';

function isWithin(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

/** Resolve a new quotation file outside Express's public uploads roots. This module does not create files. */
export function resolvePrivateQuotationFile(
  storageKey: string,
  options: { cwd?: string; privateRoot?: string; publicUploadRoots?: string[] } = {},
): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,179}$/.test(storageKey) || storageKey === '.' || storageKey === '..') {
    throw new Error('Invalid private quotation storage key.');
  }

  const cwd = options.cwd || process.cwd();
  const root = path.resolve(options.privateRoot || path.join(cwd, 'private-data', 'quotations'));
  const publicRoots = options.publicUploadRoots || [path.join(cwd, 'uploads')];
  for (const publicRootInput of publicRoots) {
    const publicRoot = path.resolve(publicRootInput);
    if (isWithin(publicRoot, root) || isWithin(root, publicRoot)) {
      throw new Error('Private quotation storage must be separate from public uploads.');
    }
  }

  const filePath = path.resolve(root, storageKey);
  if (!isWithin(root, filePath) || filePath === root) {
    throw new Error('Quotation storage key escapes the private storage root.');
  }
  return filePath;
}
