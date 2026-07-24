import {
  clients,
  consumeRateLimit,
  normalizeCode,
  requestIp,
  sha256,
} from "../_shared/security.ts";
import { json, preflight } from "../_shared/http.ts";
import { verifyTurnstile } from "../_shared/turnstile.ts";

type RequestBody = { access_code?: unknown; turnstile_token?: unknown };

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
    const ip = requestIp(req);
    const ipAllowed = await consumeRateLimit(adminClient, "login_ip", ip, 10, 900, 900);
    const codeAllowed = await consumeRateLimit(adminClient, "login_code", code, 20, 900, 900);
    if (!ipAllowed || !codeAllowed) {
      return json(req, { error: "muitas tentativas; aguarde alguns minutos" }, 429);
    }

    const challenge = await verifyTurnstile(
      String(body.turnstile_token ?? ""),
      ip,
      "login",
    );
    if (!challenge.ok) {
      return json(
        req,
        {
          error: challenge.configurationError
            ? "proteção anti-bot não configurada"
            : "verificação anti-bot inválida",
        },
        challenge.configurationError ? 503 : 400,
      );
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
