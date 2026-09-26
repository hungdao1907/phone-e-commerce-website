export interface WatchColorSwatch {
  name: string;
  hex: string;
}

export interface WatchModel {
  id: string;
  name: string;
  shortName?: string;
  categoryBadge: string;
  tagline: string;
  price: string;
  startingPrice?: string;
  image: string;
  badge?: string;
  featured?: boolean;
  sizes: string[];
  swatches: WatchColorSwatch[];
  highlights: string[];
  route: string;
  ambientColor?: string;
}

export interface WatchFinalModel {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  startingPrice: string;
  image: string;
  ambientColor: string;
  route: string;
}
