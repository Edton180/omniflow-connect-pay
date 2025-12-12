import { useState, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, RefreshCw, Trash2, FileText, CheckCircle, XCircle, Clock, 
  AlertCircle, Copy, ExternalLink, Info, Send, Image, Video, 
  FileIcon, MessageSquare, Phone, Link, Eye
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

interface WABATemplate {
  id: string;
  template_id: string;
  template_name: string;
  language: string;
  category: string;
  status: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
    buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
    example?: { body_text?: string[][]; header_handle?: string[] };
  }>;
  rejected_reason?: string;
  channel_id: string;
  last_synced_at?: string;
  created_at?: string;
}

interface TemplateButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phoneNumber?: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  APPROVED: { label: "Aprovado", icon: <CheckCircle className="h-4 w-4" />, variant: "default" },
  PENDING: { label: "Pendente", icon: <Clock className="h-4 w-4" />, variant: "secondary" },
  REJECTED: { label: "Rejeitado", icon: <XCircle className="h-4 w-4" />, variant: "destructive" },
  DISABLED: { label: "Desativado", icon: <AlertCircle className="h-4 w-4" />, variant: "outline" },
};

const categoryLabels: Record<string, string> = {
  UTILITY: "Utilidade",
  MARKETING: "Marketing",
  AUTHENTICATION: "Autenticação",
};

const languageLabels: Record<string, string> = {
  pt_BR: "Português (Brasil)",
  pt_PT: "Português (Portugal)",
  en_US: "English (US)",
  en_GB: "English (UK)",
  es: "Español",
  es_AR: "Español (Argentina)",
  es_MX: "Español (México)",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};

export default function WhatsAppTemplates() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<WABATemplate | null>(null);
  
  // Form state
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("UTILITY");
  const [templateLanguage, setTemplateLanguage] = useState("pt_BR");
  const [headerType, setHeaderType] = useState<"none" | "text" | "image" | "video" | "document">("none");
  const [headerText, setHeaderText] = useState("");
  const [headerMediaUrl, setHeaderMediaUrl] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttons, setButtons] = useState<TemplateButton[]>([]);
  const [exampleVariables, setExampleVariables] = useState<Record<string, string>>({});

  // Extract variables from body text
  const bodyVariables = useMemo(() => {
    const matches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    return [...new Set(matches)].sort();
  }, [bodyText]);

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
      return data as unknown as WABATemplate[];
    },
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
      const components: any[] = [];

      // Header
      if (headerType !== "none") {
        if (headerType === "text" && headerText) {
          components.push({
            type: "HEADER",
            format: "TEXT",
            text: headerText,
          });
        } else if (headerType === "image") {
          components.push({
            type: "HEADER",
            format: "IMAGE",
            example: headerMediaUrl ? { header_handle: [headerMediaUrl] } : undefined,
          });
        } else if (headerType === "video") {
          components.push({
            type: "HEADER",
            format: "VIDEO",
            example: headerMediaUrl ? { header_handle: [headerMediaUrl] } : undefined,
          });
        } else if (headerType === "document") {
          components.push({
            type: "HEADER",
            format: "DOCUMENT",
            example: headerMediaUrl ? { header_handle: [headerMediaUrl] } : undefined,
          });
        }
      }

      // Body
      const bodyComponent: any = {
        type: "BODY",
        text: bodyText,
      };
      
      // Add examples for variables
      if (bodyVariables.length > 0) {
        const examples = bodyVariables.map(v => exampleVariables[v] || "exemplo");
        bodyComponent.example = { body_text: [examples] };
      }
      components.push(bodyComponent);

      // Footer
      if (footerText) {
        components.push({
          type: "FOOTER",
          text: footerText,
        });
      }

      // Buttons
      if (buttons.length > 0) {
        const buttonsComponent = {
          type: "BUTTONS",
          buttons: buttons.map(b => {
            if (b.type === "QUICK_REPLY") {
              return { type: "QUICK_REPLY", text: b.text };
            } else if (b.type === "URL") {
              return { type: "URL", text: b.text, url: b.url };
            } else {
              return { type: "PHONE_NUMBER", text: b.text, phone_number: b.phoneNumber };
            }
          }),
        };
        components.push(buttonsComponent);
      }

      const { data, error } = await supabase.functions.invoke("manage-waba-templates", {
        body: {
          action: "create",
          channelId: selectedChannel,
          templateData: {
            name: templateName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
            category: templateCategory,
            language: templateLanguage,
            components,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Template criado e enviado para aprovação da Meta (pode levar até 24h)");
      setIsCreateOpen(false);
      resetForm();
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

  const resetForm = () => {
    setTemplateName("");
    setTemplateCategory("UTILITY");
    setTemplateLanguage("pt_BR");
    setHeaderType("none");
    setHeaderText("");
    setHeaderMediaUrl("");
    setBodyText("");
    setFooterText("");
    setButtons([]);
    setExampleVariables({});
  };

  const addButton = (type: TemplateButton["type"]) => {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { type, text: "", url: "", phoneNumber: "" }]);
  };

  const updateButton = (index: number, updates: Partial<TemplateButton>) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], ...updates };
    setButtons(updated);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const copyTemplateName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success("Nome do template copiado!");
  };

  const getTemplateBody = (template: WABATemplate): string => {
    const body = template.components?.find(c => c.type === "BODY");
    return body?.text || "";
  };

  const getTemplateHeader = (template: WABATemplate) => {
    return template.components?.find(c => c.type === "HEADER");
  };

  const getTemplateFooter = (template: WABATemplate): string => {
    const footer = template.components?.find(c => c.type === "FOOTER");
    return footer?.text || "";
  };

  const getTemplateButtons = (template: WABATemplate) => {
    const buttons = template.components?.find(c => c.type === "BUTTONS");
    return buttons?.buttons || [];
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Templates WhatsApp</h1>
            <p className="text-muted-foreground">
              Gerencie templates de mensagens do WhatsApp Business API
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>O que são Templates do WhatsApp?</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Templates são mensagens pré-aprovadas pela Meta que permitem iniciar conversas 
              fora da janela de 24 horas. São essenciais para:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li><strong>Notificações de pedidos</strong> - Atualizações de status, confirmações</li>
              <li><strong>Lembretes de agendamento</strong> - Consultas, reuniões</li>
              <li><strong>Campanhas de marketing</strong> - Promoções, novidades (requer opt-in)</li>
              <li><strong>Autenticação</strong> - Códigos OTP, verificação</li>
            </ul>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Documentação Oficial
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://developers.facebook.com/docs/whatsapp/message-templates/guidelines" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Diretrizes de Aprovação
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Channel Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selecione o Canal</CardTitle>
            <CardDescription>
              Escolha um canal WhatsApp Business API para gerenciar templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingChannels ? (
              <Skeleton className="h-10 w-full" />
            ) : channels?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum canal WhatsApp configurado</p>
                <Button 
                  variant="link" 
                  onClick={() => navigate("/channels")}
                  className="mt-2"
                >
                  Configurar Canal
                </Button>
              </div>
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
            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Template</DialogTitle>
                  </DialogHeader>
                  
                  <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">Básico</TabsTrigger>
                      <TabsTrigger value="header">Header</TabsTrigger>
                      <TabsTrigger value="buttons">Botões</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    
                    <ScrollArea className="flex-1 mt-4">
                      <TabsContent value="basic" className="space-y-4 pr-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Nome do Template *</Label>
                            <Input
                              value={templateName}
                              onChange={(e) => setTemplateName(e.target.value)}
                              placeholder="ex: confirmacao_pedido"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Apenas letras minúsculas, números e underscores
                            </p>
                          </div>
                          <div>
                            <Label>Categoria *</Label>
                            <Select value={templateCategory} onValueChange={setTemplateCategory}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UTILITY">
                                  <div className="flex flex-col">
                                    <span>Utilidade</span>
                                    <span className="text-xs text-muted-foreground">Notificações, atualizações</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="MARKETING">
                                  <div className="flex flex-col">
                                    <span>Marketing</span>
                                    <span className="text-xs text-muted-foreground">Promoções (requer opt-in)</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="AUTHENTICATION">
                                  <div className="flex flex-col">
                                    <span>Autenticação</span>
                                    <span className="text-xs text-muted-foreground">Códigos OTP, verificação</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Idioma *</Label>
                          <Select value={templateLanguage} onValueChange={setTemplateLanguage}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(languageLabels).map(([code, label]) => (
                                <SelectItem key={code} value={code}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Corpo da Mensagem *</Label>
                          <Textarea
                            value={bodyText}
                            onChange={(e) => setBodyText(e.target.value)}
                            placeholder="Digite o corpo da mensagem. Use {{1}}, {{2}} para variáveis dinâmicas."
                            rows={5}
                            maxLength={1024}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{bodyText.length}/1024 caracteres</span>
                            {bodyVariables.length > 0 && (
                              <span>Variáveis detectadas: {bodyVariables.join(", ")}</span>
                            )}
                          </div>
                        </div>

                        {/* Example variables */}
                        {bodyVariables.length > 0 && (
                          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <Label className="text-sm font-medium">
                              Exemplos para Variáveis (obrigatório para aprovação)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              A Meta exige exemplos para aprovar templates com variáveis
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {bodyVariables.map((v) => (
                                <div key={v}>
                                  <Label className="text-xs">{v}</Label>
                                  <Input
                                    value={exampleVariables[v] || ""}
                                    onChange={(e) => setExampleVariables({ ...exampleVariables, [v]: e.target.value })}
                                    placeholder={`Ex: ${v === "{{1}}" ? "João" : "12345"}`}
                                    className="mt-1"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <Label>Rodapé (opcional)</Label>
                          <Input
                            value={footerText}
                            onChange={(e) => setFooterText(e.target.value)}
                            placeholder="Texto do rodapé"
                            maxLength={60}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Máximo 60 caracteres
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="header" className="space-y-4 pr-4">
                        <div>
                          <Label>Tipo de Header</Label>
                          <Select value={headerType} onValueChange={(v: any) => setHeaderType(v)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem Header</SelectItem>
                              <SelectItem value="text">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  Texto
                                </div>
                              </SelectItem>
                              <SelectItem value="image">
                                <div className="flex items-center gap-2">
                                  <Image className="h-4 w-4" />
                                  Imagem
                                </div>
                              </SelectItem>
                              <SelectItem value="video">
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4" />
                                  Vídeo
                                </div>
                              </SelectItem>
                              <SelectItem value="document">
                                <div className="flex items-center gap-2">
                                  <FileIcon className="h-4 w-4" />
                                  Documento
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {headerType === "text" && (
                          <div>
                            <Label>Texto do Header</Label>
                            <Input
                              value={headerText}
                              onChange={(e) => setHeaderText(e.target.value)}
                              placeholder="Título da mensagem"
                              maxLength={60}
                            />
                          </div>
                        )}

                        {(headerType === "image" || headerType === "video" || headerType === "document") && (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Mídia no Header</AlertTitle>
                            <AlertDescription>
                              <p className="text-sm">
                                Para templates com mídia, você precisará fornecer um exemplo de mídia 
                                durante a criação. A URL deve ser acessível publicamente.
                              </p>
                              <div className="mt-2">
                                <Label className="text-xs">URL de exemplo (opcional)</Label>
                                <Input
                                  value={headerMediaUrl}
                                  onChange={(e) => setHeaderMediaUrl(e.target.value)}
                                  placeholder="https://exemplo.com/imagem.jpg"
                                  className="mt-1"
                                />
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </TabsContent>

                      <TabsContent value="buttons" className="space-y-4 pr-4">
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Você pode adicionar até 3 botões. Botões aparecem abaixo da mensagem.
                          </AlertDescription>
                        </Alert>

                        {buttons.map((button, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary">
                                  {button.type === "QUICK_REPLY" && "Resposta Rápida"}
                                  {button.type === "URL" && "Link URL"}
                                  {button.type === "PHONE_NUMBER" && "Telefone"}
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeButton(index)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div>
                                <Label className="text-xs">Texto do Botão</Label>
                                <Input
                                  value={button.text}
                                  onChange={(e) => updateButton(index, { text: e.target.value })}
                                  placeholder="Ex: Confirmar"
                                  maxLength={25}
                                />
                              </div>

                              {button.type === "URL" && (
                                <div>
                                  <Label className="text-xs">URL</Label>
                                  <Input
                                    value={button.url}
                                    onChange={(e) => updateButton(index, { url: e.target.value })}
                                    placeholder="https://exemplo.com/{{1}}"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Use {"{{1}}"} para URL dinâmica
                                  </p>
                                </div>
                              )}

                              {button.type === "PHONE_NUMBER" && (
                                <div>
                                  <Label className="text-xs">Número de Telefone</Label>
                                  <Input
                                    value={button.phoneNumber}
                                    onChange={(e) => updateButton(index, { phoneNumber: e.target.value })}
                                    placeholder="+5511999999999"
                                  />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}

                        {buttons.length < 3 && (
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => addButton("QUICK_REPLY")} className="flex-1">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Resposta Rápida
                            </Button>
                            <Button variant="outline" onClick={() => addButton("URL")} className="flex-1">
                              <Link className="h-4 w-4 mr-2" />
                              Link
                            </Button>
                            <Button variant="outline" onClick={() => addButton("PHONE_NUMBER")} className="flex-1">
                              <Phone className="h-4 w-4 mr-2" />
                              Telefone
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="preview" className="pr-4">
                        <div className="flex justify-center">
                          <div className="w-80 bg-[#0b141a] rounded-2xl overflow-hidden shadow-xl">
                            {/* WhatsApp Header */}
                            <div className="bg-[#1f2c33] px-4 py-3 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">Sua Empresa</p>
                                <p className="text-gray-400 text-xs">Online</p>
                              </div>
                            </div>

                            {/* Chat area */}
                            <div className="p-4 min-h-[300px] bg-[url('/whatsapp-bg.png')] bg-cover">
                              <div className="bg-[#005c4b] rounded-lg p-3 max-w-[85%] ml-auto">
                                {/* Header */}
                                {headerType === "text" && headerText && (
                                  <p className="text-white font-bold text-sm mb-1">{headerText}</p>
                                )}
                                {headerType === "image" && (
                                  <div className="bg-gray-700/50 rounded h-32 mb-2 flex items-center justify-center">
                                    <Image className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                {headerType === "video" && (
                                  <div className="bg-gray-700/50 rounded h-32 mb-2 flex items-center justify-center">
                                    <Video className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                {headerType === "document" && (
                                  <div className="bg-gray-700/50 rounded h-12 mb-2 flex items-center justify-center gap-2">
                                    <FileIcon className="h-5 w-5 text-gray-400" />
                                    <span className="text-gray-400 text-sm">documento.pdf</span>
                                  </div>
                                )}

                                {/* Body */}
                                <p className="text-white text-sm whitespace-pre-wrap">
                                  {bodyText || "Sua mensagem aparecerá aqui..."}
                                </p>

                                {/* Footer */}
                                {footerText && (
                                  <p className="text-gray-300 text-xs mt-2">{footerText}</p>
                                )}

                                {/* Buttons */}
                                {buttons.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {buttons.map((b, i) => (
                                      <div 
                                        key={i}
                                        className="bg-[#00a884] text-white text-center py-2 rounded text-sm font-medium"
                                      >
                                        {b.text || `Botão ${i + 1}`}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <p className="text-gray-400 text-xs text-right mt-1">12:00</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => createMutation.mutate()}
                      disabled={!templateName || !bodyText || createMutation.isPending}
                      className="flex-1"
                    >
                      {createMutation.isPending ? "Criando..." : "Criar e Enviar para Aprovação"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                onClick={() => navigate("/broadcast")}
              >
                <Send className="mr-2 h-4 w-4" />
                Usar em Disparo
              </Button>
            </div>

            {/* Templates Grid */}
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
                  const bodyText = getTemplateBody(template);
                  const header = getTemplateHeader(template);
                  const footer = getTemplateFooter(template);
                  const templateButtons = getTemplateButtons(template);

                  return (
                    <Card key={template.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{template.template_name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {categoryLabels[template.category] || template.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {languageLabels[template.language] || template.language}
                              </span>
                            </div>
                          </div>
                          <Badge variant={status.variant} className="flex items-center gap-1 shrink-0">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Header indicator */}
                        {header && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {header.format === "IMAGE" && <Image className="h-3 w-3" />}
                            {header.format === "VIDEO" && <Video className="h-3 w-3" />}
                            {header.format === "DOCUMENT" && <FileIcon className="h-3 w-3" />}
                            {header.format === "TEXT" && <MessageSquare className="h-3 w-3" />}
                            <span>Header: {header.format?.toLowerCase() || "texto"}</span>
                          </div>
                        )}

                        {/* Body preview */}
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {bodyText || "Sem conteúdo"}
                        </p>

                        {/* Footer */}
                        {footer && (
                          <p className="text-xs text-muted-foreground italic truncate">
                            {footer}
                          </p>
                        )}

                        {/* Buttons indicator */}
                        {templateButtons.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {templateButtons.map((b: any, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {b.text}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {template.rejected_reason && (
                          <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              {template.rejected_reason}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyTemplateName(template.template_name)}
                              title="Copiar nome"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setPreviewTemplate(template)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {template.status === "APPROVED" && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => navigate("/broadcast")}
                                title="Usar em disparo"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

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

        {/* Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Preview: {previewTemplate?.template_name}</DialogTitle>
            </DialogHeader>
            {previewTemplate && (
              <div className="bg-[#0b141a] rounded-xl overflow-hidden">
                <div className="bg-[#1f2c33] px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-white text-sm">Preview</span>
                </div>
                <div className="p-4">
                  <div className="bg-[#005c4b] rounded-lg p-3 max-w-[85%] ml-auto">
                    {getTemplateHeader(previewTemplate)?.format === "TEXT" && (
                      <p className="text-white font-bold text-sm mb-1">
                        {getTemplateHeader(previewTemplate)?.text}
                      </p>
                    )}
                    <p className="text-white text-sm whitespace-pre-wrap">
                      {getTemplateBody(previewTemplate)}
                    </p>
                    {getTemplateFooter(previewTemplate) && (
                      <p className="text-gray-300 text-xs mt-2">
                        {getTemplateFooter(previewTemplate)}
                      </p>
                    )}
                    {getTemplateButtons(previewTemplate).length > 0 && (
                      <div className="mt-3 space-y-1">
                        {getTemplateButtons(previewTemplate).map((b: any, i: number) => (
                          <div 
                            key={i}
                            className="bg-[#00a884] text-white text-center py-2 rounded text-sm"
                          >
                            {b.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
