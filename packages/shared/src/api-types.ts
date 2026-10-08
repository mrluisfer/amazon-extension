import type { MarketplaceId, OfferType } from './marketplaces';

/** Response of GET /v1/products/:marketplace/:asin/history */
export interface HistoryResponse {
  product: {
    marketplace: MarketplaceId;
    asin: string;
    title: string | null;
    imageUrl: string | null;
  } | null;
  /** Encoded with `encodeSeries` — decode with `decodeSeries`. */
  series: Record<OfferType, number[]>;
  generatedAt: string;
}

export interface TrackedProduct {
  id: string;
  marketplace: MarketplaceId;
  asin: string;
  title: string | null;
  imageUrl: string | null;
  targetPriceCents: number | null;
  createdAt: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}
