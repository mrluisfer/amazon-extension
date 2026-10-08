import {
  AsinSchema,
  type HistoryResponse,
  MarketplaceIdSchema,
  marketplaceFromHostname,
  ObservationSchema,
  type TrackedProduct,
  TrackProductSchema,
} from '@repo/shared';
import * as v from 'valibot';
import { type Browser, browser } from 'wxt/browser';

/**
 * Typed, validated messaging between contexts. The background is the only
 * context that talks to the API or holds the token; every message is
 * re-validated there and checked against an allow-list of sender kinds:
 *
 * - "content":   content script running on an Amazon page (untrusted page DOM!)
 * - "extension": our own pages (popup, options, the panel iframe)
 */
type SenderKind = 'content' | 'extension';

const messages = {
  'observations:report': {
    from: ['content'],
    input: v.object({
      observations: v.pipe(v.array(ObservationSchema), v.minLength(1), v.maxLength(10)),
    }),
  },
  'history:get': {
    from: ['extension'],
    input: v.object({
      marketplace: MarketplaceIdSchema,
      asin: AsinSchema,
      days: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(3650)),
    }),
  },
  'tracked:list': { from: ['extension'], input: v.object({}) },
  'tracked:add': { from: ['extension'], input: TrackProductSchema },
  'tracked:remove': { from: ['extension'], input: v.object({ id: v.pipe(v.string(), v.uuid()) }) },
  'account:delete': { from: ['extension'], input: v.object({}) },
} as const satisfies Record<string, { from: readonly SenderKind[]; input: v.GenericSchema }>;

interface MessageOutputs {
  'observations:report': { queued: number };
  'history:get': HistoryResponse;
  'tracked:list': TrackedProduct[];
  'tracked:add': { id: string };
  'tracked:remove': null;
  'account:delete': null;
}

export type MessageType = keyof typeof messages;
type Input<K extends MessageType> = v.InferInput<(typeof messages)[K]['input']>;
type ParsedInput<K extends MessageType> = v.InferOutput<(typeof messages)[K]['input']>;
type Envelope<T> = { ok: true; data: T } | { ok: false; error: string };

export class MessageError extends Error {}

export async function sendMessage<K extends MessageType>(
  type: K,
  data: Input<K>,
): Promise<MessageOutputs[K]> {
  const res = (await browser.runtime.sendMessage({ type, data })) as
    | Envelope<MessageOutputs[K]>
    | undefined;
  if (!res) throw new MessageError('No response from background');
  if (!res.ok) throw new MessageError(res.error);
  return res.data;
}

export type MessageHandlers = {
  [K in MessageType]: (
    data: ParsedInput<K>,
    sender: Browser.runtime.MessageSender,
  ) => Promise<MessageOutputs[K]>;
};

function classifySender(
  sender: Browser.runtime.MessageSender,
  extensionOrigin: string,
): SenderKind | null {
  if (sender.id !== browser.runtime.id || !sender.url) return null;
  let url: URL;
  try {
    url = new URL(sender.url);
  } catch {
    return null;
  }
  if (url.origin === extensionOrigin) return 'extension';
  if (sender.tab && url.protocol === 'https:' && marketplaceFromHostname(url.hostname))
    return 'content';
  return null;
}

function isKnownType(type: unknown): type is MessageType {
  return typeof type === 'string' && Object.hasOwn(messages, type);
}

/** Call once, synchronously, at the top of the background entrypoint. */
export function registerMessageHandlers(handlers: MessageHandlers): void {
  const extensionOrigin = new URL(browser.runtime.getURL('/')).origin;

  browser.runtime.onMessage.addListener((raw: unknown, sender, sendResponse) => {
    const msg = raw as { type?: unknown; data?: unknown } | null;
    if (!msg || !isKnownType(msg.type)) return false;

    const type = msg.type;
    const def = messages[type];
    const kind = classifySender(sender, extensionOrigin);
    if (!kind || !(def.from as readonly SenderKind[]).includes(kind)) {
      sendResponse({ ok: false, error: 'forbidden' } satisfies Envelope<never>);
      return false;
    }

    const parsed = v.safeParse(def.input, msg.data);
    if (!parsed.success) {
      sendResponse({ ok: false, error: 'invalid_message' } satisfies Envelope<never>);
      return false;
    }

    const handler = handlers[type] as (d: unknown, s: typeof sender) => Promise<unknown>;
    handler(parsed.output, sender).then(
      (data) => sendResponse({ ok: true, data }),
      (err: unknown) => {
        console.warn(`[messaging] ${type} failed`, err);
        sendResponse({ ok: false, error: err instanceof Error ? err.message : 'unknown_error' });
      },
    );
    return true; // keep the channel open for the async response
  });
}
