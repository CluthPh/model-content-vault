import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { FileStack, LayoutGrid, Settings, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminHome() {
  const [stats, setStats] = useState({ users: 0, blocked: 0, modules: 0, contents: 0, requests: 0 });
  useEffect(() => {
    (async () => {
      const [users, blocked, modules, contents, requests] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("blocked", true),
        supabase.from("modules").select("id", { count: "exact", head: true }),
        supabase.from("module_contents").select("id", { count: "exact", head: true }),
        supabase.from("account_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setStats({
        users: users.count ?? 0,
        blocked: blocked.count ?? 0,
        modules: modules.count ?? 0,
        contents: contents.count ?? 0,
        requests: requests.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { to: "/admin/usuarios", label: "Pedidos de acesso", icon: UserPlus, count: stats.requests, desc: "Aprovar ou rejeitar novos cadastros" },
    { to: "/admin/modulos", label: "Entregáveis", icon: FileStack, count: stats.contents, desc: "Organizar módulos, vídeos, textos e arquivos" },
    { to: "/admin/usuarios", label: "Usuários", icon: Users, count: stats.users, desc: "Bloquear, excluir e liberar módulos" },
    { to: "/admin/modulos", label: "Módulos", icon: LayoutGrid, count: stats.modules, desc: "Criar e organizar módulos" },
    { to: "/admin/configuracoes", label: "Configurações", icon: Settings, count: null, desc: "Ajustes gerais da plataforma" },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Painel administrativo</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">Comando da mentoria</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-10">
        <StatCard label="Alunos" value={stats.users} />
        <StatCard label="Bloqueados" value={stats.blocked} />
        <StatCard label="Pedidos pendentes" value={stats.requests} />
        <StatCard label="Módulos" value={stats.modules} />
        <StatCard label="Conteúdos" value={stats.contents} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to} className="card-border rounded-xl p-6 block">
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{c.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
              {c.count !== null && (
                <p className="mt-4 text-2xl font-bold text-primary">{c.count}</p>
              )}
            </Link>
          );
        })}
      </div>
    </AppLayout>
  );
}
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-border rounded-xl p-6">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
}
