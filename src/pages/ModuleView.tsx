import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, FileText, Image as ImageIcon, Music, Video } from "lucide-react";
import { toast } from "sonner";

type Content = {
  id: string;
  title: string;
  description: string | null;
  content_type: "video" | "audio" | "image" | "text" | "file";
  media_url: string | null;
  text_body: string | null;
  sort_order: number;
};

type Module = { id: string; title: string; description: string | null };

const iconOf = (t: Content["content_type"]) =>
  t === "video" ? Video : t === "audio" ? Music : t === "image" ? ImageIcon : FileText;

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
        supabase.from("module_contents").select("*").eq("module_id", id).order("sort_order"),
      ]);
      setMod(m as Module);
      setContents((c as Content[]) ?? []);
      if (c && c.length) setActive(c[0] as Content);
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
              <h2 className="text-xl font-semibold">{active.title}</h2>
              {active.description && <p className="text-sm text-muted-foreground mt-1">{active.description}</p>}
              <div className="mt-5">
                {active.content_type === "video" && active.media_url && (
                  <video src={active.media_url} controls className="w-full rounded-lg bg-black" controlsList="nodownload" />
                )}
                {active.content_type === "audio" && active.media_url && (
                  <audio src={active.media_url} controls className="w-full" controlsList="nodownload" />
                )}
                {active.content_type === "image" && active.media_url && (
                  <img src={active.media_url} alt={active.title} className="w-full rounded-lg" />
                )}
                {active.content_type === "text" && (
                  <div className="prose prose-invert whitespace-pre-wrap text-sm leading-relaxed">
                    {active.text_body}
                  </div>
                )}
                {active.content_type === "file" && active.media_url && (
                  <a href={active.media_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-md gradient-primary btn-glow text-sm">
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
              const Icon = iconOf(c.content_type);
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
                  <span className="truncate">{c.title}</span>
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
