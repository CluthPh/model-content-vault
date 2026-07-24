import { FormEvent, useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Ban, Copy, KeyRound, Plus, ShieldCheck, Trash2, User as UserIcon } from "lucide-react";

type ProfileRow = {
  id: string;
  access_code_last4: string | null;
  full_name: string | null;
  blocked: boolean;
};
type ModuleRow = { id: string; title: string };
type RoleRow = { user_id: string; role: string };
type AccessRow = { user_id: string; module_id: string };
type FunctionResponse = { ok?: boolean; error?: string; access_code?: string };

export default function AdminUsers() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [accessMap, setAccessMap] = useState<Record<string, Set<string>>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", is_admin: false });
  const [saving, setSaving] = useState(false);
  const [manageUser, setManageUser] = useState<ProfileRow | null>(null);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: profiles }, { data: moduleRows }, { data: roles }, { data: access }] = await Promise.all([
      supabase.from("profiles").select("id,access_code_last4,full_name,blocked").order("created_at", { ascending: false }),
      supabase.from("modules").select("id,title").order("order_index"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("module_access").select("user_id,module_id"),
    ]);
    setUsers((profiles as ProfileRow[]) ?? []);
    setModules((moduleRows as ModuleRow[]) ?? []);
    setAdmins(new Set(((roles as RoleRow[] | null) ?? []).filter((row) => row.role === "admin").map((row) => row.user_id)));
    const map: Record<string, Set<string>> = {};
    ((access as AccessRow[] | null) ?? []).forEach((row) => {
      map[row.user_id] = map[row.user_id] ?? new Set();
      map[row.user_id].add(row.module_id);
    });
    setAccessMap(map);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const invokeManagement = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin-manage-user", { body });
    const response = data as FunctionResponse | null;
    if (error || response?.error) {
      toast.error("Não foi possível concluir", { description: response?.error ?? error?.message });
      return null;
    }
    return response;
  };

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", { body: form });
    setSaving(false);
    const response = data as FunctionResponse | null;
    if (error || response?.error || !response?.access_code) {
      toast.error("Erro ao criar", { description: response?.error ?? error?.message });
      return;
    }
    setOpen(false);
    setForm({ full_name: "", is_admin: false });
    setRevealedCode(response.access_code);
    await load();
  };

  const rotateCode = async (user: ProfileRow) => {
    if (!confirm(`Gerar um novo código para ${user.full_name ?? "este usuário"}? O código anterior deixará de funcionar.`)) return;
    const response = await invokeManagement({ action: "rotate_code", user_id: user.id });
    if (response?.access_code) {
      setRevealedCode(response.access_code);
      await load();
    }
  };

  const setBlocked = async (user: ProfileRow) => {
    const response = await invokeManagement({ action: "set_blocked", user_id: user.id, blocked: !user.blocked });
    if (response) {
      toast.success(user.blocked ? "Usuário desbloqueado" : "Usuário bloqueado");
      setManageUser(null);
      await load();
    }
  };

  const deleteUser = async (user: ProfileRow) => {
    if (!confirm(`Excluir permanentemente ${user.full_name ?? "este usuário"}?`)) return;
    const response = await invokeManagement({ action: "delete_user", user_id: user.id });
    if (response) {
      toast.success("Usuário excluído");
      setManageUser(null);
      await load();
    }
  };

  const copyCode = async () => {
    if (!revealedCode) return;
    try {
      await navigator.clipboard.writeText(revealedCode);
      toast.success("Código copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const toggleAccess = async (userId: string, moduleId: string, hasAccess: boolean) => {
    const result = hasAccess
      ? await supabase.from("module_access").delete().eq("user_id", userId).eq("module_id", moduleId)
      : await supabase.from("module_access").insert({ user_id: userId, module_id: moduleId });
    if (result.error) return toast.error(result.error.message);
    await load();
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Administração</p>
          <h1 className="text-3xl font-bold mt-2">Alunos</h1>
          <p className="text-sm text-muted-foreground mt-1">Os códigos são exibidos uma única vez ao criar ou renovar.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary btn-glow"><Plus className="h-4 w-4 mr-1" /> Novo aluno</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Cadastrar aluno</DialogTitle></DialogHeader>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <Label htmlFor="full-name">Nome completo</Label>
                <Input id="full-name" required maxLength={120} value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_admin} onCheckedChange={(value) => setForm({ ...form, is_admin: !!value })} />
                Conceder acesso administrativo
              </label>
              <Button className="w-full gradient-primary btn-glow" disabled={saving}>
                {saving ? "Cadastrando..." : "Cadastrar e gerar código"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {users.map((user) => {
          const isAdmin = admins.has(user.id);
          return (
            <div key={user.id} className="card-border rounded-xl p-4 flex flex-wrap items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                {isAdmin ? <ShieldCheck className="h-5 w-5 text-primary" /> : <UserIcon className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{user.full_name ?? "Sem nome"}</h3>
                  {isAdmin && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded gradient-primary">Admin</span>}
                  {user.blocked && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-destructive text-destructive-foreground">Bloqueado</span>}
                </div>
                <code className="text-sm font-mono tracking-widest text-muted-foreground">
                  {user.access_code_last4 ? `•••• ${user.access_code_last4}` : "Código pendente"}
                </code>
              </div>
              <Button variant="outline" size="sm" onClick={() => rotateCode(user)}><KeyRound className="h-4 w-4 mr-1" /> Renovar código</Button>
              <Button variant="secondary" size="sm" onClick={() => setManageUser(user)}>Gerenciar</Button>
            </div>
          );
        })}
        {users.length === 0 && <div className="card-border rounded-xl p-10 text-center text-muted-foreground">Nenhum aluno cadastrado.</div>}
      </div>

      <Dialog open={!!revealedCode} onOpenChange={(value) => !value && setRevealedCode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo código de acesso</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Copie agora. Por segurança, ele não será exibido novamente.</p>
          <div className="flex gap-2">
            <Input readOnly value={revealedCode ?? ""} className="font-mono text-center tracking-widest text-lg" />
            <Button type="button" onClick={copyCode}><Copy className="h-4 w-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageUser} onOpenChange={(value) => !value && setManageUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Gerenciar — {manageUser?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {modules.map((module) => {
              const hasAccess = manageUser ? (accessMap[manageUser.id]?.has(module.id) ?? false) : false;
              return (
                <label key={module.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer">
                  <span className="text-sm">{module.title}</span>
                  <Checkbox checked={hasAccess} onCheckedChange={() => manageUser && toggleAccess(manageUser.id, module.id, hasAccess)} />
                </label>
              );
            })}
          </div>
          {manageUser && (
            <div className="grid grid-cols-2 gap-2 pt-3 border-t">
              <Button variant="outline" onClick={() => setBlocked(manageUser)}>
                <Ban className="h-4 w-4 mr-1" /> {manageUser.blocked ? "Desbloquear" : "Bloquear"}
              </Button>
              <Button variant="destructive" onClick={() => deleteUser(manageUser)}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
