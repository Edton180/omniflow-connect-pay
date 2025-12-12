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
    const { provider, api_key } = await req.json();

    if (!provider || !api_key) {
      return new Response(
        JSON.stringify({ success: false, message: 'Provider e API Key são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Testing connection for provider: ${provider}`);

    let result;

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
      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Provedor não suportado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
