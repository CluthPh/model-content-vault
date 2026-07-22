import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Users, LayoutGrid, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminHome() {
  const [stats, setStats] = useState({ users: 0, modules: 0, contents: 0 });
  useEffect(() => {
    (async () => {
      const [u, m, c] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("modules").select("id", { count: "exact", head: true }),
        supabase.from("module_contents").select("id", { count: "exact", head: true }),
      ]);
      setStats({ users: u.count ?? 0, modules: m.count ?? 0, contents: c.count ?? 0 });
    })();
  }, []);

  const cards = [
    { to: "/admin/modulos", label: "Módulos", icon: LayoutGrid, count: stats.modules, desc: "Criar e organizar módulos" },
    { to: "/admin/usuarios", label: "Usuários", icon: Users, count: stats.users, desc: "Cadastrar alunos e liberar acesso" },
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

      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        <StatCard label="Alunos" value={stats.users} />
        <StatCard label="Módulos" value={stats.modules} />
        <StatCard label="Conteúdos" value={stats.contents} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to} className="card-border rounded-xl p-6 block">
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{c.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
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
