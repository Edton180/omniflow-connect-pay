import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, MessageSquare, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="relative min-h-screen gradient-hero flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-primary/20 mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Plataforma Omnicanal Completa</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Automatize seu atendimento com{" "}
            <span className="text-gradient">OmniFlow</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in">
            Conecte WhatsApp, Instagram, Facebook e Telegram. Crie fluxos inteligentes, 
            gerencie conversas e escale seu negócio com automação profissional.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in">
            <Link to="/auth">
              <Button size="lg" className="gradient-primary text-lg px-8 shadow-glow hover:shadow-lg transition-all">
                Começar Gratuitamente
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Ver Demonstração
            </Button>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in">
            <div className="p-6 rounded-2xl gradient-card backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all hover:scale-105">
              <MessageSquare className="w-10 h-10 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Multi-Canal</h3>
              <p className="text-sm text-muted-foreground">
                Todos os canais em uma única inbox inteligente
              </p>
            </div>
            
            <div className="p-6 rounded-2xl gradient-card backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all hover:scale-105">
              <Zap className="w-10 h-10 text-secondary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Automação Visual</h3>
              <p className="text-sm text-muted-foreground">
                Crie fluxos complexos sem escrever código
              </p>
            </div>
            
            <div className="p-6 rounded-2xl gradient-card backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all hover:scale-105">
              <BarChart3 className="w-10 h-10 text-accent mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Análises Profundas</h3>
              <p className="text-sm text-muted-foreground">
                Métricas e relatórios em tempo real
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
