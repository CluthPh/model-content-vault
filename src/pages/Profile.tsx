import { FormEvent, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setName(profile?.full_name ?? ""); }, [profile]);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado");
    refreshProfile();
  };
  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Senha muito curta");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    setPassword("");
    toast.success("Senha alterada");
  };

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold">Meu perfil</h1>
      <p className="text-muted-foreground mt-1">Gerencie suas informações de acesso.</p>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <form onSubmit={saveName} className="card-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Informações pessoais</h2>
          <div>
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div>
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button className="gradient-primary btn-glow" disabled={saving}>Salvar</Button>
        </form>

        <form onSubmit={savePassword} className="card-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Alterar senha</h2>
          <div>
            <Label htmlFor="np">Nova senha</Label>
            <Input id="np" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="gradient-primary btn-glow">Atualizar senha</Button>
        </form>
      </div>
    </AppLayout>
  );
}
