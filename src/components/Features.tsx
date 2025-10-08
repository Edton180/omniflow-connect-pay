import { 
  Bot, 
  Workflow, 
  Users, 
  CreditCard, 
  Shield, 
  Sparkles,
  MessageCircle,
  TrendingUp 
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Inbox Omnicanal",
    description: "Gerencie WhatsApp, Instagram, Facebook Messenger e Telegram em uma única interface unificada com transferências inteligentes.",
    gradient: "from-primary to-primary-light"
  },
  {
    icon: Workflow,
    title: "Construtor Visual de Fluxos",
    description: "Crie automações complexas com drag-and-drop. Condicionais, APIs, IA e muito mais sem código.",
    gradient: "from-secondary to-secondary-light"
  },
  {
    icon: Bot,
    title: "IA Integrada",
    description: "Conecte OpenAI e outros modelos para respostas inteligentes, análise de sentimento e geração de conteúdo.",
    gradient: "from-accent to-accent-light"
  },
  {
    icon: Users,
    title: "Equipes e Filas",
    description: "Distribua atendimentos automaticamente com round-robin, skills-based e regras de prioridade personalizadas.",
    gradient: "from-primary to-secondary"
  },
  {
    icon: CreditCard,
    title: "Pagamentos Integrados",
    description: "Aceite pagamentos via Stripe, Mercado Pago, PIX, boletos e mais. Gestão de assinaturas automatizada.",
    gradient: "from-secondary to-accent"
  },
  {
    icon: Shield,
    title: "Segurança Enterprise",
    description: "Conformidade LGPD/GDPR, criptografia end-to-end, vault de secrets e auditoria completa.",
    gradient: "from-accent to-primary"
  },
  {
    icon: Sparkles,
    title: "White-Label",
    description: "Customize logo, cores e branding. Crie sua própria plataforma de atendimento com sua marca.",
    gradient: "from-primary to-accent"
  },
  {
    icon: TrendingUp,
    title: "Analytics Avançado",
    description: "Dashboards em tempo real, métricas de performance, conversões por fluxo e muito mais.",
    gradient: "from-secondary to-primary"
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa para transformar seu atendimento e escalar suas operações
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 mb-4 group-hover:shadow-glow transition-all`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
