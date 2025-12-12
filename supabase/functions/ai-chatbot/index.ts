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

interface AIConfig {
  provider: string;
  api_key_encrypted: string;
  is_active: boolean;
}

async function callOpenAI(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGrok(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGemini(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\nMensagem do usuário: ${userMessage}` }]
      }]
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callLovableAI(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded");
    }
    if (response.status === 402) {
      throw new Error("Payment required - add credits to Lovable workspace");
    }
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Get knowledge base for context
async function getKnowledgeBase(supabaseAdmin: any, tenantId: string): Promise<string> {
  const { data: knowledge } = await supabaseAdmin
    .from("ai_knowledge_base")
    .select("title, question, answer, content, type")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .limit(10);

  if (!knowledge || knowledge.length === 0) return "";

  const formattedKnowledge = knowledge.map((item: any) => {
    if (item.type === "faq") {
      return `Q: ${item.question}\nA: ${item.answer}`;
    }
    return `${item.title || ""}: ${item.content || ""}`;
  }).join("\n\n");

  return `\n\nBase de Conhecimento:\n${formattedKnowledge}`;
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

    // Check if AI is active for this ticket
    if (ticketId) {
      const { data: aiSession } = await supabaseAdmin
        .from("ticket_ai_sessions")
        .select("is_ai_active")
        .eq("ticket_id", ticketId)
        .maybeSingle();

      if (aiSession && !aiSession.is_ai_active) {
        console.log("⏸️ IA pausada para este ticket, agente humano ativo");
        return new Response(JSON.stringify({
          shouldRespond: false,
          response: null,
          transferToAgent: false,
          intent: null,
          confidence: 0,
          reason: "human_takeover"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get chatbot settings
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

    // Check if channel is enabled
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

    // Get configured intents
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

    // Get AI configuration from tenant
    const { data: aiConfigs } = await supabaseAdmin
      .from("ai_configs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    // Determine which AI to use based on settings
    const aiProvider = settings.ai_provider || "lovable";
    let activeConfig: AIConfig | null = null;

    if (aiProvider !== "lovable") {
      activeConfig = aiConfigs?.find((c: AIConfig) => c.provider === aiProvider && c.is_active) || null;
    }

    // Prepare context for AI
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

    const userMessage = `Classifique esta mensagem: "${message}"`;

    console.log("🔄 Chamando IA para classificação...", { provider: aiProvider });

    let aiContent = "";

    try {
      if (activeConfig && aiProvider === "openai") {
        console.log("📡 Usando OpenAI");
        aiContent = await callOpenAI(activeConfig.api_key_encrypted, systemPrompt, userMessage);
      } else if (activeConfig && aiProvider === "xai") {
        console.log("📡 Usando xAI Grok");
        aiContent = await callGrok(activeConfig.api_key_encrypted, systemPrompt, userMessage);
      } else if (activeConfig && aiProvider === "google") {
        console.log("📡 Usando Google Gemini");
        aiContent = await callGemini(activeConfig.api_key_encrypted, systemPrompt, userMessage);
      } else {
        // Fallback to Lovable AI
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
        console.log("📡 Usando Lovable AI (fallback)");
        aiContent = await callLovableAI(LOVABLE_API_KEY, systemPrompt, userMessage);
      }
    } catch (aiError: any) {
      console.error("❌ Erro ao chamar IA:", aiError.message);
      
      // Try fallback to Lovable AI
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY && aiProvider !== "lovable") {
        console.log("🔄 Tentando fallback para Lovable AI...");
        try {
          aiContent = await callLovableAI(LOVABLE_API_KEY, systemPrompt, userMessage);
        } catch (fallbackError) {
          console.error("❌ Fallback também falhou:", fallbackError);
          return new Response(JSON.stringify({
            shouldRespond: true,
            response: settings.fallback_message,
            transferToAgent: true,
            intent: null,
            confidence: 0,
            error: "AI unavailable"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
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
    }

    console.log("📝 Resposta da IA:", aiContent);

    // Extract JSON from response
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

    // Check if intent was found with sufficient confidence
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

    // No intent found with sufficient confidence
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
