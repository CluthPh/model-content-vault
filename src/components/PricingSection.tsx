import { motion } from "framer-motion";
import { Check, Star, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Básico",
    price: "29,90",
    period: "/mês",
    icon: Zap,
    description: "Acesso ao conteúdo básico",
    features: [
      "20 fotos exclusivas",
      "Acesso por 30 dias",
      "Suporte por chat",
    ],
    popular: false,
  },
  {
    name: "VIP",
    price: "49,90",
    period: "/mês",
    icon: Star,
    description: "O mais popular",
    features: [
      "Todas as fotos exclusivas",
      "5 vídeos por mês",
      "Acesso vitalício ao conteúdo",
      "Chat privado",
      "Conteúdo antecipado",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "99,90",
    period: "/mês",
    icon: Crown,
    description: "Experiência completa",
    features: [
      "Todo conteúdo VIP",
      "Vídeos ilimitados",
      "Conteúdo personalizado",
      "Videochamadas exclusivas",
      "Prioridade em novidades",
      "Presentes surpresa",
    ],
    popular: false,
  },
];

export function PricingSection() {
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
            Desbloqueie todo o conteúdo exclusivo e tenha uma experiência única com a Amanda.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`relative overflow-hidden rounded-2xl border bg-card p-6 shadow-card transition-all hover:border-primary/50 ${
                plan.popular ? 'border-primary shadow-glow' : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -right-12 top-6 rotate-45 gradient-primary px-12 py-1 text-xs font-semibold text-primary-foreground">
                  Popular
                </div>
              )}

              <div className="mb-6 flex items-center gap-3">
                <div className={`rounded-xl p-3 ${plan.popular ? 'gradient-primary' : 'bg-secondary'}`}>
                  <plan.icon className={`h-6 w-6 ${plan.popular ? 'text-primary-foreground' : 'text-foreground'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">R$ {plan.price}</span>
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
                  plan.popular
                    ? 'gradient-primary text-primary-foreground shadow-glow hover:opacity-90'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Assinar Agora
              </Button>
            </motion.div>
          ))}
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
