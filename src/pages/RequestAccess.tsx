import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import MoneyBackground from "@/components/MoneyBackground";
import SecurityChallenge from "@/components/SecurityChallenge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type RequestResponse = { ok?: boolean; error?: string };

export default function RequestAccess() {
  const [form, setForm] = useState({ full_name: "", email: "", website: "" });
  const [token, setToken] = useState<string | null>(null);
  const [challengeKey, setChallengeKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return toast.error("Conclua a verificação de segurança.");
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("request-access", {
      body: { ...form, turnstile_token: token },
    });
    setSubmitting(false);
    const response = data as RequestResponse | null;
    if (error || response?.error) {
      setToken(null);
      setChallengeKey((value) => value + 1);
      return toast.error("Não foi possível enviar", {
        description: response?.error ?? error?.message,
      });
    }
    setSent(true);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-6">
      <MoneyBackground />
      <div className="w-full max-w-md card-border rounded-2xl p-6 md:p-8 animate-fade-in backdrop-blur-sm bg-card/80">
        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-2xl font-bold">Solicitação recebida</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A administração analisará seu pedido. Se for aprovado, você receberá um código de acesso.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/login">Voltar para o login</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 h-12 w-12 rounded-xl gradient-primary shadow-glow flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Solicitar acesso</h1>
              <p className="text-sm text-muted-foreground mt-1">
                O cadastro depende de aprovação da administração.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="request-name">Nome completo</Label>
                <Input
                  id="request-name"
                  required
                  minLength={3}
                  maxLength={120}
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="request-email">E-mail permanente</Label>
                <Input
                  id="request-email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  E-mails temporários e provedores de privacidade bloqueados não são aceitos.
                </p>
              </div>
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <Label htmlFor="request-website">Website</Label>
                <Input
                  id="request-website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => setForm({ ...form, website: event.target.value })}
                />
              </div>
              <SecurityChallenge
                action="request_access"
                resetKey={challengeKey}
                onToken={setToken}
              />
              <Button
                type="submit"
                className="w-full h-12 gradient-primary btn-glow"
                disabled={submitting || !token}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enviar solicitação
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já possui um código?{" "}
              <Link to="/login" className="text-primary hover:underline">Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
