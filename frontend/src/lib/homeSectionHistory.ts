export const HOME_RETURN_STORAGE_KEY = 'webphone_home_return_section';

export const HOME_SECTION_IDS = {
  hero: 'home-hero',
  featuredProducts: 'home-featured-products',
  finalCta: 'home-final-cta',
  ecosystem: 'home-ecosystem',
  waveGallery: 'home-wave-gallery',
  trustBenefits: 'home-trust-benefits',
} as const;

export interface HomeSectionReturnMarker {
  sectionId: string;
  homeLocationKey: string;
}

export function rememberHomeSection(sectionId: string, homeLocationKey: string): void {
  if (!sectionId || !homeLocationKey) return;

  try {
    sessionStorage.setItem(
      HOME_RETURN_STORAGE_KEY,
      JSON.stringify({ sectionId, homeLocationKey } satisfies HomeSectionReturnMarker),
    );
  } catch {
    // Session storage may be unavailable in restricted browser contexts.
  }
}

export function readHomeSectionReturn(): HomeSectionReturnMarker | null {
  try {
    const raw = sessionStorage.getItem(HOME_RETURN_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const marker = parsed as Partial<HomeSectionReturnMarker>;
    if (typeof marker.sectionId !== 'string' || typeof marker.homeLocationKey !== 'string') return null;

    return { sectionId: marker.sectionId, homeLocationKey: marker.homeLocationKey };
  } catch {
    return null;
  }
}
