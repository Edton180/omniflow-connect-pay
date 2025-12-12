import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, Check, AlertCircle, Search, 
  ChevronRight, MessageSquare, X 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    example?: { body_text?: string[][] };
  }>;
}

interface TemplateSelectorProps {
  channelId: string;
  onSelect: (template: WABATemplate, variables: Record<string, string>) => void;
  onCancel: () => void;
}

export function TemplateSelector({ channelId, onSelect, onCancel }: TemplateSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<WABATemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const { data: templates, isLoading } = useQuery({
    queryKey: ["waba-templates-approved", channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waba_templates")
        .select("*")
        .eq("channel_id", channelId)
        .eq("status", "APPROVED")
        .order("template_name");

      if (error) throw error;
      return data as unknown as WABATemplate[];
    },
    enabled: !!channelId,
  });

  const filteredTemplates = templates?.filter(t => 
    t.template_name.toLowerCase().includes(search.toLowerCase())
  );

  const getBodyText = (template: WABATemplate): string => {
    const bodyComponent = template.components?.find(c => c.type === "BODY");
    return bodyComponent?.text || "";
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\d+)\}\}/g) || [];
    return [...new Set(matches)].sort();
  };

  const handleSelectTemplate = (template: WABATemplate) => {
    setSelectedTemplate(template);
    const bodyText = getBodyText(template);
    const vars = extractVariables(bodyText);
    const initialVars: Record<string, string> = {};
    vars.forEach(v => {
      initialVars[v] = "";
    });
    setVariables(initialVars);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate, variables);
    }
  };

  const categoryLabels: Record<string, string> = {
    UTILITY: "Utilidade",
    MARKETING: "Marketing",
    AUTHENTICATION: "Autenticação",
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (selectedTemplate) {
    const bodyText = getBodyText(selectedTemplate);
    const vars = extractVariables(bodyText);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{selectedTemplate.template_name}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Preencha as variáveis do template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border">
            <p className="text-sm whitespace-pre-wrap">{bodyText}</p>
          </div>

          {vars.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Variáveis</Label>
              <p className="text-xs text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">{"{{nome}}"}</code> ou{" "}
                <code className="bg-muted px-1 rounded">{"{{telefone}}"}</code> para personalizar por contato
              </p>
              {vars.map((v) => (
                <div key={v}>
                  <Label className="text-xs">{v}</Label>
                  <Input
                    value={variables[v] || ""}
                    onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                    placeholder={`Valor para ${v} (ex: {{nome}})`}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedTemplate(null)} className="flex-1">
              Voltar
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Usar Template
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Templates Aprovados
        </CardTitle>
        <CardDescription>
          Selecione um template aprovado pela Meta para enviar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[300px]">
          {!filteredTemplates || filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm font-medium">Nenhum template aprovado</p>
              <p className="text-xs">Crie templates na página de Templates WhatsApp</p>
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm truncate">
                        {template.template_name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {getBodyText(template).slice(0, 60)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[template.category] || template.category}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancelar
        </Button>
      </CardContent>
    </Card>
  );
}
