import { canonicalizeEmail, validateRequestEmail } from "../_shared/email.ts";
import { json, preflight } from "../_shared/http.ts";
import {
  clients,
  consumeRateLimit,
  requestIp,
  sha256,
} from "../_shared/security.ts";
import { verifyTurnstile } from "../_shared/turnstile.ts";

type RequestBody = {
  full_name?: unknown;
  email?: unknown;
  turnstile_token?: unknown;
  website?: unknown;
};

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

    // Honeypot: bots costumam preencher campos invisíveis.
    if (String(body.website ?? "").trim()) return json(req, { ok: true });

    const fullName = String(body.full_name ?? "").trim().replace(/\s+/g, " ");
    if (fullName.length < 3 || fullName.length > 120) {
      return json(req, { error: "Informe seu nome completo." }, 400);
    }

    const emailResult = validateRequestEmail(String(body.email ?? ""));
    if (!emailResult.ok) return json(req, { error: emailResult.reason }, 400);
    const email = canonicalizeEmail(emailResult.email);

    const { adminClient } = clients();
    const ip = requestIp(req);
    const ipAllowed = await consumeRateLimit(adminClient, "request_access_ip", ip, 5, 3600, 3600);
    const emailAllowed = await consumeRateLimit(adminClient, "request_access_email", email, 2, 86400, 86400);
    if (!ipAllowed || !emailAllowed) {
      return json(req, { error: "Muitas solicitações. Tente novamente mais tarde." }, 429);
    }

    const challenge = await verifyTurnstile(
      String(body.turnstile_token ?? ""),
      ip,
      "request_access",
    );
    if (!challenge.ok) {
      return json(
        req,
        {
          error: challenge.configurationError
            ? "Proteção anti-bot ainda não configurada."
            : "Não foi possível confirmar que você é uma pessoa.",
        },
        challenge.configurationError ? 503 : 400,
      );
    }

    const { data: existing } = await adminClient
      .from("account_requests")
      .select("id,status")
      .eq("email", email)
      .maybeSingle();

    // A resposta é propositalmente igual para não revelar quem já está cadastrado.
    if (existing) return json(req, { ok: true });

    const { count } = await adminClient
      .from("account_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if ((count ?? 0) >= 500) {
      return json(req, { error: "As solicitações estão temporariamente pausadas." }, 503);
    }

    const { error } = await adminClient.from("account_requests").insert({
      full_name: fullName,
      email,
      email_domain: emailResult.domain,
      request_ip_hash: await sha256(ip),
      status: "pending",
    });
    if (error && error.code !== "23505") {
      return json(req, { error: "Não foi possível enviar a solicitação." }, 400);
    }
    return json(req, { ok: true });
  } catch {
    return json(req, { error: "Não foi possível enviar a solicitação." }, 500);
  }
});
