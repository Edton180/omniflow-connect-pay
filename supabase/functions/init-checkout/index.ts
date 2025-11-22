import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("❌ Erro ao fazer parse do body:", e);
      throw new Error("Requisição inválida: body JSON malformado");
    }

    const invoiceId = body.invoiceId || body.invoice_id;
    const preferredGateway = body.gateway; // Gateway preferido pelo usuário

    if (!invoiceId) {
      throw new Error("invoiceId é obrigatório");
    }

    // Validar formato do UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoiceId)) {
      throw new Error("invoiceId inválido (formato UUID esperado)");
    }

    console.log("Iniciando checkout para fatura:", invoiceId);
    if (preferredGateway) {
      console.log("Gateway preferido:", preferredGateway);
    }

    // Buscar fatura com dados do tenant
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select(`
        *,
        tenant:tenants(id, name, cnpj_cpf, whatsapp, address, city, state, zip_code, slug)
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError) {
      console.error("❌ Erro ao buscar fatura:", invoiceError);
      throw new Error("Fatura não encontrada: " + invoiceError.message);
    }

    if (!invoice) {
      throw new Error("Fatura não encontrada");
    }

    if (invoice.status === 'paid') {
      throw new Error("Esta fatura já foi paga");
    }

    console.log("Fatura encontrada:", invoice.id);
    console.log("  - Tenant:", invoice.tenant?.name);
    console.log("  - Valor:", invoice.amount, invoice.currency);
    console.log("  - Status:", invoice.status);

    // ULTRA CRITICAL: Buscar gateways GLOBAIS com múltiplas verificações
    console.log("🔍🔍🔍 [STEP 2] Iniciando busca de gateways...");
    console.log("  📋 Critérios:");
    console.log("    - is_active = true");
    console.log("    - tenant_id IS NULL (gateways globais)");
    console.log("  📝 Tenant da fatura:", invoice.tenant_id);
    
    // Primeira tentativa: buscar gateways globais ativos
    let gateways: any[] | null = null;
    let gatewayError: any = null;
    let count: number | null = null;

    const queryResult = await supabaseClient
      .from("payment_gateways")
      .select("*", { count: 'exact' })
      .eq("is_active", true)
      .is("tenant_id", null);

    gateways = queryResult.data;
    gatewayError = queryResult.error;
    count = queryResult.count;

    console.log("📊📊📊 [STEP 2] RESULTADO DA CONSULTA:");
    console.log("  🔢 Count total:", count);
    console.log("  📦 Registros retornados:", gateways?.length || 0);
    console.log("  ❗ Erro?:", gatewayError ? "SIM" : "NÃO");
    
    if (gatewayError) {
      console.error("❌❌❌ ERRO AO CONSULTAR:", JSON.stringify(gatewayError, null, 2));
    }

    // Se não encontrou, vamos fazer debug completo
    if (!gateways || gateways.length === 0) {
      console.log("⚠️⚠️⚠️ NENHUM GATEWAY GLOBAL ENCONTRADO!");
      console.log("🔎 Vamos fazer debug completo...");
      
      // Buscar TODOS os gateways para debug
      const { data: allGateways } = await supabaseClient
        .from("payment_gateways")
        .select("*");
      
      console.log("  📋 Total de gateways na tabela:", allGateways?.length || 0);
      
      if (allGateways && allGateways.length > 0) {
        allGateways.forEach((gw: any, idx: number) => {
          console.log(`  ${idx + 1}. ${gw.gateway_name}:`);
          console.log(`     - ID: ${gw.id}`);
          console.log(`     - is_active: ${gw.is_active}`);
          console.log(`     - tenant_id: ${gw.tenant_id}`);
          console.log(`     - config: ${JSON.stringify(gw.config || {})}`);
        });
      } else {
        console.log("  ⚠️ Nenhum gateway existe na tabela!");
      }
    } else {
      console.log("✅✅✅ Gateway(s) global(is) encontrado(s):");
      gateways.forEach((gw: any, idx: number) => {
        console.log(`  ${idx + 1}. ${gw.gateway_name}`);
        console.log(`     - ID: ${gw.id}`);
        console.log(`     - tenant_id: ${gw.tenant_id}`);
        console.log(`     - is_active: ${gw.is_active}`);
        console.log(`     - Config keys: ${Object.keys(gw.config || {}).join(', ')}`);
      });
    }
    
    if (gatewayError) {
      console.error("❌ [FATAL] Erro ao buscar gateways:", gatewayError);
      throw new Error("Erro crítico ao buscar gateways: " + gatewayError.message);
    }

    if (!gateways || gateways.length === 0) {
      console.error("❌❌❌ [FATAL] NENHUM GATEWAY CONFIGURADO");
      console.error("💡💡💡 COMO RESOLVER:");
      console.error("  1. Acesse Pagamentos como Super Admin");
      console.error("  2. Configure um gateway (Asaas, Stripe, Mercado Pago ou PayPal)");
      console.error("  3. Certifique-se que is_active = true");
      console.error("  4. Certifique-se que tenant_id = NULL (gateway global)");
      throw new Error("Nenhum gateway de pagamento ativo encontrado. Por favor, configure um gateway global no painel de Pagamentos.");
    }

    // Selecionar gateway - usar o preferido ou o primeiro disponível
    let gateway = gateways[0];
    
    if (preferredGateway) {
      const preferred = gateways.find(g => g.gateway_name === preferredGateway);
      if (preferred) {
        gateway = preferred;
        console.log("✅ Usando gateway preferido:", preferredGateway);
      } else {
        console.log("⚠️ Gateway preferido não encontrado, usando primeiro disponível");
      }
    }

    console.log("✅✅✅ [STEP 2] Gateway selecionado para uso:");
    console.log("  🏷️ Nome:", gateway.gateway_name);
    console.log("  🆔 ID:", gateway.id);
    console.log("  🏢 tenant_id:", gateway.tenant_id);
    console.log("  ⚙️ Config keys:", Object.keys(gateway.config || {}).join(', '));

    let checkoutUrl = "";
    let qrCode = "";
    let externalId = "";
    const gatewayName = gateway.gateway_name.toLowerCase();

    // Metadata comum para todos os gateways
    const metadata = {
      tenant_id: invoice.tenant_id,
      invoice_id: invoiceId,
      subscription_id: invoice.subscription_id,
    };

    // Lógica por gateway
    if (gatewayName === "asaas") {
      const apiKey = gateway.config?.api_key;
      const mode = gateway.config?.mode || 'production';
      
      if (!apiKey) {
        throw new Error("API Key do ASAAS não configurada");
      }

      // Determinar URL base conforme o modo
      const asaasBaseUrl = mode === 'sandbox' 
        ? 'https://sandbox.asaas.com/api/v3'
        : 'https://api.asaas.com/v3';
      
      console.log("Criando/buscando customer ASAAS...");
      console.log("  - Modo:", mode);
      console.log("  - Base URL:", asaasBaseUrl);

      // Buscar ou criar customer
      let customerId: string;
      const { data: existingCustomer } = await supabaseClient
        .from("gateway_customers")
        .select("gateway_customer_id")
        .eq("tenant_id", invoice.tenant_id)
        .eq("gateway", "asaas")
        .maybeSingle();

      if (existingCustomer?.gateway_customer_id) {
        customerId = existingCustomer.gateway_customer_id;
        console.log("  - Customer existente:", customerId);
      } else {
        // Criar customer no ASAAS
        console.log("  - Criando novo customer...");
        
        // Criar payload básico
        const customerPayload: any = {
          name: invoice.tenant?.name || 'Cliente OmniFlow',
          email: `${invoice.tenant?.slug || 'cliente'}@omniflow.app`,
        };
        
        // CRITICAL: Em modo SANDBOX, NUNCA adicionar CPF/CNPJ
        // Dados de teste podem causar erros de validação no ASAAS
        if (mode === 'sandbox') {
          console.log("  🧪 Modo SANDBOX: customer será criado SEM documento (recomendado para testes)");
        } else {
          // Em PRODUÇÃO, tentar adicionar CPF/CNPJ se válido
          const rawCpfCnpj = invoice.tenant?.cnpj_cpf?.replace(/\D/g, '');
          
          if (rawCpfCnpj && (rawCpfCnpj.length === 11 || rawCpfCnpj.length === 14)) {
            // Validação básica: não aceitar sequências de números iguais
            const isSequence = /^(\d)\1+$/.test(rawCpfCnpj);
            
            if (!isSequence) {
              customerPayload.cpfCnpj = rawCpfCnpj;
              console.log("  ✅ CPF/CNPJ adicionado (produção):", rawCpfCnpj.substring(0, 3) + '***');
            } else {
              console.log("  ⚠️ CPF/CNPJ é sequência inválida, criando sem documento");
            }
          } else {
            console.log("  ℹ️ CPF/CNPJ ausente ou inválido, criando customer sem documento");
          }
        }
        
        console.log("  - Payload do customer:", JSON.stringify(customerPayload, null, 2));
        
        const customerResponse = await fetch(`${asaasBaseUrl}/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": apiKey,
          },
          body: JSON.stringify(customerPayload),
        });

        console.log("  - Status da resposta:", customerResponse.status);

        if (!customerResponse.ok) {
          const errorText = await customerResponse.text();
          console.error("❌ Erro ao criar customer ASAAS:");
          console.error("  - Status:", customerResponse.status);
          console.error("  - Response:", errorText);
          
          let errorMessage = "Erro ao criar cliente no ASAAS";
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.errors && errorJson.errors.length > 0) {
              errorMessage = errorJson.errors.map((e: any) => e.description).join(", ");
            }
          } catch (e) {
            errorMessage = errorText;
          }
          
          throw new Error(errorMessage);
        }

        const customer = await customerResponse.json();
        customerId = customer.id;

        // Salvar mapeamento
        await supabaseClient.from("gateway_customers").insert({
          tenant_id: invoice.tenant_id,
          gateway: "asaas",
          gateway_customer_id: customerId,
          customer_data: customer,
        });
      }

      // Criar cobrança PIX
      const asaasResponse = await fetch(`${asaasBaseUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": apiKey,
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: "PIX",
          value: parseFloat(invoice.amount),
          dueDate: invoice.due_date.split("T")[0],
          description: invoice.description || `Fatura #${invoice.id.slice(0, 8)}`,
          externalReference: JSON.stringify(metadata),
        }),
      });

      console.log("  - Status da cobrança:", asaasResponse.status);

      if (!asaasResponse.ok) {
        const errorText = await asaasResponse.text();
        console.error("❌ Erro ao criar cobrança ASAAS:");
        console.error("  - Status:", asaasResponse.status);
        console.error("  - Response:", errorText);
        
        let errorMessage = "Erro ao criar cobrança no ASAAS";
        try {
          const errorObj = JSON.parse(errorText);
          
          // Mensagem específica para erro de ambiente
          if (errorObj.errors?.[0]?.code === "invalid_environment") {
            errorMessage = "API Key inválida ou de ambiente incorreto. Verifique se está usando a chave correta (Produção vs Sandbox).";
          } else if (errorObj.errors && errorObj.errors.length > 0) {
            errorMessage = errorObj.errors.map((e: any) => e.description || e.message).join(", ");
          }
        } catch (e) {
          errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const asaasData = await asaasResponse.json();
      externalId = asaasData.id;
      console.log("Cobrança ASAAS criada:", externalId);
      
      // Buscar QR Code PIX
      const qrResponse = await fetch(
        `${asaasBaseUrl}/payments/${externalId}/pixQrCode`,
        {
          headers: { "access_token": apiKey },
        }
      );

      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        qrCode = qrData.payload;
        checkoutUrl = qrData.encodedImage;
        console.log("QR Code PIX gerado");
      }

    } else if (gatewayName === "stripe") {
      const secretKey = gateway.api_key_encrypted || gateway.config?.secret_key;
      
      if (!secretKey) {
        throw new Error("Secret Key do Stripe não configurada");
      }

      console.log("Criando checkout session Stripe...");

      // Criar checkout session
      const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${secretKey}`,
        },
        body: new URLSearchParams({
          "payment_method_types[]": "card",
          "line_items[0][price_data][currency]": invoice.currency.toLowerCase(),
          "line_items[0][price_data][product_data][name]": invoice.description || "Fatura",
          "line_items[0][price_data][unit_amount]": Math.round(parseFloat(invoice.amount) * 100).toString(),
          "line_items[0][quantity]": "1",
          "mode": "payment",
          "success_url": `${Deno.env.get("SUPABASE_URL")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          "cancel_url": `${Deno.env.get("SUPABASE_URL")}/payment-cancel`,
          "metadata[tenant_id]": invoice.tenant_id,
          "metadata[invoice_id]": invoiceId,
          "metadata[subscription_id]": invoice.subscription_id || "",
        }),
      });

      if (!stripeResponse.ok) {
        const error = await stripeResponse.text();
        console.error("Erro Stripe:", error);
        throw new Error(`Erro ao criar checkout Stripe: ${error}`);
      }

      const stripeData = await stripeResponse.json();
      externalId = stripeData.id;
      checkoutUrl = stripeData.url;
      console.log("Checkout Stripe criado:", externalId);

    } else if (gatewayName === "mercadopago") {
      const accessToken = gateway.api_key_encrypted || gateway.config?.access_token;
      
      if (!accessToken) {
        throw new Error("Access Token do Mercado Pago não configurado");
      }

      console.log("Criando preferência Mercado Pago...");

      // Criar preferência de pagamento
      const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: [{
            title: invoice.description || `Fatura #${invoice.id.slice(0, 8)}`,
            quantity: 1,
            unit_price: parseFloat(invoice.amount),
            currency_id: invoice.currency,
          }],
          payer: {
            name: invoice.tenant.name,
            email: `${invoice.tenant.slug}@omniflow.app`,
          },
          back_urls: {
            success: `${Deno.env.get("SUPABASE_URL")}/payment-success`,
            failure: `${Deno.env.get("SUPABASE_URL")}/payment-cancel`,
            pending: `${Deno.env.get("SUPABASE_URL")}/payment-pending`,
          },
          auto_return: "approved",
          metadata: metadata,
        }),
      });

      if (!mpResponse.ok) {
        const error = await mpResponse.text();
        console.error("Erro Mercado Pago:", error);
        throw new Error(`Erro ao criar preferência Mercado Pago: ${error}`);
      }

      const mpData = await mpResponse.json();
      externalId = mpData.id;
      checkoutUrl = mpData.init_point;
      console.log("Preferência Mercado Pago criada:", externalId);

    } else if (gatewayName === "paypal") {
      const clientId = gateway.config?.client_id;
      const clientSecret = gateway.config?.client_secret;
      const mode = gateway.config?.mode || 'sandbox';
      
      console.log("💳 Iniciando checkout PayPal:");
      console.log("  - Mode:", mode);
      console.log("  - Client ID presente:", !!clientId);
      console.log("  - Client Secret presente:", !!clientSecret);
      
      if (!clientId || !clientSecret) {
        console.error("❌ Credenciais do PayPal não encontradas no config");
        throw new Error("Credenciais do PayPal não configuradas. Configure o gateway PayPal na página de Pagamentos.");
      }

      const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
      console.log("  - Base URL:", baseUrl);

      // Get access token
      console.log("🔐 Obtendo access token do PayPal...");
      const authString = `${clientId}:${clientSecret}`;
      // CRITICAL FIX: In Deno, we need to use proper base64 encoding
      // btoa() is browser-only, but in Deno edge functions it's available
      const base64Auth = btoa(authString);
      
      const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${base64Auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: "grant_type=client_credentials",
      });

      console.log("  - Auth response status:", authResponse.status);

      if (!authResponse.ok) {
        const error = await authResponse.text();
        console.error("❌ Erro ao autenticar no PayPal:", error);
        throw new Error(`Erro ao autenticar no PayPal: ${error}`);
      }

      const authData = await authResponse.json();
      const accessToken = authData.access_token;
      console.log("✅ Access token obtido com sucesso");

      // Create order
      console.log("📦 Criando pedido PayPal...");
      const ppResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: invoice.currency,
              value: parseFloat(invoice.amount).toFixed(2),
            },
            description: invoice.description || `Fatura #${invoice.id.slice(0, 8)}`,
            custom_id: JSON.stringify(metadata),
          }],
          application_context: {
            brand_name: invoice.tenant.name,
            landing_page: "BILLING",
            user_action: "PAY_NOW",
            return_url: `${Deno.env.get("SUPABASE_URL")}/payment-success`,
            cancel_url: `${Deno.env.get("SUPABASE_URL")}/payment-cancel`,
          },
        }),
      });

      console.log("  - Order response status:", ppResponse.status);

      if (!ppResponse.ok) {
        const error = await ppResponse.text();
        console.error("❌ Erro PayPal:", error);
        throw new Error(`Erro ao criar pedido PayPal: ${error}`);
      }

      const ppData = await ppResponse.json();
      externalId = ppData.id;
      checkoutUrl = ppData.links.find((link: any) => link.rel === 'approve')?.href || '';
      console.log("✅ Pedido PayPal criado:");
      console.log("  - Order ID:", externalId);
      console.log("  - Checkout URL:", checkoutUrl);

    } else {
      throw new Error(`Gateway ${gatewayName} não suportado`);
    }

    // Atualizar invoice com external_id
    const { error: updateError } = await supabaseClient
      .from("invoices")
      .update({
        metadata: {
          ...(invoice.metadata || {}),
          gateway_id: gateway.id,
          gateway_name: gatewayName,
          external_id: externalId,
        },
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Erro ao atualizar invoice:", updateError);
    }

    // Criar registro em checkout_sessions
    const { data: session, error: sessionError } = await supabaseClient
      .from("checkout_sessions")
      .insert({
        invoice_id: invoiceId,
        gateway: gatewayName,
        external_id: externalId,
        url: checkoutUrl,
        qr_code: qrCode,
        status: "pending",
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Erro ao criar checkout session:", sessionError);
    }

    console.log("Checkout criado com sucesso:", session?.id);

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: checkoutUrl,
        qr_code: qrCode,
        external_id: externalId,
        gateway: gatewayName,
        session_id: session?.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("❌❌❌ Error in init-checkout:", error);
    console.error("  - Message:", error.message);
    console.error("  - Stack:", error.stack);
    
    // Retornar mensagem de erro mais específica
    let errorMessage = error.message || "Erro desconhecido ao processar pagamento";
    
    // Se for um erro de rede ou timeout
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = "Erro de conexão com o gateway de pagamento. Tente novamente.";
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
