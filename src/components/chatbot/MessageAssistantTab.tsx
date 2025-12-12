import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, Wand2, FileText, Languages, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function MessageAssistantTab() {
  return (
    <div className="space-y-6">
      {/* Header com explicação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Assistente de Mensagens com IA
          </CardTitle>
          <CardDescription>
            A IA ajuda os agentes durante o atendimento, oferecendo sugestões inteligentes 
            para melhorar a qualidade e agilidade das respostas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-sm">
              <strong>Como funciona:</strong> Durante o atendimento de tickets, os agentes podem usar 
              o botão <Badge variant="secondary" className="mx-1">Sugestões IA</Badge> para receber 
              ajuda da inteligência artificial. A IA analisa a conversa e oferece respostas personalizadas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Sugestões de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              A IA analisa o histórico da conversa e sugere até 3 respostas profissionais 
              que o agente pode usar ou adaptar.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <p className="text-sm">Clique em "Sugestões IA" no ticket</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <p className="text-sm">Aguarde a IA analisar a conversa</p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <p className="text-sm">Escolha uma sugestão ou gere novas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wand2 className="h-5 w-5 text-purple-500" />
              Melhorar Texto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Reescreve a mensagem do agente de forma mais profissional e clara, 
              mantendo o significado original.
            </p>
            <div className="bg-muted/50 rounded p-3">
              <p className="text-sm text-muted-foreground italic">
                Exemplo: "oi td bem?" → "Olá! Tudo bem? Como posso ajudá-lo?"
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-green-500" />
              Resumir Conversa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Cria um resumo conciso de conversas longas, facilitando a compreensão 
              rápida do contexto ao transferir tickets.
            </p>
            <div className="bg-muted/50 rounded p-3">
              <p className="text-sm text-muted-foreground">
                Útil para: transferências entre agentes, relatórios, histórico
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Languages className="h-5 w-5 text-orange-500" />
              Tradução Automática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Traduz mensagens recebidas em outros idiomas automaticamente 
              para o português, facilitando atendimentos internacionais.
            </p>
            <div className="bg-muted/50 rounded p-3">
              <p className="text-sm text-muted-foreground">
                Suporta: Inglês, Espanhol, Francês e outros idiomas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuração do provedor */}
      <Card>
        <CardHeader>
          <CardTitle>Provedor de IA</CardTitle>
          <CardDescription>
            O assistente de mensagens usa o mesmo provedor de IA configurado para o chatbot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Para alterar o provedor de IA ou configurar API Keys, acesse a aba "Provedores de IA".
            </p>
            <Button variant="outline" asChild>
              <Link to="/chatbot-settings" className="flex items-center gap-2">
                Configurar Provedores
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Base de Conhecimento */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Dica: Treine sua IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Para que o assistente de mensagens ofereça sugestões mais precisas e 
            alinhadas com seu negócio, adicione informações na <strong>Base de Conhecimento</strong>.
          </p>
          <p className="text-sm">
            FAQs, políticas da empresa e exemplos de boas respostas ajudam a IA 
            a entender melhor o contexto do seu atendimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
