import { Turnstile } from "@marsidev/react-turnstile";

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

type Props = {
  action: "login" | "request_access";
  resetKey: number;
  onToken: (token: string | null) => void;
};

export default function SecurityChallenge({ action, resetKey, onToken }: Props) {
  if (!siteKey) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
        A proteção anti-bot ainda não foi configurada.
      </p>
    );
  }

  return (
    <div className="flex min-h-[65px] items-center justify-center overflow-hidden">
      <Turnstile
        key={resetKey}
        siteKey={siteKey}
        options={{ action, theme: "auto", size: "flexible" }}
        onSuccess={(token) => onToken(token)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
      />
    </div>
  );
}
