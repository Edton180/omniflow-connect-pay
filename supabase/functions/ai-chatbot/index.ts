import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatbotIntent {
  id: string;
  name: string;
  examples: string[];
  response: string | null;
  action: string;
  confidence_threshold: number;
}

interface ChatbotResponse {
  shouldRespond: boolean;
  response: string | null;
  transferToAgent: boolean;
  intent: string | null;
  confidence: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, tenantId, contactId, ticketId, channel } = await req.json();
    
    console.log("🤖 AI Chatbot processing:", { message, tenantId, channel });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Buscar configurações do chatbot
    const { data: settings } = await supabaseAdmin
      .from("chatbot_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!settings?.is_active) {
      console.log("⚠️ Chatbot não está ativo para este tenant");
      return new Response(JSON.stringify({
        shouldRespond: false,
        response: null,
        transferToAgent: true,
        intent: null,
        confidence: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se o canal está habilitado
    const enabledChannels = settings.enabled_channels || [];
    if (!enabledChannels.includes(channel)) {
      console.log("⚠️ Canal não habilitado para chatbot:", channel);
      return new Response(JSON.stringify({
        shouldRespond: false,
        response: null,
        transferToAgent: true,
        intent: null,
        confidence: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar intenções configuradas
    const { data: intents } = await supabaseAdmin
      .from("chatbot_intents")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    if (!intents || intents.length === 0) {
      console.log("⚠️ Nenhuma intenção configurada, transferindo para agente");
      return new Response(JSON.stringify({
        shouldRespond: true,
        response: settings.welcome_message,
        transferToAgent: true,
        intent: null,
        confidence: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chamar Lovable AI para classificar a intenção
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("❌ LOVABLE_API_KEY não configurada");
      return new Response(JSON.stringify({
        shouldRespond: true,
        response: settings.fallback_message,
        transferToAgent: true,
        intent: null,
        confidence: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Preparar contexto para a IA
    const intentContext = intents.map((i: ChatbotIntent) => ({
      name: i.name,
      examples: i.examples || []
    }));

    const systemPrompt = `Você é um classificador de intenções para um chatbot de atendimento.
Sua tarefa é analisar a mensagem do usuário e classificar em uma das intenções disponíveis.

Intenções disponíveis:
${JSON.stringify(intentContext, null, 2)}

Responda APENAS com um JSON no formato:
{
  "intent": "nome_da_intencao",
  "confidence": 0.0 a 1.0
}

Se a mensagem não se encaixar em nenhuma intenção, responda:
{
  "intent": null,
  "confidence": 0
}`;

    console.log("🔄 Chamando Lovable AI para classificação...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Classifique esta mensagem: "${message}"` }
        ],
        max_tokens: 200,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("❌ Erro da Lovable AI:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({
          shouldRespond: true,
          response: settings.fallback_message,
          transferToAgent: true,
          intent: null,
          confidence: 0,
          error: "Rate limit exceeded"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({
        shouldRespond: true,
        response: settings.fallback_message,
        transferToAgent: true,
        intent: null,
        confidence: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("📝 Resposta da IA:", aiContent);

    // Extrair JSON da resposta
    let classification = { intent: null as string | null, confidence: 0 };
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        classification = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("❌ Erro ao parsear resposta da IA:", e);
    }

    console.log("🎯 Classificação:", classification);

    // Verificar se encontrou uma intenção com confiança suficiente
    if (classification.intent && classification.confidence >= settings.default_confidence_threshold) {
      const matchedIntent = intents.find((i: ChatbotIntent) => i.name === classification.intent);
      
      if (matchedIntent) {
        console.log("✅ Intenção encontrada:", matchedIntent.name, "Ação:", matchedIntent.action);
        
        const shouldTransfer = matchedIntent.action === "transfer";
        
        return new Response(JSON.stringify({
          shouldRespond: true,
          response: shouldTransfer ? settings.transfer_message : matchedIntent.response,
          transferToAgent: shouldTransfer,
          intent: matchedIntent.name,
          confidence: classification.confidence
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Nenhuma intenção encontrada com confiança suficiente
    console.log("⚠️ Confiança baixa ou intenção não encontrada, usando fallback");
    
    return new Response(JSON.stringify({
      shouldRespond: true,
      response: settings.fallback_message,
      transferToAgent: true,
      intent: classification.intent,
      confidence: classification.confidence
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Erro no AI Chatbot:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      shouldRespond: false,
      transferToAgent: true
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
