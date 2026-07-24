type TurnstileResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstile(
  token: string,
  remoteIp: string,
  expectedAction: string,
) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    return { ok: false, configurationError: true } as const;
  }
  if (!token || token.length > 4096) return { ok: false } as const;

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);
  body.set("idempotency_key", crypto.randomUUID());

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    if (!response.ok) return { ok: false } as const;
    const result = await response.json() as TurnstileResponse;
    const actionMatches = !result.action || result.action === expectedAction;
    return { ok: result.success === true && actionMatches } as const;
  } catch {
    return { ok: false } as const;
  }
}
