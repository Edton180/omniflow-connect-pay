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

    const { invoice_id, gateway_name } = await req.json();

    if (!invoice_id || !gateway_name) {
      throw new Error("invoice_id e gateway_name são obrigatórios");
    }

    // Buscar fatura com dados do tenant
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select(`
        *,
        tenant:tenants(id, name, cnpj_cpf, whatsapp, address)
      `)
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Fatura não encontrada");
    }

    // Buscar gateway configurado
    const { data: gateway, error: gatewayError } = await supabaseClient
      .from("payment_gateways")
      .select("*")
      .eq("gateway_name", gateway_name)
      .eq("is_active", true)
      .maybeSingle();

    if (gatewayError || !gateway) {
      throw new Error(`Gateway ${gateway_name} não configurado ou inativo`);
    }

    let checkoutUrl = "";
    let qrCode = "";
    let externalId = "";

    // Lógica por gateway
    if (gateway_name === "asaas") {
      const apiKey = gateway.config?.api_key || gateway.api_key_encrypted;
      
      if (!apiKey) {
        throw new Error("API Key do ASAAS não configurada");
      }

      // Criar cobrança ASAAS
      const asaasResponse = await fetch("https://www.asaas.com/api/v3/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": apiKey,
        },
        body: JSON.stringify({
          customer: invoice.tenant.id,
          billingType: "PIX",
          value: parseFloat(invoice.amount),
          dueDate: invoice.due_date.split("T")[0],
          description: invoice.description || `Fatura #${invoice.id.slice(0, 8)}`,
          externalReference: invoice_id,
        }),
      });

      if (!asaasResponse.ok) {
        const error = await asaasResponse.text();
        throw new Error(`Erro ASAAS: ${error}`);
      }

      const asaasData = await asaasResponse.json();
      externalId = asaasData.id;
      
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
      }

    } else if (gateway_name === "stripe") {
      const secretKey = gateway.config?.secret_key || gateway.api_key_encrypted;
      
      if (!secretKey) {
        throw new Error("Secret Key do Stripe não configurada");
      }

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
          "metadata[invoice_id]": invoice_id,
        }),
      });

      if (!stripeResponse.ok) {
        const error = await stripeResponse.text();
        throw new Error(`Erro Stripe: ${error}`);
      }

      const stripeData = await stripeResponse.json();
      externalId = stripeData.id;
      checkoutUrl = stripeData.url;
    }

    // Atualizar invoice com external_id
    await supabaseClient
      .from("invoices")
      .update({
        metadata: {
          ...(invoice.metadata || {}),
          gateway_id: gateway.id,
          external_id: externalId,
        },
      })
      .eq("id", invoice_id);

    // Criar registro em checkout_sessions
    await supabaseClient
      .from("checkout_sessions")
      .insert({
        invoice_id,
        gateway: gateway_name,
        external_id: externalId,
        url: checkoutUrl,
        qr_code: qrCode,
        status: "pending",
      });

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: checkoutUrl,
        qr_code: qrCode,
        external_id: externalId,
        gateway: gateway_name,
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
