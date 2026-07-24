import { clients } from "../_shared/security.ts";
import { json, preflight } from "../_shared/http.ts";

type RequestBody = { path?: unknown };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  if (req.method !== "POST") return json(req, { error: "método não permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const { userClient, adminClient } = clients(authHeader);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json(req, { error: "não autenticado" }, 401);

    const body = await req.json() as RequestBody;
    const path = String(body.path ?? "");
    if (!path || path.length > 500 || path.includes("..") || /^https?:\/\//i.test(path)) {
      return json(req, { error: "arquivo inválido" }, 400);
    }

    const [{ data: profile }, { data: roles }] = await Promise.all([
      adminClient.from("profiles").select("blocked").eq("id", user.id).maybeSingle(),
      adminClient.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    if (profile?.blocked) return json(req, { error: "usuário bloqueado" }, 403);

    const isAdmin = roles?.some((row: { role: string }) => row.role === "admin");
    if (!isAdmin) {
      let moduleId: string | null = null;
      let published = true;
      const { data: content } = await adminClient
        .from("module_contents")
        .select("module_id,published")
        .eq("media_url", path)
        .limit(1)
        .maybeSingle();
      if (content) {
        moduleId = content.module_id;
        published = content.published;
      } else {
        const { data: moduleCover } = await adminClient
          .from("modules")
          .select("id")
          .eq("cover_url", path)
          .limit(1)
          .maybeSingle();
        moduleId = moduleCover?.id ?? null;
      }
      if (!moduleId || !published) return json(req, { error: "acesso negado" }, 403);

      const { data: module } = await adminClient
        .from("modules")
        .select("active,locked")
        .eq("id", moduleId)
        .maybeSingle();
      if (!module?.active) return json(req, { error: "acesso negado" }, 403);

      if (module.locked) {
        const { data: access } = await adminClient
          .from("module_access")
          .select("id")
          .eq("module_id", moduleId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!access) return json(req, { error: "acesso negado" }, 403);
      }
    }

    const { data, error } = await adminClient.storage
      .from("mentor-media")
      .createSignedUrl(path, 300);
    if (error || !data) return json(req, { error: "arquivo não encontrado" }, 404);
    return json(req, { url: data.signedUrl });
  } catch {
    return json(req, { error: "não foi possível abrir o arquivo" }, 500);
  }
});
