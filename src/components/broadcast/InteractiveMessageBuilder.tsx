import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MessageCircle, Link, Phone } from "lucide-react";

export interface InteractiveButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
  text: string;
  url?: string;
  phoneNumber?: string;
}

interface InteractiveMessageBuilderProps {
  buttons: InteractiveButton[];
  onChange: (buttons: InteractiveButton[]) => void;
  maxButtons?: number;
}

export function InteractiveMessageBuilder({ 
  buttons, 
  onChange, 
  maxButtons = 3 
}: InteractiveMessageBuilderProps) {
  const [newButtonType, setNewButtonType] = useState<InteractiveButton["type"]>("QUICK_REPLY");

  const addButton = () => {
    if (buttons.length >= maxButtons) return;
    
    const newButton: InteractiveButton = {
      type: newButtonType,
      text: "",
      url: newButtonType === "URL" ? "" : undefined,
      phoneNumber: newButtonType === "PHONE_NUMBER" ? "" : undefined,
    };
    
    onChange([...buttons, newButton]);
  };

  const updateButton = (index: number, updates: Partial<InteractiveButton>) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeButton = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index));
  };

  const getButtonIcon = (type: InteractiveButton["type"]) => {
    switch (type) {
      case "QUICK_REPLY":
        return <MessageCircle className="h-4 w-4" />;
      case "URL":
        return <Link className="h-4 w-4" />;
      case "PHONE_NUMBER":
        return <Phone className="h-4 w-4" />;
    }
  };

  const getButtonTypeLabel = (type: InteractiveButton["type"]) => {
    switch (type) {
      case "QUICK_REPLY":
        return "Resposta Rápida";
      case "URL":
        return "Link URL";
      case "PHONE_NUMBER":
        return "Telefone";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Botões Interativos
        </CardTitle>
        <CardDescription className="text-xs">
          Adicione até {maxButtons} botões de ação na mensagem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {buttons.map((button, index) => (
          <div 
            key={index} 
            className="border rounded-lg p-3 space-y-3 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getButtonIcon(button.type)}
                {getButtonTypeLabel(button.type)}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeButton(index)}
                className="h-8 w-8 p-0 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <Label className="text-xs">Texto do botão</Label>
              <Input
                value={button.text}
                onChange={(e) => updateButton(index, { text: e.target.value })}
                placeholder="Ex: Confirmar"
                maxLength={25}
                className="mt-1"
              />
            </div>

            {button.type === "URL" && (
              <div>
                <Label className="text-xs">URL</Label>
                <Input
                  value={button.url || ""}
                  onChange={(e) => updateButton(index, { url: e.target.value })}
                  placeholder="https://exemplo.com"
                  type="url"
                  className="mt-1"
                />
              </div>
            )}

            {button.type === "PHONE_NUMBER" && (
              <div>
                <Label className="text-xs">Número de Telefone</Label>
                <Input
                  value={button.phoneNumber || ""}
                  onChange={(e) => updateButton(index, { phoneNumber: e.target.value })}
                  placeholder="+5511999999999"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        ))}

        {buttons.length < maxButtons && (
          <div className="flex gap-2">
            <Select 
              value={newButtonType} 
              onValueChange={(v) => setNewButtonType(v as InteractiveButton["type"])}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="QUICK_REPLY">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Resposta Rápida
                  </div>
                </SelectItem>
                <SelectItem value="URL">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Link URL
                  </div>
                </SelectItem>
                <SelectItem value="PHONE_NUMBER">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={addButton}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        )}

        {buttons.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nenhum botão adicionado. Botões aparecem abaixo da mensagem.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
