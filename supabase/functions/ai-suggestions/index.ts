import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, action = "suggest" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || "";

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
