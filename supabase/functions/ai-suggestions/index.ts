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

interface AssistantSettings {
  suggestions_enabled: boolean;
  suggestions_tone: string;
  suggestions_count: number;
  auto_improve_enabled: boolean;
  auto_summary_enabled: boolean;
  auto_translate_enabled: boolean;
}

interface KnowledgeItem {
  type: string;
  title: string | null;
  question: string | null;
  answer: string | null;
  content: string | null;
  category: string | null;
}

// Função para obter configurações do assistente
async function getAssistantSettings(supabaseAdmin: any, tenantId: string): Promise<AssistantSettings> {
  try {
    const { data } = await supabaseAdmin
      .from("chatbot_settings")
      .select("suggestions_enabled, suggestions_tone, suggestions_count, auto_improve_enabled, auto_summary_enabled, auto_translate_enabled")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!data) {
      return {
        suggestions_enabled: true,
        suggestions_tone: "professional",
        suggestions_count: 3,
        auto_improve_enabled: true,
        auto_summary_enabled: true,
        auto_translate_enabled: false,
      };
    }

    return {
      suggestions_enabled: data.suggestions_enabled ?? true,
      suggestions_tone: data.suggestions_tone ?? "professional",
      suggestions_count: data.suggestions_count ?? 3,
      auto_improve_enabled: data.auto_improve_enabled ?? true,
      auto_summary_enabled: data.auto_summary_enabled ?? true,
      auto_translate_enabled: data.auto_translate_enabled ?? false,
    };
  } catch (error) {
    console.error("Error fetching assistant settings:", error);
    return {
      suggestions_enabled: true,
      suggestions_tone: "professional",
      suggestions_count: 3,
      auto_improve_enabled: true,
      auto_summary_enabled: true,
      auto_translate_enabled: false,
    };
  }
}

// Função para buscar base de conhecimento
async function getKnowledgeBase(supabaseAdmin: any, tenantId: string): Promise<string> {
  try {
    const { data: items } = await supabaseAdmin
      .from("ai_knowledge_base")
      .select("type, title, question, answer, content, category")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(50);

    if (!items || items.length === 0) return "";

    let knowledgeContext = "\n\n### BASE DE CONHECIMENTO DA EMPRESA ###\n";
    
    const faqs = items.filter((i: KnowledgeItem) => i.type === 'faq');
    const docs = items.filter((i: KnowledgeItem) => i.type === 'document');
    const examples = items.filter((i: KnowledgeItem) => i.type === 'example');
    const instructions = items.filter((i: KnowledgeItem) => i.type === 'instruction');

    if (instructions.length > 0) {
      knowledgeContext += "\n## INSTRUÇÕES PARA O ASSISTENTE:\n";
      instructions.forEach((item: KnowledgeItem) => {
        knowledgeContext += `- ${item.title}: ${item.content}\n`;
      });
    }

    if (faqs.length > 0) {
      knowledgeContext += "\n## PERGUNTAS FREQUENTES:\n";
      faqs.forEach((item: KnowledgeItem) => {
        knowledgeContext += `P: ${item.question}\nR: ${item.answer}\n\n`;
      });
    }

    if (docs.length > 0) {
      knowledgeContext += "\n## DOCUMENTOS E POLÍTICAS:\n";
      docs.forEach((item: KnowledgeItem) => {
        knowledgeContext += `### ${item.title}\n${item.content}\n\n`;
      });
    }

    if (examples.length > 0) {
      knowledgeContext += "\n## EXEMPLOS DE BOAS RESPOSTAS:\n";
      examples.forEach((item: KnowledgeItem) => {
        knowledgeContext += `### ${item.title}\n${item.content}\n\n`;
      });
    }

    return knowledgeContext;
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return "";
  }
}

// Função para obter instrução de tom
function getToneInstruction(tone: string): string {
  switch (tone) {
    case "formal":
      return "Use um tom formal e respeitoso, evitando gírias e expressões informais.";
    case "professional":
      return "Use um tom profissional mas acolhedor, equilibrando formalidade com empatia.";
    case "casual":
      return "Use um tom casual e amigável, sendo mais descontraído mantendo o profissionalismo.";
    case "technical":
      return "Use um tom técnico e preciso, focando em detalhes e termos específicos quando necessário.";
    default:
      return "Use um tom profissional e acolhedor.";
  }
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch assistant settings
    let assistantSettings: AssistantSettings = {
      suggestions_enabled: true,
      suggestions_tone: "professional",
      suggestions_count: 3,
      auto_improve_enabled: true,
      auto_summary_enabled: true,
      auto_translate_enabled: false,
    };

    if (tenantId) {
      assistantSettings = await getAssistantSettings(supabaseAdmin, tenantId);
      console.log(`⚙️ Assistant settings loaded: tone=${assistantSettings.suggestions_tone}, count=${assistantSettings.suggestions_count}`);
    }

    // Check if action is enabled
    if (action === "suggest" && !assistantSettings.suggestions_enabled) {
      return new Response(
        JSON.stringify({ error: "Sugestões IA desativadas", disabled: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (action === "improve" && !assistantSettings.auto_improve_enabled) {
      return new Response(
        JSON.stringify({ error: "Melhoria de texto desativada", disabled: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (action === "summarize" && !assistantSettings.auto_summary_enabled) {
      return new Response(
        JSON.stringify({ error: "Resumo automático desativado", disabled: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (action === "translate" && !assistantSettings.auto_translate_enabled) {
      return new Response(
        JSON.stringify({ error: "Tradução automática desativada", disabled: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch knowledge base for enhanced context
    let knowledgeContext = "";
    if (tenantId) {
      knowledgeContext = await getKnowledgeBase(supabaseAdmin, tenantId);
      console.log(`📚 Knowledge base loaded: ${knowledgeContext.length} chars`);
    }

    const toneInstruction = getToneInstruction(assistantSettings.suggestions_tone);
    let systemPrompt = "";
    let userPrompt = "";

    const baseContext = knowledgeContext 
      ? `Use as informações da base de conhecimento abaixo para responder de forma mais precisa e alinhada com a empresa:\n${knowledgeContext}\n\n` 
      : "";

    switch (action) {
      case "suggest":
        systemPrompt = `${baseContext}Você é um assistente de atendimento ao cliente. ${toneInstruction} Analise a conversa e sugira ${assistantSettings.suggestions_count} respostas úteis baseadas no contexto da empresa.`;
        userPrompt = `Baseado nesta conversa:\n\n${JSON.stringify(messages)}\n\nSugira ${assistantSettings.suggestions_count} respostas diretas e úteis. Retorne apenas as sugestões numeradas.`;
        break;
      case "improve":
        systemPrompt = `${baseContext}Você é um assistente de redação. ${toneInstruction} Melhore o texto mantendo o significado original, mas tornando-o mais claro e adequado.`;
        userPrompt = `Melhore este texto: "${messages[messages.length - 1]?.content || ""}"`;
        break;
      case "summarize":
        systemPrompt = `${baseContext}Você é um assistente de resumo. Crie um resumo conciso e claro da conversa.`;
        userPrompt = `Resuma esta conversa:\n\n${JSON.stringify(messages)}`;
        break;
      case "translate":
        systemPrompt = "Você é um tradutor profissional. Traduza o texto mantendo o tom e significado original.";
        userPrompt = `Traduza este texto para o português: "${messages[messages.length - 1]?.content || ""}"`;
        break;
      default:
        systemPrompt = `${baseContext}Você é um assistente útil. ${toneInstruction}`;
        userPrompt = messages[messages.length - 1]?.content || "";
    }

    // Try to get tenant AI config if tenantId provided
    let activeConfig: AIConfig | null = null;
    
    if (tenantId) {
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
