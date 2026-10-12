import { MARKETPLACE_IDS, SERIES_TYPES } from '@repo/shared';
import { sql } from 'drizzle-orm';
import {
  bigint,
  char,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const marketplaceEnum = pgEnum('marketplace', MARKETPLACE_IDS);
export const offerTypeEnum = pgEnum('offer_type', SERIES_TYPES);
export const observationStatusEnum = pgEnum('observation_status', [
  'accepted', // became (or confirmed) a price point
  'duplicate', // same price as the current point — only bumps last_observed_at
  'pending', // suspicious jump, waiting for corroboration from other users
  'rejected', // failed server-side sanity checks
]);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

/** One row per person. Created anonymously on first install; email is optional (future login). */
export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().unique(),
  lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
});

/**
 * Bearer tokens issued to extension installs. Only the SHA-256 hash is stored,
 * so a database leak does not leak usable credentials.
 */
export const apiTokens = pgTable(
  'api_tokens',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: char({ length: 64 }).notNull(),
    label: varchar({ length: 64 }),
    lastUsedAt: timestamp({ withTimezone: true }),
    revokedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('api_tokens_token_hash_idx').on(t.tokenHash),
    index('api_tokens_user_idx').on(t.userId),
  ],
);

export const products = pgTable(
  'products',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    marketplace: marketplaceEnum().notNull(),
    asin: varchar({ length: 10 }).notNull(),
    title: text(),
    imageUrl: text(),
    lastObservedAt: timestamp({ withTimezone: true }),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ...timestamps,
  },
  (t) => [uniqueIndex('products_marketplace_asin_idx').on(t.marketplace, t.asin)],
);

/**
 * Raw crowdsourced reports. Kept for corroboration, abuse analysis and
 * re-processing. Kept indefinitely (no PII; user_id is nulled on erasure).
 */
export const priceObservations = pgTable(
  'price_observations',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    productId: bigint({ mode: 'number' })
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid().references(() => users.id, { onDelete: 'set null' }),
    offerType: offerTypeEnum().notNull(),
    priceCents: integer(),
    listPriceCents: integer(),
    status: observationStatusEnum().notNull(),
    observedAt: timestamp({ withTimezone: true }).notNull(),
    receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('price_obs_product_offer_received_idx').on(t.productId, t.offerType, t.receivedAt.desc()),
    index('price_obs_received_idx').on(t.receivedAt),
  ],
);

/**
 * Consolidated, change-only price history: a row exists only when the price
 * changed. This is what the chart reads. `price_cents` NULL = no offer.
 */
export const pricePoints = pgTable(
  'price_points',
  {
    productId: bigint({ mode: 'number' })
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    offerType: offerTypeEnum().notNull(),
    ts: timestamp({ withTimezone: true }).notNull(),
    priceCents: integer(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.offerType, t.ts] })],
);

/** Per-user watchlist + price alerts. */
export const trackedProducts = pgTable(
  'tracked_products',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: bigint({ mode: 'number' })
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    targetPriceCents: integer(),
    lastNotifiedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    unique('tracked_products_user_product_uq').on(t.userId, t.productId),
    index('tracked_products_product_idx')
      .on(t.productId)
      .where(sql`${t.targetPriceCents} is not null`),
  ],
);
