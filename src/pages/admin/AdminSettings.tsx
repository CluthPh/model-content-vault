import { FormEvent, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminSettings() {
  const [platform_name, setName] = useState("Yakuza Mentor");
  const [tagline, setTagline] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle();
      if (data) {
        setName(data.platform_name ?? "Yakuza Mentor");
        setTagline(data.tagline ?? "");
      }
    })();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("platform_settings").upsert({ id: 1, platform_name, tagline });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
  };

  return (
    <AppLayout>
      <p className="text-xs uppercase tracking-widest text-primary">Administração</p>
      <h1 className="text-3xl font-bold mt-2 mb-8">Configurações</h1>
      <form onSubmit={save} className="card-border rounded-xl p-6 space-y-4 max-w-xl">
        <div>
          <Label>Nome da plataforma</Label>
          <Input value={platform_name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Tagline</Label>
          <Textarea rows={2} value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
        <Button className="gradient-primary btn-glow" disabled={saving}>Salvar</Button>
      </form>
    </AppLayout>
  );
}
