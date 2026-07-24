import { supabase } from "@/integrations/supabase/client";

const CACHE_TTL_MS = 4 * 60 * 1000;

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

export function invalidateMediaCache(path?: string) {
  if (path) cache.delete(path);
  else cache.clear();
}

export async function getMediaUrl(pathOrUrl: string | null): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const now = Date.now();
  const hit = cache.get(pathOrUrl);
  if (hit && hit.expiresAt > now) return hit.url;

  const pending = inflight.get(pathOrUrl);
  if (pending) return pending;

  const promise = (async () => {
    const { data, error } = await supabase.functions.invoke("media-url", {
      body: { path: pathOrUrl },
    });
    if (error || !data?.url) return null;
    cache.set(pathOrUrl, { url: data.url, expiresAt: Date.now() + CACHE_TTL_MS });
    return data.url as string;
  })().finally(() => {
    inflight.delete(pathOrUrl);
  });

  inflight.set(pathOrUrl, promise);
  return promise;
}

export async function getMediaUrls<T extends { id: string }>(
  items: T[],
  pickPath: (item: T) => string | null,
) {
  const pairs = await Promise.all(
    items.map(async (item) => [item.id, await getMediaUrl(pickPath(item))] as const),
  );
  return new Map(pairs);
}
