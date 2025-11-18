import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gateway, credentials } = await req.json();

    console.log('Testing gateway:', gateway);

    let result;
    switch (gateway) {
      case 'asaas':
        result = await testAsaas(credentials);
        break;
      case 'stripe':
        result = await testStripe(credentials);
        break;
      case 'mercadopago':
        result = await testMercadoPago(credentials);
        break;
      case 'paypal':
        result = await testPayPal(credentials);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Gateway não suportado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Gateway test error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function testAsaas(credentials: any) {
  try {
    const apiKey = credentials.api_key;
    if (!apiKey) {
      return { success: false, message: 'API Key é obrigatória' };
    }

    // Test API connectivity by fetching account info
    const response = await fetch('https://api.asaas.com/v3/myAccount', {
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.errors?.[0]?.code === 'invalid_environment') {
        return {
          success: false,
          message: 'API Key inválida ou de ambiente incorreto (Sandbox vs Produção)',
          details: data.errors[0].description,
        };
      }
      return {
        success: false,
        message: 'Falha na autenticação',
        details: data.errors?.[0]?.description || 'Erro desconhecido',
      };
    }

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso',
      accountName: data.name,
      email: data.email,
      environment: apiKey.includes('sandbox') ? 'Sandbox' : 'Produção',
    };
  } catch (error: any) {
    return { success: false, message: `Erro ao conectar: ${error.message}` };
  }
}

async function testStripe(credentials: any) {
  try {
    const secretKey = credentials.secret_key;
    if (!secretKey) {
      return { success: false, message: 'Secret Key é obrigatória' };
    }

    // Test API connectivity by fetching account info
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Falha na autenticação',
        details: data.error?.message || 'Erro desconhecido',
      };
    }

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso',
      accountName: data.business_profile?.name || data.email,
      email: data.email,
      environment: secretKey.includes('_test_') ? 'Teste' : 'Produção',
    };
  } catch (error: any) {
    return { success: false, message: `Erro ao conectar: ${error.message}` };
  }
}

async function testMercadoPago(credentials: any) {
  try {
    const accessToken = credentials.access_token;
    if (!accessToken) {
      return { success: false, message: 'Access Token é obrigatório' };
    }

    // Test API connectivity by fetching user info
    const response = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: 'Falha na autenticação',
        details: data.message || 'Token inválido',
      };
    }

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso',
      accountName: `${data.first_name} ${data.last_name}`,
      email: data.email,
      userId: data.id,
    };
  } catch (error: any) {
    return { success: false, message: `Erro ao conectar: ${error.message}` };
  }
}

async function testPayPal(credentials: any) {
  try {
    const clientId = credentials.client_id;
    const clientSecret = credentials.client_secret;
    const mode = credentials.mode || 'sandbox';
    
    if (!clientId || !clientSecret) {
      return { success: false, message: 'Client ID e Client Secret são obrigatórios' };
    }

    const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    console.log('Testing PayPal connection:', { mode, baseUrl });

    // Encode credentials properly for Basic Auth
    const authString = `${clientId}:${clientSecret}`;
    const base64Auth = btoa(authString);

    console.log('Auth header created (length):', base64Auth.length);

    // Test API connectivity by getting access token
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64Auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: 'grant_type=client_credentials',
    });

    console.log('PayPal API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PayPal API error:', errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error_description: errorText };
      }
      
      return {
        success: false,
        message: 'Falha na autenticação',
        details: error.error_description || 'Verifique suas credenciais do PayPal. Certifique-se de usar as credenciais corretas para o ambiente selecionado (Sandbox/Live).',
      };
    }

    const data = await response.json();
    console.log('PayPal test successful');

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso',
      environment: mode === 'live' ? 'Produção' : 'Sandbox',
      tokenType: data.token_type,
    };
  } catch (error: any) {
    console.error('PayPal test error:', error);
    return { success: false, message: `Erro ao conectar: ${error.message}` };
  }
}
