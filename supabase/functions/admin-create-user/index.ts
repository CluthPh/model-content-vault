import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CODE_DOMAIN = "yakuza.local";

function normalizeCode(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "não autenticado" }, 401);

    const admin = createClient(url, service);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) return json({ error: "acesso negado" }, 403);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return json({ error: "corpo da requisição inválido" }, 400);
    }

    const full_name = String(body?.full_name ?? "").trim();
    const access_code = normalizeCode(String(body?.access_code ?? ""));
    const grantAdmin = !!body?.is_admin;

    if (!full_name) return json({ error: "informe o nome do aluno" }, 400);
    if (access_code.length < 4) {
      return json({ error: "o código deve ter ao menos 4 caracteres alfanuméricos" }, 400);
    }

    const { data: exists } = await admin
      .from("profiles")
      .select("id")
      .eq("access_code", access_code)
      .maybeSingle();
    if (exists) return json({ error: "este código já está em uso" }, 400);

    const syntheticEmail = `${access_code}@${CODE_DOMAIN}`;
    const password = access_code;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name, access_code },
    });
    if (createErr || !created?.user) {
      return json({ error: createErr?.message ?? "erro ao criar usuário" }, 400);
    }

    const newId = created.user.id;
    const { error: profileErr } = await admin.from("profiles").upsert(
      { id: newId, email: syntheticEmail, full_name, access_code },
      { onConflict: "id" },
    );
    if (profileErr) return json({ error: profileErr.message }, 400);

    if (grantAdmin) {
      await admin.from("user_roles").upsert(
        { user_id: newId, role: "admin" },
        { onConflict: "user_id,role" },
      );
    }
    return json({ ok: true, id: newId, access_code });
  } catch (e) {
    return json({ error: (e as Error).message ?? "erro interno" }, 500);
  }
});
