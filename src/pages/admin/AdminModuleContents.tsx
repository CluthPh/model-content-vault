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

type ContentType = "video" | "audio" | "image" | "text" | "file";
type Content = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  media_url: string | null;
  text_body: string | null;
  sort_order: number;
};

export default function AdminModuleContents() {
  const { id } = useParams();
  const [contents, setContents] = useState<Content[]>([]);
  const [modTitle, setModTitle] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Content | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; content_type: ContentType; media_url: string; text_body: string }>({
    title: "", description: "", content_type: "video", media_url: "", text_body: "",
  });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from("modules").select("title").eq("id", id!).maybeSingle(),
      supabase.from("module_contents").select("*").eq("module_id", id!).order("sort_order"),
    ]);
    setModTitle(m?.title ?? "");
    setContents((c as Content[]) ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", content_type: "video", media_url: "", text_body: "" });
    setOpen(true);
  };
  const openEdit = (c: Content) => {
    setEditing(c);
    setForm({ title: c.title, description: c.description ?? "", content_type: c.content_type, media_url: c.media_url ?? "", text_body: c.text_body ?? "" });
    setOpen(true);
  };

  const upload = async (file: File) => {
    setUploading(true);
    const path = `modules/${id}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
    const { error } = await supabase.storage.from("mentor-media").upload(path, file);
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = await supabase.storage.from("mentor-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    setForm((f) => ({ ...f, media_url: data?.signedUrl ?? "" }));
    setUploading(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...form, module_id: id! };
    if (editing) {
      const { error } = await supabase.from("module_contents").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const sort = (contents[contents.length - 1]?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("module_contents").insert({ ...payload, sort_order: sort });
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
    await supabase.from("module_contents").update({ sort_order: swap.sort_order }).eq("id", c.id);
    await supabase.from("module_contents").update({ sort_order: c.sort_order }).eq("id", swap.id);
    load();
  };

  const acceptOf = (t: ContentType) => t === "video" ? "video/*" : t === "audio" ? "audio/*" : t === "image" ? "image/*" : "*/*";

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
                <Label>Descrição</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.content_type} onValueChange={(v: ContentType) => setForm({ ...form, content_type: v, media_url: "", text_body: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="file">Arquivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.content_type === "text" ? (
                <div>
                  <Label>Conteúdo em texto</Label>
                  <Textarea rows={8} value={form.text_body} onChange={(e) => setForm({ ...form, text_body: e.target.value })} />
                </div>
              ) : (
                <div>
                  <Label>Arquivo</Label>
                  <Input type="file" accept={acceptOf(form.content_type)} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
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
            <span className="text-xs uppercase tracking-widest px-2 py-1 rounded bg-secondary">{c.content_type}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{c.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{c.description}</p>
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
