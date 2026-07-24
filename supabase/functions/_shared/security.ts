import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.91.1";

export const normalizeCode = (raw: string) =>
  raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomCode(length = 16) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `${btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "")}aA1!`;
}

export function clients(authHeader = "") {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return {
    userClient: createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    }),
    adminClient: createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}

export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const { userClient, adminClient } = clients(authHeader);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return { error: "não autenticado", status: 401 } as const;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("blocked")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.blocked) return { error: "usuário bloqueado", status: 403 } as const;

  const { data: roles } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (!roles?.some((row: { role: string }) => row.role === "admin")) {
    return { error: "acesso negado", status: 403 } as const;
  }

  return { user, adminClient: adminClient as SupabaseClient } as const;
}
