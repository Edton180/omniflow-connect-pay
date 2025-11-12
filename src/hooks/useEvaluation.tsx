import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SendEvaluationParams {
  ticketId: string;
  channel: string;
  contactId: string;
  tenantId: string;
}

export function useEvaluation() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const sendEvaluation = async ({
    ticketId,
    channel,
    contactId,
    tenantId,
  }: SendEvaluationParams) => {
    setSending(true);
    
    try {
      // Verificar configurações de avaliação
      const { data: evalSettings, error: settingsError } = await supabase
        .from("evaluation_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (settingsError) {
        throw new Error(`Erro ao carregar configurações: ${settingsError.message}`);
      }

      if (!evalSettings || !evalSettings.enabled) {
        console.log("⚠️ Sistema de avaliação desabilitado");
        return {
          success: false,
          message: "Sistema de avaliação não está habilitado",
        };
      }

      // Buscar dados completos do ticket e contato
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq("id", ticketId)
        .single();

      if (ticketError || !ticket) {
        throw new Error(`Erro ao carregar ticket: ${ticketError?.message || "Ticket não encontrado"}`);
      }

      if (!ticket.contact) {
        throw new Error("Contato não encontrado no ticket");
      }

      // Determinar identificador do contato baseado no canal
      const contactMetadata = ticket.contact.metadata as any;
      const contactIdentifier = channel === "telegram" 
        ? (contactMetadata?.telegram_chat_id || ticket.contact.phone)
        : ticket.contact.phone;

      if (!contactIdentifier) {
        throw new Error(`Identificador do contato não encontrado para o canal ${channel}`);
      }

      console.log("📤 Enviando avaliação...", {
        ticketId,
        channel,
        contactId,
        contactIdentifier,
      });

      // Enviar avaliação
      const { data: response, error: sendError } = await supabase.functions.invoke(
        "send-evaluation",
        {
          body: {
            ticketId,
            channel,
            contactPhone: contactIdentifier,
            contactId,
          },
        }
      );

      if (sendError) {
        throw new Error(`Erro ao enviar avaliação: ${sendError.message}`);
      }

      if (response?.error) {
        throw new Error(response.error);
      }

      console.log("✅ Avaliação enviada com sucesso");

      toast({
        title: "Avaliação enviada ✓",
        description: "A solicitação de avaliação foi enviada ao cliente.",
      });

      return {
        success: true,
        message: "Avaliação enviada com sucesso",
        data: response,
      };
    } catch (error: any) {
      console.error("❌ Erro ao enviar avaliação:", error);
      
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message || "Ocorreu um erro ao enviar a avaliação",
        variant: "destructive",
      });

      return {
        success: false,
        message: error.message,
      };
    } finally {
      setSending(false);
    }
  };

  return {
    sendEvaluation,
    sending,
  };
}
