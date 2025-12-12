import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, UserCheck, RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AITakeoverButtonProps {
  ticketId: string;
  tenantId: string;
  userId: string;
  onTakeoverChange?: (isAiActive: boolean) => void;
}

export function AITakeoverButton({ ticketId, tenantId, userId, onTakeoverChange }: AITakeoverButtonProps) {
  const [loading, setLoading] = useState(false);
  const [aiSession, setAiSession] = useState<any>(null);
  const [chatbotActive, setChatbotActive] = useState(false);

  useEffect(() => {
    loadSessionAndSettings();
  }, [ticketId, tenantId]);

  const loadSessionAndSettings = async () => {
    // Check if chatbot is active for this tenant
    const { data: settings } = await supabase
      .from("chatbot_settings")
      .select("is_active")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    setChatbotActive(settings?.is_active || false);

    // Check if there's an AI session for this ticket
    const { data: session } = await supabase
      .from("ticket_ai_sessions")
      .select("*")
      .eq("ticket_id", ticketId)
      .maybeSingle();

    setAiSession(session);
  };

  const handleTakeover = async () => {
    setLoading(true);
    try {
      if (aiSession) {
        // Update existing session
        const { error } = await supabase
          .from("ticket_ai_sessions")
          .update({
            is_ai_active: false,
            taken_over_by: userId,
            taken_over_at: new Date().toISOString(),
            reason: "Agente assumiu o atendimento"
          })
          .eq("id", aiSession.id);

        if (error) throw error;
      } else {
        // Create new session with AI disabled
        const { error } = await supabase
          .from("ticket_ai_sessions")
          .insert({
            ticket_id: ticketId,
            tenant_id: tenantId,
            is_ai_active: false,
            taken_over_by: userId,
            taken_over_at: new Date().toISOString(),
            reason: "Agente assumiu o atendimento"
          });

        if (error) throw error;
      }

      await loadSessionAndSettings();
      onTakeoverChange?.(false);
      toast.success("Você assumiu o atendimento. A IA não responderá mais neste ticket.");
    } catch (error: any) {
      console.error("Erro ao assumir atendimento:", error);
      toast.error("Erro ao assumir atendimento");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToAI = async () => {
    setLoading(true);
    try {
      if (aiSession) {
        const { error } = await supabase
          .from("ticket_ai_sessions")
          .update({
            is_ai_active: true,
            returned_to_ai_at: new Date().toISOString()
          })
          .eq("id", aiSession.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ticket_ai_sessions")
          .insert({
            ticket_id: ticketId,
            tenant_id: tenantId,
            is_ai_active: true
          });

        if (error) throw error;
      }

      await loadSessionAndSettings();
      onTakeoverChange?.(true);
      toast.success("Atendimento devolvido para a IA.");
    } catch (error: any) {
      console.error("Erro ao devolver para IA:", error);
      toast.error("Erro ao devolver para IA");
    } finally {
      setLoading(false);
    }
  };

  // Don't show if chatbot is not active
  if (!chatbotActive) return null;

  const isAiActive = !aiSession || aiSession.is_ai_active;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isAiActive ? "default" : "secondary"} className="gap-1">
        {isAiActive ? (
          <>
            <Bot className="h-3 w-3" />
            IA Ativa
          </>
        ) : (
          <>
            <UserCheck className="h-3 w-3" />
            Atendimento Humano
          </>
        )}
      </Badge>

      {isAiActive ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleTakeover}
          disabled={loading}
          title="Assumir atendimento e pausar IA"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-1" />
              Assumir
            </>
          )}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReturnToAI}
          disabled={loading}
          title="Devolver atendimento para IA"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-1" />
              Devolver para IA
            </>
          )}
        </Button>
      )}
    </div>
  );
}
