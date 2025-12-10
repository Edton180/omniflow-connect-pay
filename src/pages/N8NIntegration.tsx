import { useState } from "react";
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
import { Webhook, Copy, Check, ExternalLink, Zap, MessageSquare, Ticket, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  };
}

export default function N8NIntegration() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<Partial<N8NConfig>>({
    webhook_url: "",
    api_key: "",
    is_active: false,
    triggers: {
      new_ticket: true,
      new_message: true,
      status_change: true,
    },
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
        triggers: (data.triggers as N8NConfig["triggers"]) || { new_ticket: true, new_message: true, status_change: true }
      } as N8NConfig;
    },
    enabled: !!profile?.tenant_id,
  });

  // Atualizar estado quando carregar config
  useState(() => {
    if (existingConfig) {
      setConfig({
        webhook_url: existingConfig.webhook_url,
        api_key: existingConfig.api_key || "",
        is_active: existingConfig.is_active,
        triggers: existingConfig.triggers,
      });
    }
  });

  // Salvar configuração
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!config.webhook_url) {
        throw new Error("URL do Webhook é obrigatória");
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
                  Use esta URL no seu workflow N8N para receber eventos do OmniFlow
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
                  Configure a URL do webhook do seu workflow N8N para enviar ações ao OmniFlow
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
                    Será enviada no header X-N8N-Api-Key
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
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        triggers: { ...config.triggers!, new_ticket: checked },
                      })
                    }
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
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        triggers: { ...config.triggers!, new_message: checked },
                      })
                    }
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
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        triggers: { ...config.triggers!, status_change: checked },
                      })
                    }
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
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>1. Receber Eventos do OmniFlow</h4>
                <p>
                  Configure um node "Webhook" no N8N e cole a URL do webhook do N8N acima. O
                  OmniFlow enviará eventos no formato:
                </p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "event": "ticket.created",
  "tenant_id": "uuid",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "ticket": { ... },
    "contact": { ... }
  }
}`}
                </pre>

                <h4>2. Enviar Ações para o OmniFlow</h4>
                <p>
                  Use o node "HTTP Request" do N8N para chamar nosso webhook. Eventos suportados:
                </p>
                <ul>
                  <li>
                    <strong>create_ticket</strong> - Criar novo ticket
                  </li>
                  <li>
                    <strong>send_message</strong> - Enviar mensagem em ticket
                  </li>
                  <li>
                    <strong>update_ticket</strong> - Atualizar status/prioridade
                  </li>
                  <li>
                    <strong>create_contact</strong> - Criar contato
                  </li>
                  <li>
                    <strong>get_ticket</strong> - Buscar dados do ticket
                  </li>
                </ul>

                <h4>Exemplo de Payload</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
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

                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <a
                      href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Documentação do N8N
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
