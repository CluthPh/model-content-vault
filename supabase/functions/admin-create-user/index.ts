import { json, preflight } from "../_shared/http.ts";
import {
  randomCode,
  randomPassword,
  requireAdmin,
  sha256,
} from "../_shared/security.ts";

type RequestBody = {
  full_name?: unknown;
  is_admin?: unknown;
  request_id?: unknown;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, { error: "método não permitido" }, 405);

  try {
    const authorization = await requireAdmin(req);
    if ("error" in authorization) return json(req, { error: authorization.error }, authorization.status);
    const { adminClient } = authorization;

    let body: RequestBody;
    try {
      body = await req.json() as RequestBody;
    } catch {
      return json(req, { error: "corpo da requisição inválido" }, 400);
    }

    const requestId = String(body.request_id ?? "");
    let requestClaimed = false;
    let fullName = String(body.full_name ?? "").trim();
    let grantAdmin = body.is_admin === true;
    let contactEmail: string | null = null;

    if (requestId) {
      if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
        return json(req, { error: "solicitação inválida" }, 400);
      }
      const { data: requestRow, error: requestError } = await adminClient
        .from("account_requests")
        .update({
          status: "processing",
          reviewed_by: authorization.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("status", "pending")
        .select("full_name,email")
        .maybeSingle();
      if (requestError || !requestRow) {
        return json(req, { error: "solicitação já processada ou inexistente" }, 400);
      }
      requestClaimed = true;
      fullName = requestRow.full_name;
      contactEmail = requestRow.email;
      const allowlist = (Deno.env.get("ADMIN_EMAIL_ALLOWLIST") ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      grantAdmin = allowlist.includes(contactEmail.toLowerCase());
    }

    const releaseRequest = async () => {
      if (!requestClaimed) return;
      await adminClient.from("account_requests").update({
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
      }).eq("id", requestId).eq("status", "processing");
    };

    if (!fullName || fullName.length > 120) {
      await releaseRequest();
      return json(req, { error: "informe um nome válido" }, 400);
    }

    let accessCode = "";
    let accessCodeHash = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      accessCode = randomCode();
      accessCodeHash = await sha256(accessCode.toLowerCase());
      const { data: existing } = await adminClient
        .from("profiles")
        .select("id")
        .eq("access_code_hash", accessCodeHash)
        .maybeSingle();
      if (!existing) break;
    }
    if (!accessCodeHash) return json(req, { error: "não foi possível gerar o código" }, 500);

    const syntheticEmail = `${crypto.randomUUID()}@users.yakuzamentory.online`;
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: syntheticEmail,
      password: randomPassword(),
      email_confirm: true,
      user_metadata: { full_name: fullName, contact_email: contactEmail },
    });
    if (createError || !created.user) {
      await releaseRequest();
      return json(req, { error: createError?.message ?? "erro ao criar usuário" }, 400);
    }

    const newId = created.user.id;
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: newId,
      email: syntheticEmail,
      contact_email: contactEmail,
      full_name: fullName,
      access_code: null,
      access_code_hash: accessCodeHash,
      access_code_last4: accessCode.slice(-4),
      access_code_updated_at: new Date().toISOString(),
      blocked: false,
    }, { onConflict: "id" });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(newId);
      await releaseRequest();
      return json(req, { error: profileError.message }, 400);
    }

    if (grantAdmin) {
      const { error: roleError } = await adminClient.from("user_roles").upsert(
        { user_id: newId, role: "admin" },
        { onConflict: "user_id,role" },
      );
      if (roleError) {
        await adminClient.auth.admin.deleteUser(newId);
        await releaseRequest();
        return json(req, { error: roleError.message }, 400);
      }
    }

    if (requestClaimed) {
      const { error: requestUpdateError } = await adminClient
        .from("account_requests")
        .update({
          status: "approved",
          created_user_id: newId,
          reviewed_by: authorization.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("status", "processing");
      if (requestUpdateError) {
        await adminClient.auth.admin.deleteUser(newId);
        await releaseRequest();
        return json(req, { error: "não foi possível concluir a aprovação" }, 400);
      }
    }

    return json(req, { ok: true, id: newId, access_code: accessCode });
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : "erro interno" }, 500);
  }
});
