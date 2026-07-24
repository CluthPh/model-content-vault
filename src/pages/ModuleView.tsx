import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, FileText, Image as ImageIcon, Music, Video } from "lucide-react";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";

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
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      const [{ data: m }, { data: c }] = await Promise.all([
        supabase.from("modules").select("id,title,description").eq("id", id).maybeSingle(),
        supabase.from("module_contents").select("id,title,body,type,media_url,external_url,order_index").eq("module_id", id).order("order_index"),
      ]);
      if (!m) {
        toast.error(isAdmin ? "Módulo não encontrado." : "Você não tem acesso a este módulo.");
        nav("/app");
        return;
      }
      setMod(m as Module);
      const list = (c ?? []) as Content[];
      setContents(list);
      if (list.length) setActive(list[0]);
    })();
  }, [id, user, isAdmin, nav]);

  useEffect(() => {
    let alive = true;
    setActiveMediaUrl(null);
    if (!active?.media_url) return;
    getMediaUrl(active.media_url).then((url) => {
      if (alive) setActiveMediaUrl(url);
    });
    return () => { alive = false; };
  }, [active]);

  return (
    <AppLayout>
      <Link to="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar aos módulos
      </Link>
      {mod && (
        <div className="mt-4 mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">{mod.title}</h1>
          {mod.description && <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-3xl">{mod.description}</p>}
        </div>
      )}

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card-border rounded-xl p-4 md:p-6 min-h-[280px] md:min-h-[400px] order-2 lg:order-1">
          {!active ? (
            <p className="text-muted-foreground">Nenhum conteúdo disponível neste módulo.</p>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest text-primary">{labelOf(active.type)}</p>
              <h2 className="text-xl font-semibold mt-1">{active.title}</h2>
              <div className="mt-5">
                {active.type === "video" && (activeMediaUrl || active.external_url) && (
                  <video src={activeMediaUrl ?? active.external_url!} controls className="w-full rounded-lg bg-background" controlsList="nodownload" />
                )}
                {active.type === "audio" && (activeMediaUrl || active.external_url) && (
                  <audio src={activeMediaUrl ?? active.external_url!} controls className="w-full" controlsList="nodownload" />
                )}
                {active.type === "photo" && (activeMediaUrl || active.external_url) && (
                  <img src={activeMediaUrl ?? active.external_url!} alt={active.title ?? ""} className="w-full rounded-lg" />
                )}
                {active.type === "text" && (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {active.body}
                  </div>
                )}
                {active.type === "file" && (activeMediaUrl || active.external_url) && (
                  <a href={activeMediaUrl ?? active.external_url!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-md gradient-primary btn-glow text-sm">
                    <FileText className="h-4 w-4" /> Abrir arquivo
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="card-border rounded-xl p-3 md:p-4 h-fit order-1 lg:order-2 lg:sticky lg:top-20">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-2">Conteúdos</p>
          <div className="space-y-1 max-h-64 lg:max-h-[calc(100vh-10rem)] overflow-y-auto">
            {contents.map((c) => {
              const Icon = iconOf(c.type);
              const isActive = active?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActive(c)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-md text-sm transition-colors ${
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
