import { supabase } from "@/integrations/supabase/client";

const BUCKET = "mentor-media";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h server-side
const CACHE_TTL_MS = 50 * 60 * 1000; // renova antes de expirar

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
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(pathOrUrl, SIGNED_URL_TTL_SECONDS);
    if (error || !data) return null;
    cache.set(pathOrUrl, { url: data.signedUrl, expiresAt: Date.now() + CACHE_TTL_MS });
    return data.signedUrl;
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
