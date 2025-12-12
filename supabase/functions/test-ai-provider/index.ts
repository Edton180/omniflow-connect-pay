import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { provider, api_key, model, message } = body;

    console.log(`Testing AI provider. Provider: ${provider}, Model: ${model}`);

    let result;

    // Se model for fornecido, testar via Lovable AI Gateway
    if (model) {
      result = await testLovableAI(model, message || "Olá, este é um teste de conectividade.");
    } else if (provider && api_key) {
      // Testes com API keys específicas
      switch (provider) {
        case 'openai':
          result = await testOpenAI(api_key);
          break;
        case 'google':
          result = await testGoogleGemini(api_key);
          break;
        case 'xai':
          result = await testXAI(api_key);
          break;
        case 'lovable':
          result = await testLovableAI(model || 'google/gemini-2.5-flash', message || "Olá, este é um teste.");
          break;
        default:
          return new Response(
            JSON.stringify({ success: false, message: 'Provedor não suportado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    } else {
      // Default: testar Lovable AI
      result = await testLovableAI(model || 'google/gemini-2.5-flash', message || "Olá, teste de conectividade.");
    }

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error testing AI provider:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao testar conexão';
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function testLovableAI(model: string, message: string) {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return {
        success: false,
        message: 'LOVABLE_API_KEY não está configurada',
        provider: 'lovable'
      };
    }

    console.log(`Testing Lovable AI with model: ${model}`);
    const startTime = Date.now();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um assistente útil. Responda de forma breve." },
          { role: "user", content: message }
        ],
        max_tokens: 50,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        return {
          success: false,
          message: 'Rate limit excedido. Tente novamente em alguns segundos.',
          provider: 'lovable',
          responseTime
        };
      }
      
      if (response.status === 402) {
        return {
          success: false,
          message: 'Créditos insuficientes. Adicione créditos ao seu workspace.',
          provider: 'lovable',
          responseTime
        };
      }

      const errorMessage = errorData?.error?.message || `Erro HTTP ${response.status}`;
      console.error('Lovable AI error:', errorMessage);
      return {
        success: false,
        message: `Falha na conexão com Lovable AI: ${errorMessage}`,
        provider: 'lovable',
        responseTime
      };
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    console.log('Lovable AI test successful, response time:', responseTime, 'ms');

    return {
      success: true,
      message: 'Conexão com Lovable AI estabelecida com sucesso!',
      provider: 'lovable',
      model: model || 'google/gemini-2.5-flash',
      responseTime,
      aiResponse: aiResponse.substring(0, 100) + (aiResponse.length > 100 ? '...' : '')
    };
  } catch (error: unknown) {
    console.error('Lovable AI test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      message: `Erro ao conectar com Lovable AI: ${errorMessage}`,
      provider: 'lovable'
    };
  }
}

async function testOpenAI(apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Erro HTTP ${response.status}`;
      console.error('OpenAI error:', errorMessage);
      return {
        success: false,
        message: `Falha na autenticação OpenAI: ${errorMessage}`,
        provider: 'openai'
      };
    }

    const data = await response.json();
    const models = data.data?.slice(0, 5).map((m: { id: string }) => m.id) || [];
    
    console.log('OpenAI connection successful, models:', models);

    return {
      success: true,
      message: 'Conexão com OpenAI estabelecida com sucesso!',
      provider: 'openai',
      models,
      total_models: data.data?.length || 0
    };
  } catch (error: unknown) {
    console.error('OpenAI test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      message: `Erro ao conectar com OpenAI: ${errorMessage}`,
      provider: 'openai'
    };
  }
}

async function testGoogleGemini(apiKey: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Erro HTTP ${response.status}`;
      console.error('Google Gemini error:', errorMessage);
      return {
        success: false,
        message: `Falha na autenticação Google Gemini: ${errorMessage}`,
        provider: 'google'
      };
    }

    const data = await response.json();
    const models = data.models?.slice(0, 5).map((m: { name: string }) => m.name?.replace('models/', '') || m.name) || [];
    
    console.log('Google Gemini connection successful, models:', models);

    return {
      success: true,
      message: 'Conexão com Google Gemini estabelecida com sucesso!',
      provider: 'google',
      models,
      total_models: data.models?.length || 0
    };
  } catch (error: unknown) {
    console.error('Google Gemini test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      message: `Erro ao conectar com Google Gemini: ${errorMessage}`,
      provider: 'google'
    };
  }
}

async function testXAI(apiKey: string) {
  try {
    const response = await fetch('https://api.x.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Erro HTTP ${response.status}`;
      console.error('xAI error:', errorMessage);
      return {
        success: false,
        message: `Falha na autenticação xAI Grok: ${errorMessage}`,
        provider: 'xai'
      };
    }

    const data = await response.json();
    const models = data.data?.slice(0, 5).map((m: { id: string }) => m.id) || data.models?.slice(0, 5).map((m: { id: string }) => m.id) || [];
    
    console.log('xAI connection successful, models:', models);

    return {
      success: true,
      message: 'Conexão com xAI Grok estabelecida com sucesso!',
      provider: 'xai',
      models,
      total_models: data.data?.length || data.models?.length || 0
    };
  } catch (error: unknown) {
    console.error('xAI test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      message: `Erro ao conectar com xAI Grok: ${errorMessage}`,
      provider: 'xai'
    };
  }
}