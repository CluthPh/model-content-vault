import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, ArrowDown, Pencil, Plus, Trash2 } from "lucide-react";

type ContentType = "video" | "audio" | "photo" | "text" | "file";
type Content = {
  id: string;
  module_id: string;
  title: string | null;
  body: string | null;
  type: ContentType;
  media_url: string | null;
  external_url: string | null;
  order_index: number;
};

const labelOf = (t: ContentType) =>
  ({ video: "Vídeo", audio: "Áudio", photo: "Imagem", text: "Texto", file: "Arquivo" }[t]);

export default function AdminModuleContents() {
  const { id } = useParams();
  const [contents, setContents] = useState<Content[]>([]);
  const [modTitle, setModTitle] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Content | null>(null);
  const [form, setForm] = useState<{ title: string; body: string; type: ContentType; media_url: string; external_url: string }>({
    title: "", body: "", type: "video", media_url: "", external_url: "",
  });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from("modules").select("title").eq("id", id!).maybeSingle(),
      supabase.from("module_contents").select("*").eq("module_id", id!).order("order_index"),
    ]);
    setModTitle(m?.title ?? "");
    setContents((c as Content[]) ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", body: "", type: "video", media_url: "", external_url: "" });
    setOpen(true);
  };
  const openEdit = (c: Content) => {
    setEditing(c);
    setForm({ title: c.title ?? "", body: c.body ?? "", type: c.type, media_url: c.media_url ?? "", external_url: c.external_url ?? "" });
    setOpen(true);
  };

  const upload = async (file: File) => {
    setUploading(true);
    const path = `modules/${id}/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, "_")}`;
    const { error } = await supabase.storage.from("mentor-media").upload(path, file);
    if (error) { setUploading(false); return toast.error(error.message); }
    setForm((f) => ({ ...f, media_url: path }));
    setUploading(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { module_id: id!, title: form.title, body: form.body || null, type: form.type, media_url: form.media_url || null, external_url: form.external_url || null };
    if (editing) {
      const { error } = await supabase.from("module_contents").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const order_index = (contents[contents.length - 1]?.order_index ?? 0) + 1;
      const { error } = await supabase.from("module_contents").insert({ ...payload, order_index });
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpen(false);
    load();
  };

  const remove = async (cid: string) => {
    if (!confirm("Excluir conteúdo?")) return;
    await supabase.from("module_contents").delete().eq("id", cid);
    load();
  };
  const move = async (c: Content, dir: -1 | 1) => {
    const idx = contents.findIndex((x) => x.id === c.id);
    const swap = contents[idx + dir];
    if (!swap) return;
    await supabase.from("module_contents").update({ order_index: swap.order_index }).eq("id", c.id);
    await supabase.from("module_contents").update({ order_index: c.order_index }).eq("id", swap.id);
    load();
  };

  const acceptOf = (t: ContentType) => t === "video" ? "video/*" : t === "audio" ? "audio/*" : t === "photo" ? "image/*" : "*/*";

  return (
    <AppLayout>
      <Link to="/admin/modulos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex items-center justify-between mt-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Conteúdos do módulo</p>
          <h1 className="text-3xl font-bold mt-2">{modTitle}</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gradient-primary btn-glow"><Plus className="h-4 w-4 mr-1" /> Novo conteúdo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar conteúdo" : "Novo conteúdo"}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v: ContentType) => setForm({ ...form, type: v, media_url: "", body: "", external_url: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                    <SelectItem value="photo">Imagem</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="file">Arquivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type === "text" ? (
                <div>
                  <Label>Conteúdo em texto</Label>
                  <Textarea rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                </div>
              ) : (
                <div>
                  <Label>Arquivo ({labelOf(form.type)})</Label>
                  <Input type="file" accept={acceptOf(form.type)} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                  {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
                  {form.media_url && <p className="text-xs text-muted-foreground mt-1 truncate">Arquivo carregado</p>}
                </div>
              )}
              <Button className="w-full gradient-primary btn-glow" disabled={uploading}>Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {contents.map((c, i) => (
          <div key={c.id} className="card-border rounded-xl p-4 flex items-center gap-4">
            <span className="text-xs uppercase tracking-widest px-2 py-1 rounded bg-secondary">{labelOf(c.type)}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{c.title}</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(c, -1)}><ArrowUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" disabled={i === contents.length - 1} onClick={() => move(c, 1)}><ArrowDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-primary" /></Button>
            </div>
          </div>
        ))}
        {contents.length === 0 && <div className="card-border rounded-xl p-10 text-center text-muted-foreground">Nenhum conteúdo neste módulo.</div>}
      </div>
    </AppLayout>
  );
}
