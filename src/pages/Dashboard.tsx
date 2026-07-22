import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import { Lock, PlayCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Module = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_published: boolean;
  sort_order: number;
};

export default function Dashboard() {
  const { user, isAdmin, profile } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [accessSet, setAccessSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [{ data: mods }, { data: access }] = await Promise.all([
        supabase.from("modules").select("*").eq("is_published", true).order("sort_order"),
        supabase.from("module_access").select("module_id").eq("user_id", user.id),
      ]);
      setModules(mods ?? []);
      setAccessSet(new Set((access ?? []).map((a) => a.module_id)));
      setLoading(false);
    })();
  }, [user]);

  const hasAccess = (id: string) => isAdmin || accessSet.has(id);

  return (
    <AppLayout>
      <section className="mb-10">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Bem-vindo de volta</p>
        <h1 className="text-4xl md:text-5xl font-bold mt-2">
          {profile?.full_name?.split(" ")[0] ?? "Aluno"}, <span className="text-gradient">continue sua jornada.</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Acesse seus módulos exclusivos. O conhecimento aqui compartilhado é restrito e não deve ser divulgado.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Módulos</h2>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {modules.length} módulos disponíveis
          </span>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-xl" />
            ))}
          </div>
        ) : modules.length === 0 ? (
          <div className="card-border rounded-xl p-10 text-center text-muted-foreground">
            Nenhum módulo publicado ainda.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => {
              const locked = !hasAccess(m.id);
              return (
                <Link
                  key={m.id}
                  to={locked ? "#" : `/app/modulos/${m.id}`}
                  onClick={(e) => locked && e.preventDefault()}
                  className={`card-border rounded-xl overflow-hidden group ${locked ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <div className="aspect-video bg-secondary relative overflow-hidden">
                    {m.cover_url ? (
                      <img src={m.cover_url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full gradient-primary opacity-30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 right-3">
                      {locked ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-black/60 backdrop-blur border border-border">
                          <Lock className="h-3 w-3" /> Bloqueado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full gradient-primary">
                          <PlayCircle className="h-3 w-3" /> Acessar
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-lg">{m.title}</h3>
                    {m.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
