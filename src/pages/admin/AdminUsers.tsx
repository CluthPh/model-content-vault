import { FormEvent, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, ShieldCheck, User as UserIcon, Copy, RefreshCw } from "lucide-react";

type ProfileRow = { id: string; access_code: string | null; full_name: string | null };
type ModuleRow = { id: string; title: string };

const normalize = (raw: string) => raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [accessMap, setAccessMap] = useState<Record<string, Set<string>>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ access_code: genCode(), full_name: "", is_admin: false });
  const [saving, setSaving] = useState(false);
  const [manageUser, setManageUser] = useState<ProfileRow | null>(null);

  const load = async () => {
    const [{ data: p }, { data: m }, { data: r }, { data: a }] = await Promise.all([
      (supabase.from("profiles") as any).select("id,access_code,full_name").order("created_at", { ascending: false }),
      supabase.from("modules").select("id,title").order("order_index"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("module_access").select("user_id,module_id"),
    ]);
    setUsers((p as ProfileRow[]) ?? []);
    setModules((m as ModuleRow[]) ?? []);
    setAdmins(new Set((r ?? []).filter((x: any) => x.role === "admin").map((x: any) => x.user_id)));
    const map: Record<string, Set<string>> = {};
    (a ?? []).forEach((row: any) => {
      map[row.user_id] = map[row.user_id] ?? new Set();
      map[row.user_id].add(row.module_id);
    });
    setAccessMap(map);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ access_code: genCode(), full_name: "", is_admin: false });
    setOpen(true);
  };

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    const code = normalize(form.access_code);
    if (code.length < 4) {
      toast.error("Código deve ter ao menos 4 caracteres alfanuméricos");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { full_name: form.full_name, access_code: code, is_admin: form.is_admin },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast.error("Erro ao criar", { description: error?.message ?? (data as any)?.error });
      return;
    }
    toast.success("Aluno cadastrado", { description: `Código: ${code.toUpperCase()}` });
    setOpen(false);
    load();
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code.toUpperCase());
      toast.success("Código copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const toggleAccess = async (userId: string, moduleId: string, has: boolean) => {
    if (has) {
      await supabase.from("module_access").delete().eq("user_id", userId).eq("module_id", moduleId);
    } else {
      await supabase.from("module_access").insert({ user_id: userId, module_id: moduleId });
    }
    load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Administração</p>
          <h1 className="text-3xl font-bold mt-2">Alunos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada aluno recebe um código único de acesso. Basta compartilhar o código com ele.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gradient-primary btn-glow"><Plus className="h-4 w-4 mr-1" /> Novo aluno</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Cadastrar aluno</DialogTitle></DialogHeader>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <Label>Nome completo</Label>
                <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label>Código de acesso</Label>
                <div className="flex gap-2">
                  <Input
                    required
                    minLength={4}
                    value={form.access_code}
                    onChange={(e) => setForm({ ...form, access_code: e.target.value })}
                    className="uppercase tracking-widest"
                  />
                  <Button type="button" variant="secondary" onClick={() => setForm({ ...form, access_code: genCode() })}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas letras e números. Este código será a senha do aluno.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_admin} onCheckedChange={(v) => setForm({ ...form, is_admin: !!v })} />
                Conceder acesso administrativo
              </label>
              <Button className="w-full gradient-primary btn-glow" disabled={saving}>Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {users.map((u) => {
          const isAdm = admins.has(u.id);
          const code = (u.access_code ?? "").toUpperCase();
          return (
            <div key={u.id} className="card-border rounded-xl p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                {isAdm ? <ShieldCheck className="h-5 w-5 text-primary" /> : <UserIcon className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{u.full_name ?? "Sem nome"}</h3>
                  {isAdm && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded gradient-primary">Admin</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm font-mono tracking-widest text-primary">{code || "—"}</code>
                  {code && (
                    <button
                      type="button"
                      onClick={() => copyCode(code)}
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Copiar código"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setManageUser(u)}>Gerenciar acessos</Button>
            </div>
          );
        })}
        {users.length === 0 && <div className="card-border rounded-xl p-10 text-center text-muted-foreground">Nenhum aluno cadastrado.</div>}
      </div>

      <Dialog open={!!manageUser} onOpenChange={(o) => !o && setManageUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Acesso a módulos — {manageUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {modules.map((m) => {
              const has = manageUser ? (accessMap[manageUser.id]?.has(m.id) ?? false) : false;
              return (
                <label key={m.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer">
                  <span className="text-sm">{m.title}</span>
                  <Checkbox checked={has} onCheckedChange={() => manageUser && toggleAccess(manageUser.id, m.id, has)} />
                </label>
              );
            })}
            {modules.length === 0 && <p className="text-sm text-muted-foreground">Nenhum módulo criado.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
