import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Zap, Trash2, Info, Clock, MessageSquare, UserCheck, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { AutomationDialog } from "@/components/automations/AutomationDialog";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Automation {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: string;
  conditions: any;
  actions: any;
  execution_count: number;
  last_executed_at: string | null;
}

const triggerExamples = [
  {
    type: "ticket_created",
    icon: Plus,
    title: "Ticket Criado",
    description: "Quando um novo ticket é aberto",
    examples: [
      "Atribuir automaticamente a um agente disponível",
      "Enviar mensagem de boas-vindas ao cliente",
      "Adicionar tag baseado no canal de origem",
    ],
  },
  {
    type: "message_received",
    icon: MessageSquare,
    title: "Mensagem Recebida",
    description: "Quando uma nova mensagem chega",
    examples: [
      "Detectar palavras-chave e responder automaticamente",
      "Encaminhar para fila específica baseado no conteúdo",
      "Notificar supervisor se contiver palavras urgentes",
    ],
  },
  {
    type: "ticket_status_changed",
    icon: UserCheck,
    title: "Status Alterado",
    description: "Quando o status do ticket muda",
    examples: [
      "Enviar pesquisa de satisfação quando fechado",
      "Notificar cliente quando em espera",
      "Atualizar CRM quando resolvido",
    ],
  },
  {
    type: "ticket_idle",
    icon: Clock,
    title: "Ticket Ocioso",
    description: "Quando um ticket fica sem atividade",
    examples: [
      "Enviar lembrete ao cliente após 24h",
      "Escalar para supervisor após 48h",
      "Fechar automaticamente após 7 dias",
    ],
  },
];

export default function Automations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: automations, isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Automation[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("automations")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast({
        title: "Automação atualizada",
        description: "O status da automação foi alterado com sucesso",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      toast({
        title: "Automação excluída",
        description: "A automação foi removida com sucesso",
      });
      setDeleteId(null);
    },
  });

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      ticket_created: "Ticket Criado",
      message_received: "Mensagem Recebida",
      ticket_status_changed: "Status Alterado",
      ticket_idle: "Ticket Ocioso",
    };
    return labels[type] || type;
  };

  const getTriggerIcon = (type: string) => {
    const icons: Record<string, any> = {
      ticket_created: Plus,
      message_received: MessageSquare,
      ticket_status_changed: UserCheck,
      ticket_idle: Clock,
    };
    return icons[type] || Zap;
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Automações
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure workflows inteligentes para automatizar tarefas repetitivas
            </p>
          </div>
          <Button onClick={() => {
            setSelectedAutomation(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Automação
          </Button>
        </div>

        {/* Seção Explicativa */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-primary" />
              O que são Automações?
            </CardTitle>
            <CardDescription>
              Automações permitem que você crie regras para executar ações automaticamente quando 
              determinados eventos acontecem. Isso economiza tempo e garante consistência no atendimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="triggers">
                <AccordionTrigger className="text-sm font-medium">
                  Ver tipos de gatilhos e exemplos
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {triggerExamples.map((trigger) => (
                      <div key={trigger.type} className="border rounded-lg p-4 bg-background">
                        <div className="flex items-center gap-2 mb-2">
                          <trigger.icon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{trigger.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{trigger.description}</p>
                        <ul className="text-xs space-y-1">
                          {trigger.examples.map((example, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Lista de Automações */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : automations && automations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {automations.map((automation) => {
              const TriggerIcon = getTriggerIcon(automation.trigger_type);
              return (
                <Card key={automation.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <TriggerIcon className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold">{automation.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {automation.description || "Sem descrição"}
                        </p>
                      </div>
                      <Switch
                        checked={automation.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: automation.id, is_active: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getTriggerLabel(automation.trigger_type)}</Badge>
                        {automation.is_active ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Inativa</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{automation.execution_count} execuções</span>
                        {automation.last_executed_at && (
                          <span>
                            Última: {new Date(automation.last_executed_at).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedAutomation(automation);
                          setIsDialogOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(automation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma automação criada</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Automatize tarefas repetitivas como atribuição de tickets, respostas automáticas 
              e notificações para sua equipe.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Automação
            </Button>
          </Card>
        )}

        <AutomationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          automation={selectedAutomation}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirmar exclusão
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta automação? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
