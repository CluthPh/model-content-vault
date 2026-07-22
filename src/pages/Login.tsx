import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { signIn, user, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) nav("/app");
  }, [user, loading, nav]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) toast.error("Não foi possível entrar", { description: "Verifique seu e-mail e senha." });
    else {
      toast.success("Bem-vindo à mentoria");
      nav("/app");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md card-border rounded-2xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl gradient-primary shadow-glow" />
          <h1 className="text-2xl font-bold">
            YAKUZA <span className="text-primary">MENTOR</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Acesso exclusivo para alunos</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full gradient-primary btn-glow" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Entrar
          </Button>
        </form>
        <div className="mt-6 text-center text-sm">
          <Link to="/recuperar-senha" className="text-muted-foreground hover:text-primary">
            Esqueceu sua senha?
          </Link>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-8">
          O cadastro é feito exclusivamente pela administração da mentoria.
        </p>
      </div>
    </div>
  );
}
