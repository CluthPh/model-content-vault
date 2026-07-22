import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Loader2, KeyRound } from "lucide-react";

const CODE_DOMAIN = "yakuza.local";
const normalize = (raw: string) => raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export default function Login() {
  const { signIn, user, loading } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) nav("/app");
  }, [user, loading, nav]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const raw = code.trim();
    // Backdoor for admin email/senha via prefixo "adm:email|senha"
    let email: string;
    let password: string;
    if (raw.toLowerCase().startsWith("adm:") && raw.includes("|")) {
      const rest = raw.slice(4);
      const idx = rest.indexOf("|");
      email = rest.slice(0, idx).trim();
      password = rest.slice(idx + 1);
    } else {
      const normalized = normalize(raw);
      if (normalized.length < 4) {
        toast.error("Código inválido", { description: "Verifique o código enviado pelo administrador." });
        return;
      }
      email = `${normalized}@${CODE_DOMAIN}`;
      password = normalized;
    }
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: "Código de acesso inválido." });
    } else {
      toast.success("Bem-vindo à mentoria");
      nav("/app");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md card-border rounded-2xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl gradient-primary shadow-glow flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">
            YAKUZA <span className="text-primary">MENTORY</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Insira o código de acesso enviado pelo seu mentor
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="code">Código de acesso</Label>
            <Input
              id="code"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex.: YAKUZA2026"
              className="tracking-widest text-center text-lg uppercase"
              required
            />
          </div>
          <Button type="submit" className="w-full gradient-primary btn-glow" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Entrar
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-8">
          O acesso é exclusivo. Cada aluno recebe um código único da administração.
        </p>
      </div>
    </div>
  );
}
