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

    // Test API connectivity by getting access token
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: 'Falha na autenticação',
        details: error.error_description || 'Client ID ou Client Secret inválidos',
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso',
      environment: mode === 'live' ? 'Produção' : 'Sandbox',
      tokenType: data.token_type,
    };
  } catch (error: any) {
    return { success: false, message: `Erro ao conectar: ${error.message}` };
  }
}
