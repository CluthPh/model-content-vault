import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha precisa ter pelo menos 6 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error("Não foi possível atualizar", { description: error.message });
    else {
      toast.success("Senha atualizada");
      nav("/app");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md card-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold">Nova senha</h1>
        <p className="text-sm text-muted-foreground mt-1">Defina uma nova senha para sua conta.</p>
        <form onSubmit={submit} className="space-y-4 mt-6">
          <div>
            <Label htmlFor="password">Nova senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button className="w-full gradient-primary btn-glow" disabled={loading}>Salvar senha</Button>
        </form>
      </div>
    </div>
  );
}
