import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface WABATemplate {
  id: string;
  template_id: string;
  template_name: string;
  language: string;
  category: string;
  status: string;
  components: unknown[];
  rejected_reason?: string;
  channel_id: string;
  last_synced_at?: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  APPROVED: { label: "Aprovado", icon: <CheckCircle className="h-4 w-4" />, variant: "default" },
  PENDING: { label: "Pendente", icon: <Clock className="h-4 w-4" />, variant: "secondary" },
  REJECTED: { label: "Rejeitado", icon: <XCircle className="h-4 w-4" />, variant: "destructive" },
  DISABLED: { label: "Desativado", icon: <AlertCircle className="h-4 w-4" />, variant: "outline" },
};

export default function WhatsAppTemplates() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "UTILITY",
    language: "pt_BR",
    headerText: "",
    bodyText: "",
    footerText: "",
  });

  // Buscar canais WhatsApp
  const { data: channels, isLoading: isLoadingChannels } = useQuery({
    queryKey: ["whatsapp-channels", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("tenant_id", profile?.tenant_id)
        .in("type", ["whatsapp", "waba"])
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  // Buscar templates locais
  const { data: templates, isLoading: isLoadingTemplates, refetch: refetchTemplates } = useQuery({
    queryKey: ["waba-templates", selectedChannel],
    queryFn: async () => {
      if (!selectedChannel) return [];

      const { data, error } = await supabase
        .from("waba_templates")
        .select("*")
        .eq("channel_id", selectedChannel)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WABATemplate[];
    },
    enabled: !!selectedChannel,
  });

  // Sincronizar templates da API Meta
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-waba-templates", {
        body: { action: "list", channelId: selectedChannel },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Templates sincronizados com sucesso");
      refetchTemplates();
    },
    onError: (error) => {
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });

  // Criar template
  const createMutation = useMutation({
    mutationFn: async () => {
      const components = [];

      if (newTemplate.headerText) {
        components.push({
          type: "HEADER",
          format: "TEXT",
          text: newTemplate.headerText,
        });
      }

      components.push({
        type: "BODY",
        text: newTemplate.bodyText,
      });

      if (newTemplate.footerText) {
        components.push({
          type: "FOOTER",
          text: newTemplate.footerText,
        });
      }

      const { data, error } = await supabase.functions.invoke("manage-waba-templates", {
        body: {
          action: "create",
          channelId: selectedChannel,
          templateData: {
            name: newTemplate.name.toLowerCase().replace(/\s+/g, "_"),
            category: newTemplate.category,
            language: newTemplate.language,
            components,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Template criado e enviado para aprovação");
      setIsCreateOpen(false);
      setNewTemplate({
        name: "",
        category: "UTILITY",
        language: "pt_BR",
        headerText: "",
        bodyText: "",
        footerText: "",
      });
      refetchTemplates();
    },
    onError: (error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });

  // Excluir template
  const deleteMutation = useMutation({
    mutationFn: async (templateName: string) => {
      const { data, error } = await supabase.functions.invoke("manage-waba-templates", {
        body: {
          action: "delete",
          channelId: selectedChannel,
          templateData: { name: templateName },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Template excluído com sucesso");
      refetchTemplates();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Templates WhatsApp</h1>
            <p className="text-muted-foreground">
              Gerencie templates de mensagens do WhatsApp Business
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecione o Canal</CardTitle>
            <CardDescription>
              Escolha um canal WhatsApp para gerenciar seus templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingChannels ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um canal WhatsApp" />
                </SelectTrigger>
                <SelectContent>
                  {channels?.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {selectedChannel && (
          <>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                Sincronizar com Meta
              </Button>

              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nome do Template</Label>
                        <Input
                          value={newTemplate.name}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, name: e.target.value })
                          }
                          placeholder="ex: confirmacao_pedido"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Apenas letras minúsculas e underscores
                        </p>
                      </div>
                      <div>
                        <Label>Categoria</Label>
                        <Select
                          value={newTemplate.category}
                          onValueChange={(v) =>
                            setNewTemplate({ ...newTemplate, category: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTILITY">Utilidade</SelectItem>
                            <SelectItem value="MARKETING">Marketing</SelectItem>
                            <SelectItem value="AUTHENTICATION">Autenticação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Idioma</Label>
                      <Select
                        value={newTemplate.language}
                        onValueChange={(v) =>
                          setNewTemplate({ ...newTemplate, language: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt_BR">Português (Brasil)</SelectItem>
                          <SelectItem value="en_US">English (US)</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Cabeçalho (opcional)</Label>
                      <Input
                        value={newTemplate.headerText}
                        onChange={(e) =>
                          setNewTemplate({ ...newTemplate, headerText: e.target.value })
                        }
                        placeholder="Texto do cabeçalho"
                        maxLength={60}
                      />
                    </div>

                    <div>
                      <Label>Corpo da Mensagem *</Label>
                      <Textarea
                        value={newTemplate.bodyText}
                        onChange={(e) =>
                          setNewTemplate({ ...newTemplate, bodyText: e.target.value })
                        }
                        placeholder="Digite o corpo da mensagem. Use {{1}}, {{2}} para variáveis."
                        rows={4}
                        maxLength={1024}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {newTemplate.bodyText.length}/1024 caracteres
                      </p>
                    </div>

                    <div>
                      <Label>Rodapé (opcional)</Label>
                      <Input
                        value={newTemplate.footerText}
                        onChange={(e) =>
                          setNewTemplate({ ...newTemplate, footerText: e.target.value })
                        }
                        placeholder="Texto do rodapé"
                        maxLength={60}
                      />
                    </div>

                    <Button
                      onClick={() => createMutation.mutate()}
                      disabled={!newTemplate.name || !newTemplate.bodyText || createMutation.isPending}
                      className="w-full"
                    >
                      {createMutation.isPending ? "Criando..." : "Criar e Enviar para Aprovação"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoadingTemplates ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : templates?.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum template encontrado</p>
                    <p className="text-sm text-muted-foreground">
                      Clique em "Sincronizar com Meta" ou crie um novo template
                    </p>
                  </CardContent>
                </Card>
              ) : (
                templates?.map((template) => {
                  const status = statusConfig[template.status] || statusConfig.PENDING;
                  const bodyComponent = (template.components as { type: string; text?: string }[])?.find(
                    (c) => c.type === "BODY"
                  );

                  return (
                    <Card key={template.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{template.template_name}</CardTitle>
                            <CardDescription>{template.category}</CardDescription>
                          </div>
                          <Badge variant={status.variant} className="flex items-center gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {bodyComponent?.text || "Sem conteúdo"}
                        </p>

                        {template.rejected_reason && (
                          <p className="text-xs text-destructive mb-4">
                            Motivo: {template.rejected_reason}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {template.language}
                          </span>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Template?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O template será removido
                                  permanentemente do WhatsApp Business.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(template.template_name)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
