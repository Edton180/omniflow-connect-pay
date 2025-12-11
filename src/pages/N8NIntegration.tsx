import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Webhook, Copy, Check, ExternalLink, Zap, MessageSquare, Ticket, RefreshCw, User, CheckCircle, Star, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface N8NConfig {
  id: string;
  tenant_id: string;
  webhook_url: string;
  api_key?: string;
  is_active: boolean;
  triggers: {
    new_ticket: boolean;
    new_message: boolean;
    status_change: boolean;
    ticket_closed: boolean;
    ticket_assigned: boolean;
    evaluation_received: boolean;
  };
}

const defaultTriggers = {
  new_ticket: true,
  new_message: true,
  status_change: true,
  ticket_closed: false,
  ticket_assigned: false,
  evaluation_received: false,
};

export default function N8NIntegration() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<Partial<N8NConfig>>({
    webhook_url: "",
    api_key: "",
    is_active: false,
    triggers: defaultTriggers,
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-webhook`;

  // Buscar configuração existente
  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["n8n-config", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("n8n_configs")
        .select("*")
        .eq("tenant_id", profile?.tenant_id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        triggers: { ...defaultTriggers, ...(data.triggers as N8NConfig["triggers"]) }
      } as N8NConfig;
    },
    enabled: !!profile?.tenant_id,
  });

  // Atualizar estado quando carregar config - CORRIGIDO: usar useEffect
  useEffect(() => {
    if (existingConfig) {
      setConfig({
        webhook_url: existingConfig.webhook_url,
        api_key: existingConfig.api_key || "",
        is_active: existingConfig.is_active,
        triggers: existingConfig.triggers,
      });
    }
  }, [existingConfig]);

  // Salvar configuração
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!config.webhook_url) {
        throw new Error("URL do Webhook é obrigatória");
      }

      // Validar URL
      try {
        new URL(config.webhook_url);
      } catch {
        throw new Error("URL do Webhook inválida");
      }

      const payload = {
        tenant_id: profile?.tenant_id,
        webhook_url: config.webhook_url,
        api_key: config.api_key || null,
        is_active: config.is_active,
        triggers: config.triggers,
      };

      if (existingConfig) {
        const { error } = await supabase
          .from("n8n_configs")
          .update(payload)
          .eq("id", existingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("n8n_configs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Configuração salva com sucesso");
      queryClient.invalidateQueries({ queryKey: ["n8n-config"] });
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  // Testar webhook
  const testMutation = useMutation({
    mutationFn: async () => {
      if (!config.webhook_url) {
        throw new Error("Configure a URL do webhook primeiro");
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (config.api_key) {
        headers["X-N8N-Api-Key"] = config.api_key;
      }

      const response = await fetch(config.webhook_url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event: "test",
          tenant_id: profile?.tenant_id,
          timestamp: new Date().toISOString(),
          data: {
            message: "Teste de conexão do OmniFlow",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Teste enviado com sucesso! Verifique seu workflow no N8N.");
    },
    onError: (error) => {
      toast.error(`Erro no teste: ${error.message}`);
    },
  });

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("URL copiada!");
  };

  const updateTrigger = (key: keyof N8NConfig["triggers"], value: boolean) => {
    setConfig({
      ...config,
      triggers: { ...config.triggers!, [key]: value },
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Webhook className="h-6 w-6" />
              Integração N8N
            </h1>
            <p className="text-muted-foreground">
              Conecte o OmniFlow com seus workflows de automação
            </p>
          </div>
          <Badge variant={existingConfig?.is_active ? "default" : "secondary"}>
            {existingConfig?.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        <Tabs defaultValue="config">
          <TabsList>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="docs">Documentação</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook para N8N</CardTitle>
                <CardDescription>
                  Use esta URL no seu workflow N8N para enviar ações ao OmniFlow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={copyWebhook}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook do N8N</CardTitle>
                <CardDescription>
                  Configure a URL do seu workflow N8N para receber eventos do OmniFlow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>URL do Webhook N8N</Label>
                  <Input
                    value={config.webhook_url}
                    onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                    placeholder="https://seu-n8n.com/webhook/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Crie um node "Webhook" no N8N e cole a URL aqui
                  </p>
                </div>

                <div>
                  <Label>API Key (opcional)</Label>
                  <Input
                    type="password"
                    value={config.api_key}
                    onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                    placeholder="Chave de autenticação"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Será verificada no header X-N8N-Api-Key ao receber chamadas
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Integração Ativa</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilita o envio de eventos para o N8N
                    </p>
                  </div>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Triggers (Gatilhos)</CardTitle>
                <CardDescription>
                  Escolha quais eventos devem ser enviados ao N8N
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Novo Ticket</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando um novo ticket é criado
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.triggers?.new_ticket}
                    onCheckedChange={(checked) => updateTrigger("new_ticket", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Nova Mensagem</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando uma mensagem é recebida
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.triggers?.new_message}
                    onCheckedChange={(checked) => updateTrigger("new_message", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Mudança de Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando o status do ticket muda
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.triggers?.status_change}
                    onCheckedChange={(checked) => updateTrigger("status_change", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Ticket Fechado</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando um ticket é encerrado
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.triggers?.ticket_closed}
                    onCheckedChange={(checked) => updateTrigger("ticket_closed", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Ticket Atribuído</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando um agente é atribuído ao ticket
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.triggers?.ticket_assigned}
                    onCheckedChange={(checked) => updateTrigger("ticket_assigned", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label>Avaliação Recebida</Label>
                      <p className="text-sm text-muted-foreground">
                        Quando o cliente avalia o atendimento
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.triggers?.evaluation_received}
                    onCheckedChange={(checked) => updateTrigger("evaluation_received", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar Configuração"}
              </Button>
              <Button
                variant="outline"
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending || !config.webhook_url}
              >
                <Zap className="mr-2 h-4 w-4" />
                {testMutation.isPending ? "Testando..." : "Testar Conexão"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="docs">
            <Card>
              <CardHeader>
                <CardTitle>Como Integrar com N8N</CardTitle>
                <CardDescription>
                  Guia completo de integração com workflows do N8N
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="receive">
                    <AccordionTrigger>1. Receber Eventos do OmniFlow</AccordionTrigger>
                    <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                      <p>
                        Configure um node "Webhook" no N8N e cole a URL na configuração acima.
                        O OmniFlow enviará eventos no formato:
                      </p>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "event": "ticket.created",
  "tenant_id": "uuid",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "ticket": {
      "id": "uuid",
      "contact_id": "uuid",
      "channel": "whatsapp",
      "status": "open",
      "priority": "medium"
    },
    "contact": {
      "name": "João Silva",
      "phone": "+5511999999999"
    }
  }
}`}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="send">
                    <AccordionTrigger>2. Enviar Ações para o OmniFlow</AccordionTrigger>
                    <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                      <p>
                        Use o node "HTTP Request" do N8N para chamar nosso webhook.
                      </p>
                      <p className="font-semibold">URL do Webhook:</p>
                      <pre className="bg-muted p-2 rounded text-xs">{webhookUrl}</pre>
                      
                      <p className="font-semibold mt-4">Headers (se usando API Key):</p>
                      <pre className="bg-muted p-2 rounded text-xs">
{`X-N8N-Api-Key: sua-api-key
Content-Type: application/json`}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="events">
                    <AccordionTrigger>3. Eventos Suportados</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm">Tickets</h4>
                          <ul className="text-sm space-y-1 mt-2">
                            <li><code className="bg-muted px-1 rounded">create_ticket</code> - Criar novo ticket</li>
                            <li><code className="bg-muted px-1 rounded">update_ticket</code> - Atualizar status/prioridade</li>
                            <li><code className="bg-muted px-1 rounded">close_ticket</code> - Fechar ticket</li>
                            <li><code className="bg-muted px-1 rounded">assign_ticket</code> - Atribuir agente</li>
                            <li><code className="bg-muted px-1 rounded">get_ticket</code> - Buscar ticket por ID</li>
                            <li><code className="bg-muted px-1 rounded">get_tickets</code> - Listar tickets</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Mensagens</h4>
                          <ul className="text-sm space-y-1 mt-2">
                            <li><code className="bg-muted px-1 rounded">send_message</code> - Enviar mensagem</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Contatos</h4>
                          <ul className="text-sm space-y-1 mt-2">
                            <li><code className="bg-muted px-1 rounded">create_contact</code> - Criar contato</li>
                            <li><code className="bg-muted px-1 rounded">update_contact</code> - Atualizar contato</li>
                            <li><code className="bg-muted px-1 rounded">get_contact</code> - Buscar contato</li>
                            <li><code className="bg-muted px-1 rounded">get_contacts</code> - Listar contatos</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Outros</h4>
                          <ul className="text-sm space-y-1 mt-2">
                            <li><code className="bg-muted px-1 rounded">get_agents</code> - Listar agentes</li>
                            <li><code className="bg-muted px-1 rounded">get_queues</code> - Listar filas</li>
                            <li><code className="bg-muted px-1 rounded">webhook_test</code> - Testar conexão</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="examples">
                    <AccordionTrigger>4. Exemplos de Payload</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <p className="font-semibold text-sm">Criar Ticket:</p>
                        <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
{`{
  "event": "create_ticket",
  "tenant_id": "seu-tenant-id",
  "data": {
    "contact_id": "uuid-do-contato",
    "channel": "whatsapp",
    "message": "Mensagem inicial",
    "priority": "high"
  }
}`}
                        </pre>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Enviar Mensagem:</p>
                        <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
{`{
  "event": "send_message",
  "tenant_id": "seu-tenant-id",
  "data": {
    "ticket_id": "uuid-do-ticket",
    "content": "Sua mensagem aqui",
    "media_url": "https://exemplo.com/imagem.jpg",
    "media_type": "image"
  }
}`}
                        </pre>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Criar Contato:</p>
                        <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
{`{
  "event": "create_contact",
  "tenant_id": "seu-tenant-id",
  "data": {
    "name": "João Silva",
    "phone": "+5511999999999",
    "email": "joao@email.com",
    "tags": ["lead", "site"]
  }
}`}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" asChild>
                    <a
                      href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Docs N8N Webhook
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Docs N8N HTTP Request
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
