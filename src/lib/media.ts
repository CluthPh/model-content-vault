import { supabase } from "@/integrations/supabase/client";

const BUCKET = "mentor-media";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getMediaUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(pathOrUrl, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}

export async function getMediaUrls<T extends { id: string }>(items: T[], pickPath: (item: T) => string | null) {
  const pairs = await Promise.all(
    items.map(async (item) => [item.id, await getMediaUrl(pickPath(item))] as const),
  );

  return new Map(pairs);
}