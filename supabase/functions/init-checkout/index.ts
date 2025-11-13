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

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      throw new Error("invoiceId é obrigatório");
    }

    console.log("Iniciando checkout para fatura:", invoiceId);

    // Buscar fatura com dados do tenant
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select(`
        *,
        tenant:tenants(id, name, cnpj_cpf, whatsapp, address, city, state, zip_code)
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Fatura não encontrada");
    }

    console.log("Fatura encontrada:", invoice.id);

    // Buscar gateway ativo do tenant ou gateway global (tenant_id NULL)
    const { data: gateways, error: gatewayError } = await supabaseClient
      .from("payment_gateways")
      .select("*")
      .eq("is_active", true)
      .or(`tenant_id.eq.${invoice.tenant_id},tenant_id.is.null`)
      .order("tenant_id", { ascending: false }) // Prioriza tenant específico sobre global
      .limit(1);

    if (gatewayError || !gateways || gateways.length === 0) {
      console.error("Gateway error:", gatewayError);
      throw new Error("Nenhum gateway de pagamento ativo configurado. Configure um gateway de pagamento em /payments");
    }

    const gateway = gateways[0];

    console.log("Gateway encontrado:", gateway.gateway_name);

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
      const apiKey = gateway.api_key_encrypted || gateway.config?.api_key;
      
      if (!apiKey) {
        throw new Error("API Key do ASAAS não configurada");
      }

      console.log("Criando cobrança ASAAS...");

      // Criar cobrança ASAAS
      const asaasResponse = await fetch("https://www.asaas.com/api/v3/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": apiKey,
        },
        body: JSON.stringify({
          customer: invoice.tenant.cnpj_cpf || invoice.tenant.id,
          billingType: "PIX",
          value: parseFloat(invoice.amount),
          dueDate: invoice.due_date.split("T")[0],
          description: invoice.description || `Fatura #${invoice.id.slice(0, 8)}`,
          externalReference: JSON.stringify(metadata),
        }),
      });

      if (!asaasResponse.ok) {
        const error = await asaasResponse.text();
        console.error("Erro ASAAS:", error);
        throw new Error(`Erro ao criar cobrança ASAAS: ${error}`);
      }

      const asaasData = await asaasResponse.json();
      externalId = asaasData.id;
      console.log("Cobrança ASAAS criada:", externalId);
      
      // Buscar QR Code PIX
      const qrResponse = await fetch(
        `https://www.asaas.com/api/v3/payments/${externalId}/pixQrCode`,
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

    } else if (gatewayName === "infinitepay") {
      const apiKey = gateway.api_key_encrypted || gateway.config?.api_key;
      
      if (!apiKey) {
        throw new Error("API Key do InfinitePay não configurada");
      }

      console.log("Criando cobrança InfinitePay...");

      // Criar cobrança
      const ipResponse = await fetch("https://api.infinitepay.io/v1/charges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          amount: Math.round(parseFloat(invoice.amount) * 100),
          currency: invoice.currency,
          description: invoice.description || `Fatura #${invoice.id.slice(0, 8)}`,
          customer: {
            name: invoice.tenant.name,
            document: invoice.tenant.cnpj_cpf,
          },
          metadata: metadata,
        }),
      });

      if (!ipResponse.ok) {
        const error = await ipResponse.text();
        console.error("Erro InfinitePay:", error);
        throw new Error(`Erro ao criar cobrança InfinitePay: ${error}`);
      }

      const ipData = await ipResponse.json();
      externalId = ipData.id;
      checkoutUrl = ipData.checkout_url;
      qrCode = ipData.qr_code;
      console.log("Cobrança InfinitePay criada:", externalId);

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
    console.error("Error in init-checkout:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
