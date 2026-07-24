const trustedOrigins = new Set([
  "https://yakuzamentory.online",
  "https://www.yakuzamentory.online",
  "https://yakuza-mentory.vercel.app",
  "http://localhost:5173",
  "http://localhost:8080",
]);

function allowedOrigin(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  if (trustedOrigins.has(origin) || /^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(origin)) {
    return origin;
  }
  return "https://yakuzamentory.online";
}

export function corsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export function preflight(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
