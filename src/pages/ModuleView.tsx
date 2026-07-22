import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, FileText, Image as ImageIcon, Music, Video } from "lucide-react";
import { toast } from "sonner";

type ContentType = "video" | "audio" | "photo" | "text" | "file";
type Content = {
  id: string;
  title: string | null;
  body: string | null;
  type: ContentType;
  media_url: string | null;
  external_url: string | null;
  order_index: number;
};

type Module = { id: string; title: string; description: string | null };

const iconOf = (t: ContentType) =>
  t === "video" ? Video : t === "audio" ? Music : t === "photo" ? ImageIcon : FileText;

const labelOf = (t: ContentType) =>
  ({ video: "Vídeo", audio: "Áudio", photo: "Imagem", text: "Texto", file: "Arquivo" }[t]);

export default function ModuleView() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();
  const [mod, setMod] = useState<Module | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [active, setActive] = useState<Content | null>(null);

  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      if (!isAdmin) {
        const { data: acc } = await supabase.from("module_access").select("module_id").eq("user_id", user.id).eq("module_id", id).maybeSingle();
        if (!acc) {
          toast.error("Você não tem acesso a este módulo.");
          nav("/app");
          return;
        }
      }
      const [{ data: m }, { data: c }] = await Promise.all([
        supabase.from("modules").select("id,title,description").eq("id", id).maybeSingle(),
        supabase.from("module_contents").select("id,title,body,type,media_url,external_url,order_index").eq("module_id", id).order("order_index"),
      ]);
      setMod(m as Module);
      const list = (c ?? []) as Content[];
      setContents(list);
      if (list.length) setActive(list[0]);
    })();
  }, [id, user, isAdmin, nav]);

  return (
    <AppLayout>
      <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar aos módulos
      </Link>
      {mod && (
        <div className="mt-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">{mod.title}</h1>
          {mod.description && <p className="text-muted-foreground mt-2 max-w-3xl">{mod.description}</p>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card-border rounded-xl p-6 min-h-[400px]">
          {!active ? (
            <p className="text-muted-foreground">Nenhum conteúdo disponível neste módulo.</p>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest text-primary">{labelOf(active.type)}</p>
              <h2 className="text-xl font-semibold mt-1">{active.title}</h2>
              <div className="mt-5">
                {active.type === "video" && active.media_url && (
                  <video src={active.media_url} controls className="w-full rounded-lg bg-black" controlsList="nodownload" />
                )}
                {active.type === "audio" && active.media_url && (
                  <audio src={active.media_url} controls className="w-full" controlsList="nodownload" />
                )}
                {active.type === "photo" && active.media_url && (
                  <img src={active.media_url} alt={active.title ?? ""} className="w-full rounded-lg" />
                )}
                {active.type === "text" && (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {active.body}
                  </div>
                )}
                {active.type === "file" && (active.media_url || active.external_url) && (
                  <a href={active.media_url ?? active.external_url!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-md gradient-primary btn-glow text-sm">
                    <FileText className="h-4 w-4" /> Abrir arquivo
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="card-border rounded-xl p-4 h-fit">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-2">Conteúdos</p>
          <div className="space-y-1">
            {contents.map((c) => {
              const Icon = iconOf(c.type);
              const isActive = active?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActive(c)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? "bg-primary/15 text-foreground border border-primary/40" : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{c.title ?? labelOf(c.type)}</span>
                </button>
              );
            })}
            {contents.length === 0 && <p className="text-sm text-muted-foreground px-2">Sem conteúdos ainda.</p>}
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
