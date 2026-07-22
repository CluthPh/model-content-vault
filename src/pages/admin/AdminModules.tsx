import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Pencil, Plus, Trash2, ListPlus } from "lucide-react";

type Module = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_published: boolean;
  sort_order: number;
};

export default function AdminModules() {
  const [mods, setMods] = useState<Module[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [form, setForm] = useState({ title: "", description: "", cover_url: "", is_published: true });

  const load = async () => {
    const { data } = await supabase.from("modules").select("*").order("sort_order");
    setMods(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", cover_url: "", is_published: true });
    setOpen(true);
  };
  const openEdit = (m: Module) => {
    setEditing(m);
    setForm({ title: m.title, description: m.description ?? "", cover_url: m.cover_url ?? "", is_published: m.is_published });
    setOpen(true);
  };

  const uploadCover = async (file: File) => {
    const path = `covers/${Date.now()}-${file.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
    const { error } = await supabase.storage.from("mentor-media").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("mentor-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    // Use signed URL fallback
    const signed = await supabase.storage.from("mentor-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    setForm((f) => ({ ...f, cover_url: signed.data?.signedUrl ?? "" }));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from("modules").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const sort = (mods[mods.length - 1]?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("modules").insert({ ...form, sort_order: sort });
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir módulo e todos os conteúdos?")) return;
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const move = async (m: Module, dir: -1 | 1) => {
    const idx = mods.findIndex((x) => x.id === m.id);
    const swap = mods[idx + dir];
    if (!swap) return;
    await supabase.from("modules").update({ sort_order: swap.sort_order }).eq("id", m.id);
    await supabase.from("modules").update({ sort_order: m.sort_order }).eq("id", swap.id);
    load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Administração</p>
          <h1 className="text-3xl font-bold mt-2">Módulos</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gradient-primary btn-glow"><Plus className="h-4 w-4 mr-1" /> Novo módulo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar módulo" : "Novo módulo"}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Imagem de capa</Label>
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
                {form.cover_url && <img src={form.cover_url} alt="" className="mt-2 h-24 rounded" />}
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pub">Publicado</Label>
                <Switch id="pub" checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              </div>
              <Button className="w-full gradient-primary btn-glow">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {mods.map((m, i) => (
          <div key={m.id} className="card-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-20 h-14 rounded bg-secondary overflow-hidden flex-shrink-0">
              {m.cover_url && <img src={m.cover_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{m.title}</h3>
                {!m.is_published && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-secondary text-muted-foreground">Rascunho</span>}
              </div>
              <p className="text-sm text-muted-foreground truncate">{m.description}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(m, -1)}><ArrowUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" disabled={i === mods.length - 1} onClick={() => move(m, 1)}><ArrowDown className="h-4 w-4" /></Button>
              <Button asChild size="sm" variant="secondary"><Link to={`/admin/modulos/${m.id}/conteudos`}><ListPlus className="h-4 w-4 mr-1" /> Conteúdos</Link></Button>
              <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-primary" /></Button>
            </div>
          </div>
        ))}
        {mods.length === 0 && <div className="card-border rounded-xl p-10 text-center text-muted-foreground">Nenhum módulo criado.</div>}
      </div>
    </AppLayout>
  );
}
