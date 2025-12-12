import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIConfig {
  provider: string;
  api_key_encrypted: string;
  is_active: boolean;
}

async function callOpenAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
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
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGrok(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
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
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`Grok error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
      }]
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callLovableAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded");
    }
    if (response.status === 402) {
      throw new Error("Payment required");
    }
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, action = "suggest", tenantId } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "suggest":
        systemPrompt = "Você é um assistente de atendimento ao cliente. Analise a conversa e sugira 3 respostas profissionais e úteis.";
        userPrompt = `Baseado nesta conversa:\n\n${JSON.stringify(messages)}\n\nSugira 3 respostas profissionais e diretas.`;
        break;
      case "improve":
        systemPrompt = "Você é um assistente de redação. Melhore o texto mantendo o significado original, mas tornando-o mais profissional e claro.";
        userPrompt = `Melhore este texto: "${messages[messages.length - 1]?.content || ""}"`;
        break;
      case "summarize":
        systemPrompt = "Você é um assistente de resumo. Crie um resumo conciso e claro da conversa.";
        userPrompt = `Resuma esta conversa:\n\n${JSON.stringify(messages)}`;
        break;
      case "translate":
        systemPrompt = "Você é um tradutor profissional. Traduza o texto mantendo o tom e significado original.";
        userPrompt = `Traduza este texto para o português: "${messages[messages.length - 1]?.content || ""}"`;
        break;
      default:
        systemPrompt = "Você é um assistente útil.";
        userPrompt = messages[messages.length - 1]?.content || "";
    }

    // Try to get tenant AI config if tenantId provided
    let activeConfig: AIConfig | null = null;
    
    if (tenantId) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { data: aiConfigs } = await supabaseAdmin
        .from("ai_configs")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      // Get chatbot settings for AI provider preference
      const { data: chatbotSettings } = await supabaseAdmin
        .from("chatbot_settings")
        .select("ai_provider")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      const aiProvider = chatbotSettings?.ai_provider || "lovable";

      if (aiProvider !== "lovable" && aiConfigs) {
        activeConfig = aiConfigs.find((c: AIConfig) => c.provider === aiProvider && c.is_active) || null;
      }
    }

    let suggestion = "";

    try {
      if (activeConfig) {
        console.log("📡 Usando IA configurada:", activeConfig.provider);
        
        if (activeConfig.provider === "openai") {
          suggestion = await callOpenAI(activeConfig.api_key_encrypted, systemPrompt, userPrompt);
        } else if (activeConfig.provider === "xai") {
          suggestion = await callGrok(activeConfig.api_key_encrypted, systemPrompt, userPrompt);
        } else if (activeConfig.provider === "google") {
          suggestion = await callGemini(activeConfig.api_key_encrypted, systemPrompt, userPrompt);
        }
      }

      // Fallback to Lovable AI
      if (!suggestion) {
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
          throw new Error("LOVABLE_API_KEY is not configured");
        }
        console.log("📡 Usando Lovable AI");
        suggestion = await callLovableAI(LOVABLE_API_KEY, systemPrompt, userPrompt);
      }
    } catch (aiError: any) {
      console.error("❌ Erro na IA primária:", aiError.message);
      
      // Try Lovable AI as fallback
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        console.log("🔄 Tentando Lovable AI como fallback...");
        try {
          suggestion = await callLovableAI(LOVABLE_API_KEY, systemPrompt, userPrompt);
        } catch (fallbackError: any) {
          if (fallbackError.message === "Rate limit exceeded") {
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (fallbackError.message === "Payment required") {
            return new Response(
              JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw fallbackError;
        }
      } else {
        throw aiError;
      }
    }

    return new Response(JSON.stringify({ suggestion, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-suggestions function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
