import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PrivateNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (isPrivate: boolean) => void;
  isLoading?: boolean;
}

export function PrivateNoteInput({
  value,
  onChange,
  onSend,
  isLoading,
}: PrivateNoteInputProps) {
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSend = () => {
    if (value.trim()) {
      onSend(isPrivate);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="private-mode"
            checked={isPrivate}
            onCheckedChange={setIsPrivate}
          />
          <Label htmlFor="private-mode" className="cursor-pointer">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Nota Privada
            </span>
          </Label>
        </div>
        {isPrivate && (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
            Apenas equipe pode ver
          </Badge>
        )}
      </div>

      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            isPrivate
              ? "Digite uma nota privada (apenas sua equipe verá)..."
              : "Digite sua mensagem..."
          }
          className={isPrivate ? "border-yellow-500/50 bg-yellow-500/5" : ""}
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {isPrivate ? "Adicionar Nota Privada" : "Enviar Mensagem"}
        </Button>
      </div>
    </div>
  );
}
