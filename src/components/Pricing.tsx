import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "R$ 97",
    period: "/mês",
    description: "Perfeito para pequenas equipes começando",
    features: [
      "1 canal conectado",
      "3 usuários",
      "1.000 conversas/mês",
      "Fluxos ilimitados",
      "Suporte por email",
      "Relatórios básicos"
    ],
    cta: "Começar Grátis",
    popular: false
  },
  {
    name: "Professional",
    price: "R$ 297",
    period: "/mês",
    description: "Ideal para empresas em crescimento",
    features: [
      "Todos os canais",
      "10 usuários",
      "10.000 conversas/mês",
      "IA integrada (OpenAI)",
      "API completa",
      "Suporte prioritário",
      "White-label",
      "Analytics avançado"
    ],
    cta: "Começar Teste",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Solução completa para grandes operações",
    features: [
      "Canais ilimitados",
      "Usuários ilimitados",
      "Conversas ilimitadas",
      "SLA garantido",
      "Gerente dedicado",
      "Onboarding personalizado",
      "Infraestrutura dedicada",
      "Compliance customizado"
    ],
    cta: "Falar com Vendas",
    popular: false
  }
];

const Pricing = () => {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Planos para cada tamanho de negócio
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comece grátis e escale conforme seu crescimento. Sem surpresas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl bg-card border-2 transition-all hover:shadow-xl ${
                plan.popular 
                  ? "border-primary shadow-glow scale-105" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-white text-sm font-medium">
                  Mais Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <Link to="/auth">
                <Button 
                  className={`w-full mb-6 ${
                    plan.popular 
                      ? "gradient-primary shadow-glow" 
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
