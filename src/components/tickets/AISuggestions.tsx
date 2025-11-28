import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AISuggestionsProps {
  messages: Array<{ role: string; content: string }>;
  onSelectSuggestion: (text: string) => void;
}

export function AISuggestions({ messages, onSelectSuggestion }: AISuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-suggestions", {
        body: { messages, action: "suggest" },
      });

      if (error) throw error;

      // Parse suggestions from the response
      const suggestionText = data.suggestion;
      const parsedSuggestions = suggestionText
        .split(/\n\d+\.\s+/)
        .filter((s: string) => s.trim())
        .slice(0, 3);

      setSuggestions(parsedSuggestions);
    } catch (error: any) {
      console.error("Error getting suggestions:", error);
      toast({
        title: "Erro ao obter sugestões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && suggestions.length === 0) {
      getSuggestions();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Sugestões IA
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Sugestões de Resposta
          </h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <Card
                  key={index}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    onSelectSuggestion(suggestion);
                    setIsOpen(false);
                  }}
                >
                  <p className="text-sm">{suggestion}</p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma sugestão disponível
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={getSuggestions}
            disabled={isLoading}
          >
            Gerar Novas Sugestões
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
