import { clients, normalizeCode, sha256 } from "../_shared/security.ts";
import { json, preflight } from "../_shared/http.ts";

type RequestBody = { access_code?: unknown };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, { error: "método não permitido" }, 405);

  try {
    let body: RequestBody;
    try {
      body = await req.json() as RequestBody;
    } catch {
      return json(req, { error: "requisição inválida" }, 400);
    }

    const code = normalizeCode(String(body.access_code ?? ""));
    if (code.length < 6 || code.length > 64) {
      return json(req, { error: "código inválido" }, 400);
    }

    const { adminClient } = clients();
    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const connectingIp = req.headers.get("cf-connecting-ip") ?? forwardedFor ?? "unknown";
    const rateLimitKey = await sha256(`${connectingIp}:${req.headers.get("user-agent") ?? ""}`);
    const { data: allowed, error: rateLimitError } = await adminClient
      .rpc("consume_access_login_attempt", { p_key_hash: rateLimitKey });
    if (rateLimitError || !allowed) {
      return json(req, { error: "muitas tentativas; aguarde alguns minutos" }, 429);
    }

    const hash = await sha256(code);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id,email,blocked")
      .eq("access_code_hash", hash)
      .maybeSingle();
    if (!profile?.email || profile.blocked) {
      return json(req, { error: "código inválido" }, 401);
    }

    const { data: link, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
    });
    if (linkError || !link?.properties?.hashed_token) {
      return json(req, { error: "não foi possível iniciar a sessão" }, 500);
    }

    return json(req, {
      token_hash: link.properties.hashed_token,
      type: "magiclink",
    });
  } catch {
    return json(req, { error: "não foi possível entrar" }, 500);
  }
});
