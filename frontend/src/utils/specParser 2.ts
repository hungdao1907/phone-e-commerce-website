/**
 * Shared utility to extract short, displayable values from raw specification strings.
 * Used by both ProductCard (spec chips) and SidebarFilter (filter options).
 * 
 * Database stores specs like:
 *   "6.1 inch Super Retina XDR OLED, 2532 x 1170, HDR, 460 ppi..."
 * 
 * We extract:
 *   "6.1""
 */

/** Extract screen size from a raw display spec string. e.g. "6.1 inch Super Retina..." → "6.1\"" */
export function extractScreenSize(raw: string): string {
  if (!raw) return '';
  // Match patterns like "6.1 inch", "6.1"", "6.1 inches", "6,9 inches"
  const match = raw.match(/([\d,.]+)\s*(?:inch|inches|"|″)/i);
  if (match) return match[1].replace(',', '.') + '"';
  // Fallback: just a number at the start
  const numMatch = raw.match(/^([\d,.]+)/);
  if (numMatch) return numMatch[1].replace(',', '.') + '"';
  return '';
}

/** Extract chip name. e.g. "Apple A18, CPU 6 lõi" → "A18", "Chip A19 PRO" → "A19 Pro" */
export function extractChipName(raw: string): string {
  if (!raw) return '';
  // Match "A18", "A19 Pro", "A18 Bionic", "A17 Pro", "Snapdragon 8 Gen 3", etc.
  const aMatch = raw.match(/A(\d+)\s*(Pro|Bionic|Max)?/i);
  if (aMatch) {
    let result = 'A' + aMatch[1];
    if (aMatch[2]) result += ' ' + aMatch[2].charAt(0).toUpperCase() + aMatch[2].slice(1).toLowerCase();
    return result;
  }
  // Snapdragon
  const snapMatch = raw.match(/Snapdragon\s+(\d+(?:\s+Gen\s+\d+)?)/i);
  if (snapMatch) return 'SD ' + snapMatch[1];
  // Dimensity
  const dimMatch = raw.match(/Dimensity\s+(\d+)/i);
  if (dimMatch) return 'Dimensity ' + dimMatch[1];
  // Exynos
  const exyMatch = raw.match(/Exynos\s+(\d+)/i);
  if (exyMatch) return 'Exynos ' + exyMatch[1];
  // Generic fallback: take first significant word
  const words = raw.split(/[,;]/)[0].trim();
  return words.length > 20 ? words.substring(0, 18) + '…' : words;
}

/** Extract main camera MP. e.g. "Sau: 48MP Fusion + 12MP Ultra Wide" → "48MP" */
export function extractCameraMP(raw: string): string {
  if (!raw) return '';
  // Find the highest MP number (main camera)
  const matches = raw.match(/(\d+)\s*MP/gi);
  if (matches && matches.length > 0) {
    // Get all MP values and return the highest
    const mpValues = matches.map(m => {
      const n = m.match(/(\d+)/);
      return n ? parseInt(n[1]) : 0;
    });
    const maxMP = Math.max(...mpValues);
    return maxMP + 'MP';
  }
  return '';
}

/** Extract RAM. e.g. "8GB" or "12GB RAM" → "8GB" */
export function extractRAM(raw: string): string {
  if (!raw) return '';
  const match = raw.match(/(\d+)\s*GB/i);
  return match ? match[1] + 'GB' : raw.trim();
}

/** 
 * Build an array of short spec chips for a product card.
 * Returns up to 4 items: [screen, storage, camera, chip]
 */
export function buildSpecChips(specs: { display?: string; chipset?: string; camera?: string; battery?: string } | undefined, storageFromVariant?: string): string[] {
  const chips: string[] = [];
  if (!specs) return chips;

  const screen = extractScreenSize(specs.display || '');
  if (screen) chips.push(screen);

  if (storageFromVariant) chips.push(storageFromVariant);

  const camera = extractCameraMP(specs.camera || '');
  if (camera) chips.push(camera);

  const chip = extractChipName(specs.chipset || '');
  if (chip) chips.push(chip);

  return chips.slice(0, 4);
}

/**
 * Build spec chips from raw specifications array (used by FilteredProductCard).
 * specs is Array<{key: string, value: string}>
 */
export function buildSpecChipsFromRaw(specifications: { key: string; value: string }[] | null, variants?: any[]): string[] {
  if (!specifications || !Array.isArray(specifications)) return [];

  const getSpec = (keyword: string) => {
    const spec = specifications.find(s => s.key.toLowerCase().includes(keyword));
    return spec ? spec.value : '';
  };

  const chips: string[] = [];

  // Screen size
  const screen = extractScreenSize(getSpec('màn hình'));
  if (screen) chips.push(screen);

  // Storage from variants (first variant's "Dung lượng")
  if (variants && variants.length > 0) {
    const storageValues = new Set<string>();
    variants.forEach(v => {
      const st = v.attributes?.['Dung lượng'];
      if (st) storageValues.add(st);
    });
    const sortedStorage = Array.from(storageValues).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
    if (sortedStorage.length > 0) {
      // Show lowest storage
      chips.push(sortedStorage[0]);
    }
  }

  // Camera
  const camera = extractCameraMP(getSpec('camera'));
  if (camera) chips.push(camera);

  // Chip
  const chipRaw = getSpec('chip') || getSpec('cpu');
  const chip = extractChipName(chipRaw);
  if (chip) chips.push(chip);

  return chips.slice(0, 4);
}
