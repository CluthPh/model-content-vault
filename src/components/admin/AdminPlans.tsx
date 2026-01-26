import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Trash2, Edit, Save, X, Star, 
  Zap, Crown, DollarSign 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string | null;
  features: string[];
  is_popular: boolean;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const iconOptions = [
  { value: "zap", label: "Raio", icon: Zap },
  { value: "star", label: "Estrela", icon: Star },
  { value: "crown", label: "Coroa", icon: Crown },
];

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    period: "/mês",
    description: "",
    features: "",
    is_popular: false,
    is_active: true,
    icon: "zap",
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price.toString(),
        period: plan.period,
        description: plan.description || "",
        features: plan.features.join("\n"),
        is_popular: plan.is_popular,
        is_active: plan.is_active,
        icon: plan.icon,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        price: "",
        period: "/mês",
        description: "",
        features: "",
        is_popular: false,
        is_active: true,
        icon: "zap",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Erro",
        description: "Nome e preço são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const planData = {
        name: formData.name,
        price: parseFloat(formData.price),
        period: formData.period,
        description: formData.description || null,
        features: featuresArray,
        is_popular: formData.is_popular,
        is_active: formData.is_active,
        icon: formData.icon,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("pricing_plans")
          .update(planData)
          .eq("id", editingPlan.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pricing_plans")
          .insert({
            ...planData,
            sort_order: plans.length,
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso!",
        description: editingPlan ? "Plano atualizado" : "Plano criado",
      });

      closeModal();
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o plano",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;

    try {
      const { error } = await supabase
        .from("pricing_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano excluído",
      });

      fetchPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano",
        variant: "destructive",
      });
    }
  };

  const getIcon = (iconName: string) => {
    const iconData = iconOptions.find((i) => i.value === iconName);
    return iconData?.icon || Zap;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planos de Assinatura</h2>
          <p className="text-muted-foreground">
            Configure os planos e preços
          </p>
        </div>
        <Button
          onClick={() => openModal()}
          className="gradient-primary font-semibold text-primary-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Nenhum plano ainda</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Clique em "Novo Plano" para criar seu primeiro plano
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = getIcon(plan.icon);
            return (
              <motion.div
                key={plan.id}
                layout
                className={`group relative overflow-hidden rounded-xl border bg-card p-6 ${
                  plan.is_popular ? "border-primary shadow-glow" : "border-border"
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -right-12 top-6 rotate-45 gradient-primary px-12 py-1 text-xs font-semibold text-primary-foreground">
                    Popular
                  </div>
                )}

                {!plan.is_active && (
                  <div className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                    Inativo
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <div className={`rounded-xl p-3 ${plan.is_popular ? "gradient-primary" : "bg-secondary"}`}>
                    <Icon className={`h-6 w-6 ${plan.is_popular ? "text-primary-foreground" : ""}`} />
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openModal(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.description}</p>

                <div className="my-4">
                  <span className="text-3xl font-bold">
                    R$ {plan.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="space-y-2 text-sm">
                  {plan.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-muted-foreground">
                      +{plan.features.length - 3} mais...
                    </li>
                  )}
                </ul>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-md"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="text-lg font-semibold">
                  {editingPlan ? "Editar Plano" : "Novo Plano"}
                </h3>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-1 hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <div className="space-y-4">
                  {/* Icon */}
                  <div>
                    <Label>Ícone</Label>
                    <div className="mt-2 flex gap-2">
                      {iconOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: opt.value })}
                          className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
                            formData.icon === opt.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <opt.icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <Label htmlFor="name">Nome do Plano</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-2"
                      placeholder="Ex: VIP"
                    />
                  </div>

                  {/* Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="mt-2"
                        placeholder="49.90"
                      />
                    </div>
                    <div>
                      <Label htmlFor="period">Período</Label>
                      <Input
                        id="period"
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        className="mt-2"
                        placeholder="/mês"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-2"
                      placeholder="Ex: O mais popular"
                    />
                  </div>

                  {/* Features */}
                  <div>
                    <Label htmlFor="features">Recursos (um por linha)</Label>
                    <Textarea
                      id="features"
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      className="mt-2"
                      rows={5}
                      placeholder="Todas as fotos exclusivas&#10;5 vídeos por mês&#10;Chat privado"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Plano Popular</Label>
                      <p className="text-xs text-muted-foreground">
                        Destacar este plano
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_popular}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <Label>Ativo</Label>
                      <p className="text-xs text-muted-foreground">
                        Exibir no site
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-border p-4">
                <Button variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gradient-primary font-semibold text-primary-foreground"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Salvando...
                    </span>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
