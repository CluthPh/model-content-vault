import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Star, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string | null;
  features: string[];
  is_popular: boolean;
  icon: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  star: Star,
  crown: Crown,
};

const fallbackPlans: Plan[] = [
  {
    id: "1",
    name: "Básico",
    price: 29.90,
    period: "/mês",
    icon: "zap",
    description: "Acesso ao conteúdo básico",
    features: ["20 fotos exclusivas", "Acesso por 30 dias", "Suporte por chat"],
    is_popular: false,
  },
  {
    id: "2",
    name: "VIP",
    price: 49.90,
    period: "/mês",
    icon: "star",
    description: "O mais popular",
    features: ["Todas as fotos exclusivas", "5 vídeos por mês", "Acesso vitalício ao conteúdo", "Chat privado", "Conteúdo antecipado"],
    is_popular: true,
  },
  {
    id: "3",
    name: "Premium",
    price: 99.90,
    period: "/mês",
    icon: "crown",
    description: "Experiência completa",
    features: ["Todo conteúdo VIP", "Vídeos ilimitados", "Conteúdo personalizado", "Videochamadas exclusivas", "Prioridade em novidades", "Presentes surpresa"],
    is_popular: false,
  },
];

export function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("pricing_plans")
      .select("id, name, price, period, description, features, is_popular, icon")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data && data.length > 0) {
      setPlans(data);
    }
  };

  const getIcon = (iconName: string) => iconMap[iconName] || Zap;

  return (
    <section id="planos" className="py-20">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Escolha seu <span className="text-gradient">Plano</span>
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Desbloqueie todo o conteúdo exclusivo e tenha uma experiência única.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => {
            const Icon = getIcon(plan.icon);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className={`relative overflow-hidden rounded-2xl border bg-card p-6 shadow-card transition-all hover:border-primary/50 ${
                  plan.is_popular ? 'border-primary shadow-glow' : 'border-border'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -right-12 top-6 rotate-45 gradient-primary px-12 py-1 text-xs font-semibold text-primary-foreground">
                    Popular
                  </div>
                )}

                <div className="mb-6 flex items-center gap-3">
                  <div className={`rounded-xl p-3 ${plan.is_popular ? 'gradient-primary' : 'bg-secondary'}`}>
                    <Icon className={`h-6 w-6 ${plan.is_popular ? 'text-primary-foreground' : 'text-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    R$ {plan.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full font-semibold ${
                    plan.is_popular
                      ? 'gradient-primary text-primary-foreground shadow-glow hover:opacity-90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  Assinar Agora
                </Button>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          💳 Pagamento seguro via PIX, cartão de crédito ou boleto. 
          Cancele quando quiser.
        </motion.p>
      </div>
    </section>
  );
}
