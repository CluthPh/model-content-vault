import { FormEvent, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminSettings() {
  const [platformName, setName] = useState("Yakuza Mentor");
  const [tagline, setTagline] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("platform_settings").select("key,value").in("key", ["platform_name", "tagline"]);
      data?.forEach((row: any) => {
        if (row.key === "platform_name") setName(typeof row.value === "string" ? row.value : String(row.value ?? ""));
        if (row.key === "tagline") setTagline(typeof row.value === "string" ? row.value : String(row.value ?? ""));
      });
    })();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("platform_settings").upsert([
      { key: "platform_name", value: platformName as any },
      { key: "tagline", value: tagline as any },
    ], { onConflict: "key" });
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
          <Input value={platformName} onChange={(e) => setName(e.target.value)} />
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
