import * as v from 'valibot';
import { MARKETPLACE_IDS, OFFER_TYPES } from './marketplaces';

/**
 * Wire schemas shared by the extension and the API. Everything that crosses a
 * trust boundary (content script → background → API) is validated with these.
 */

/** Amazon ASIN: 10 uppercase alphanumerics (ISBN-10 for books is also valid). */
export const AsinSchema = v.pipe(v.string(), v.regex(/^[A-Z0-9]{10}$/, 'Invalid ASIN'));

export const MarketplaceIdSchema = v.picklist(MARKETPLACE_IDS);
export const OfferTypeSchema = v.picklist(OFFER_TYPES);

/** Prices are integer cents. Upper bound guards against parser garbage / abuse. */
export const PriceCentsSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
  v.maxValue(100_000_000),
);

const AMAZON_IMAGE_HOSTS = ['m.media-amazon.com', 'images-na.ssl-images-amazon.com'];

export const AmazonImageUrlSchema = v.pipe(
  v.string(),
  v.maxLength(500),
  v.url(),
  v.check((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && AMAZON_IMAGE_HOSTS.includes(url.hostname);
    } catch {
      return false;
    }
  }, 'Image must be an https Amazon CDN URL'),
);

export const AvailabilitySchema = v.picklist(['in_stock', 'out_of_stock', 'unknown']);

/** A single crowdsourced price report produced by the content script parser. */
export const ObservationSchema = v.object({
  marketplace: MarketplaceIdSchema,
  asin: AsinSchema,
  offerType: OfferTypeSchema,
  /** null = no offer of this type (out of stock / unavailable). */
  priceCents: v.nullable(PriceCentsSchema),
  listPriceCents: v.optional(v.nullable(PriceCentsSchema)),
  availability: v.optional(AvailabilitySchema, 'unknown'),
  title: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(500))),
  imageUrl: v.optional(AmazonImageUrlSchema),
  /** Client clock; the server clamps it to a sane window. ISO-8601. */
  observedAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type Observation = v.InferOutput<typeof ObservationSchema>;

export const MAX_OBSERVATIONS_PER_BATCH = 25;

export const ObservationBatchSchema = v.object({
  observations: v.pipe(
    v.array(ObservationSchema),
    v.minLength(1),
    v.maxLength(MAX_OBSERVATIONS_PER_BATCH),
  ),
});
export type ObservationBatch = v.InferOutput<typeof ObservationBatchSchema>;

export const ProductParamsSchema = v.object({
  marketplace: MarketplaceIdSchema,
  asin: AsinSchema,
});

export const HistoryQuerySchema = v.object({
  days: v.optional(
    v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1), v.maxValue(3650)),
    '365',
  ),
});

export const TrackProductSchema = v.object({
  marketplace: MarketplaceIdSchema,
  asin: AsinSchema,
  targetPriceCents: v.optional(v.nullable(PriceCentsSchema)),
});
export type TrackProductInput = v.InferOutput<typeof TrackProductSchema>;

export const UuidParamSchema = v.object({ id: v.pipe(v.string(), v.uuid()) });
