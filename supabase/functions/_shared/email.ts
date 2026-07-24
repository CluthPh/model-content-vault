const blockedDomains = new Set([
  "10minutemail.com",
  "dispostable.com",
  "dropmail.me",
  "emailondeck.com",
  "fakeinbox.com",
  "generator.email",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "inboxkitten.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "pm.me",
  "proton.me",
  "protonmail.ch",
  "protonmail.com",
  "sharklasers.com",
  "temp-mail.org",
  "tempail.com",
  "tempmail.com",
  "tempmailo.com",
  "throwawaymail.com",
  "trashmail.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

function configuredBlockedDomains() {
  return (Deno.env.get("BLOCKED_EMAIL_DOMAINS") ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export function canonicalizeEmail(raw: string) {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at <= 0) return email;
  let local = email.slice(0, at);
  let domain = email.slice(at + 1);

  if (domain === "googlemail.com") domain = "gmail.com";
  local = local.split("+")[0];
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

export function validateRequestEmail(raw: string) {
  const email = canonicalizeEmail(raw);
  if (email.length > 254 || !/^[^\s@]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
    return { ok: false, email, reason: "Informe um e-mail válido." } as const;
  }

  const domain = email.slice(email.lastIndexOf("@") + 1);
  const configured = configuredBlockedDomains();
  const blocked = [...blockedDomains, ...configured].some(
    (item) => domain === item || domain.endsWith(`.${item}`),
  );
  if (blocked) {
    return {
      ok: false,
      email,
      reason: "Esse provedor de e-mail não é aceito. Use um e-mail permanente.",
    } as const;
  }
  return { ok: true, email, domain } as const;
}
