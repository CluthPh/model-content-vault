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
import { getMediaUrl, getMediaUrls, invalidateMediaCache } from "@/lib/media";

type Module = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  active: boolean;
  locked: boolean;
  order_index: number;
};

export default function AdminModules() {
  const [mods, setMods] = useState<Module[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [form, setForm] = useState({ title: "", description: "", cover_url: "", active: true, locked: false });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrls, setCoverUrls] = useState<Map<string, string | null>>(new Map());
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("modules").select("*").order("order_index");
    const modules = (data as Module[]) ?? [];
    setMods(modules);
    setCoverUrls(await getMediaUrls(modules, (module) => module.cover_url));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", cover_url: "", active: true, locked: false });
    setCoverPreview(null);
    setOpen(true);
  };
  const openEdit = async (m: Module) => {
    setEditing(m);
    setForm({ title: m.title, description: m.description ?? "", cover_url: m.cover_url ?? "", active: m.active, locked: m.locked });
    setCoverPreview(await getMediaUrl(m.cover_url));
    setOpen(true);
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    const path = `covers/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, "_")}`;
    const { error } = await supabase.storage.from("mentor-media").upload(path, file);
    if (error) { setUploading(false); return toast.error(error.message); }
    invalidateMediaCache(path);
    setForm((f) => ({ ...f, cover_url: path }));
    setCoverPreview(await getMediaUrl(path));
    setUploading(false);
  };

  const removeCover = () => {
    setForm((f) => ({ ...f, cover_url: "" }));
    setCoverPreview(null);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from("modules").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const order_index = (mods[mods.length - 1]?.order_index ?? 0) + 1;
      const { error } = await supabase.from("modules").insert({ ...form, order_index });
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
    await supabase.from("modules").update({ order_index: swap.order_index }).eq("id", m.id);
    await supabase.from("modules").update({ order_index: m.order_index }).eq("id", swap.id);
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
                {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
                {form.cover_url && <p className="text-xs text-muted-foreground mt-1 truncate">Imagem carregada</p>}
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pub">Publicado</Label>
                <Switch id="pub" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
              <Button className="w-full gradient-primary btn-glow" disabled={uploading}>Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {mods.map((m, i) => (
          <div key={m.id} className="card-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-20 h-14 rounded bg-secondary overflow-hidden flex-shrink-0">
              {coverUrls.get(m.id) && <img src={coverUrls.get(m.id) ?? ""} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{m.title}</h3>
                {!m.active && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-secondary text-muted-foreground">Rascunho</span>}
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
