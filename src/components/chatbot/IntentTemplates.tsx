import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { MessageSquare, Clock, DollarSign, User, ThumbsUp, HelpCircle, Phone, XCircle } from "lucide-react";

interface IntentTemplate {
  id: string;
  name: string;
  description: string;
  examples: string[];
  response: string;
  action: "respond" | "transfer";
  icon: React.ReactNode;
  category: string;
}

const INTENT_TEMPLATES: IntentTemplate[] = [
  {
    id: "greeting",
    name: "Saudação",
    description: "Mensagens de cumprimento inicial",
    examples: ["olá", "oi", "bom dia", "boa tarde", "boa noite", "e aí", "hey", "hello"],
    response: "Olá! 👋 Bem-vindo(a)! Como posso ajudá-lo(a) hoje?",
    action: "respond",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "Básico"
  },
  {
    id: "hours",
    name: "Horário de Funcionamento",
    description: "Perguntas sobre horários",
    examples: ["qual o horário", "que horas abre", "que horas fecha", "horário de atendimento", "funciona que horas", "está aberto"],
    response: "Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Aos sábados das 8h às 12h.",
    action: "respond",
    icon: <Clock className="h-4 w-4" />,
    category: "Informações"
  },
  {
    id: "pricing",
    name: "Preços e Planos",
    description: "Perguntas sobre valores e planos",
    examples: ["quanto custa", "qual o preço", "valores", "planos", "mensalidade", "tabela de preços", "como funciona o pagamento"],
    response: "Temos diversos planos para atender suas necessidades! Um momento que vou transferir você para um especialista que pode explicar todos os detalhes.",
    action: "transfer",
    icon: <DollarSign className="h-4 w-4" />,
    category: "Comercial"
  },
  {
    id: "talk_to_human",
    name: "Falar com Atendente",
    description: "Solicitação de atendimento humano",
    examples: ["quero falar com atendente", "atendente humano", "falar com pessoa", "preciso de ajuda humana", "não quero robô", "quero falar com alguém"],
    response: "Entendi! Vou transferir você para um de nossos atendentes. Aguarde um momento, por favor.",
    action: "transfer",
    icon: <User className="h-4 w-4" />,
    category: "Suporte"
  },
  {
    id: "thanks",
    name: "Agradecimento",
    description: "Mensagens de agradecimento",
    examples: ["obrigado", "obrigada", "valeu", "agradeço", "muito obrigado", "thanks"],
    response: "De nada! 😊 Foi um prazer ajudar. Se precisar de mais alguma coisa, é só chamar!",
    action: "respond",
    icon: <ThumbsUp className="h-4 w-4" />,
    category: "Básico"
  },
  {
    id: "help",
    name: "Ajuda Geral",
    description: "Pedidos de ajuda ou suporte",
    examples: ["preciso de ajuda", "help", "socorro", "não sei o que fazer", "pode me ajudar", "estou com problema"],
    response: "Claro, estou aqui para ajudar! 🤝 Por favor, me conte mais detalhes sobre o que você precisa.",
    action: "respond",
    icon: <HelpCircle className="h-4 w-4" />,
    category: "Suporte"
  },
  {
    id: "contact",
    name: "Contato/Telefone",
    description: "Perguntas sobre formas de contato",
    examples: ["qual o telefone", "número de contato", "email", "como entro em contato", "whatsapp", "formas de contato"],
    response: "Você pode entrar em contato conosco por este chat ou pelos nossos canais oficiais. Como posso ajudar agora?",
    action: "respond",
    icon: <Phone className="h-4 w-4" />,
    category: "Informações"
  },
  {
    id: "cancel",
    name: "Cancelamento",
    description: "Solicitações de cancelamento",
    examples: ["quero cancelar", "cancelar assinatura", "cancelar plano", "não quero mais", "desistir"],
    response: "Entendo sua solicitação. Vou transferir você para um especialista que pode ajudar com o cancelamento e verificar se há algo que possamos fazer para melhorar sua experiência.",
    action: "transfer",
    icon: <XCircle className="h-4 w-4" />,
    category: "Comercial"
  }
];

interface IntentTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (templates: IntentTemplate[]) => void;
  existingIntents: string[];
}

export function IntentTemplates({ open, onOpenChange, onImport, existingIntents }: IntentTemplatesProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleImport = () => {
    const templatesToImport = INTENT_TEMPLATES.filter(t => selectedTemplates.includes(t.id));
    onImport(templatesToImport);
    setSelectedTemplates([]);
    onOpenChange(false);
  };

  const isExisting = (name: string) => 
    existingIntents.some(i => i.toLowerCase() === name.toLowerCase());

  const categories = [...new Set(INTENT_TEMPLATES.map(t => t.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Templates de Intenções</DialogTitle>
          <DialogDescription>
            Selecione os templates que deseja importar para seu chatbot
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {categories.map(category => (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
              <div className="grid gap-3">
                {INTENT_TEMPLATES.filter(t => t.category === category).map(template => {
                  const exists = isExisting(template.name);
                  return (
                    <div
                      key={template.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                        exists 
                          ? "opacity-50 bg-muted cursor-not-allowed" 
                          : selectedTemplates.includes(template.id)
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        id={template.id}
                        checked={selectedTemplates.includes(template.id)}
                        onCheckedChange={() => !exists && toggleTemplate(template.id)}
                        disabled={exists}
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={template.id}
                          className={`flex items-center gap-2 font-medium ${exists ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {template.icon}
                          {template.name}
                          {exists && <Badge variant="secondary" className="text-xs">Já existe</Badge>}
                          <Badge variant={template.action === "respond" ? "default" : "outline"} className="text-xs ml-auto">
                            {template.action === "respond" ? "Responder" : "Transferir"}
                          </Badge>
                        </Label>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.examples.slice(0, 4).map((ex, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {ex}
                            </Badge>
                          ))}
                          {template.examples.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.examples.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={selectedTemplates.length === 0}
          >
            Importar {selectedTemplates.length > 0 && `(${selectedTemplates.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { INTENT_TEMPLATES };
export type { IntentTemplate };
