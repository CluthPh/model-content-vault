import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error("Não foi possível enviar", { description: error.message });
    else setSent(true);
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md card-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground mt-1">Enviaremos um link para redefinir sua senha.</p>
        {sent ? (
          <p className="mt-6 text-sm text-foreground">Se o e-mail estiver cadastrado, você receberá as instruções em instantes.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button className="w-full gradient-primary btn-glow" disabled={loading}>Enviar link</Button>
          </form>
        )}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">Voltar para login</Link>
        </div>
      </div>
    </div>
  );
}
