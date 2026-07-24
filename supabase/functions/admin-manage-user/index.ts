import { json, preflight } from "../_shared/http.ts";
import {
  randomCode,
  randomPassword,
  requireAdmin,
  sha256,
} from "../_shared/security.ts";

type RequestBody = {
  action?: "rotate_code" | "set_blocked" | "delete_user";
  user_id?: unknown;
  blocked?: unknown;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, { error: "método não permitido" }, 405);

  try {
    const authorization = await requireAdmin(req);
    if ("error" in authorization) return json(req, { error: authorization.error }, authorization.status);
    const { user, adminClient } = authorization;

    const body = await req.json() as RequestBody;
    const targetId = String(body.user_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(targetId)) return json(req, { error: "usuário inválido" }, 400);

    if (body.action === "rotate_code") {
      const code = randomCode();
      const hash = await sha256(code.toLowerCase());
      // Troca a senha interna primeiro. Se a atualização do perfil falhar, o
      // código anterior continua válido e a conta não fica inacessível.
      const { error: authError } = await adminClient.auth.admin.updateUserById(targetId, {
        password: randomPassword(),
      });
      if (authError) return json(req, { error: authError.message }, 400);

      const { error: profileError } = await adminClient.from("profiles").update({
        access_code: null,
        access_code_hash: hash,
        access_code_last4: code.slice(-4),
        access_code_updated_at: new Date().toISOString(),
      }).eq("id", targetId);
      if (profileError) return json(req, { error: profileError.message }, 400);
      return json(req, { ok: true, access_code: code });
    }

    if (body.action === "set_blocked") {
      if (targetId === user.id && body.blocked === true) {
        return json(req, { error: "você não pode bloquear a própria conta" }, 400);
      }
      const blocked = body.blocked === true;
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ blocked })
        .eq("id", targetId);
      if (profileError) return json(req, { error: profileError.message }, 400);

      const { error: authError } = await adminClient.auth.admin.updateUserById(targetId, {
        ban_duration: blocked ? "876000h" : "none",
      });
      if (authError) return json(req, { error: authError.message }, 400);
      return json(req, { ok: true });
    }

    if (body.action === "delete_user") {
      if (targetId === user.id) {
        return json(req, { error: "você não pode excluir a própria conta" }, 400);
      }
      const { error } = await adminClient.auth.admin.deleteUser(targetId);
      if (error) return json(req, { error: error.message }, 400);
      return json(req, { ok: true });
    }

    return json(req, { error: "ação inválida" }, 400);
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : "erro interno" }, 500);
  }
});
