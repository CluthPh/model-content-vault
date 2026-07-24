export const normalizeAccessCode = (raw: string) =>
  raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export const isValidAccessCode = (raw: string) => {
  const normalized = normalizeAccessCode(raw);
  return normalized.length >= 6 && normalized.length <= 64;
};
