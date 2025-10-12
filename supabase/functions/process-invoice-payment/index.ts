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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      throw new Error("ID da fatura é obrigatório");
    }

    // Buscar fatura
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Fatura não encontrada");
    }

    if (invoice.status === "paid") {
      return new Response(
        JSON.stringify({ error: "Fatura já foi paga" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Buscar gateway de pagamento ativo do tenant
    const { data: gateway, error: gatewayError } = await supabaseClient
      .from("payment_gateways")
      .select("*")
      .eq("tenant_id", invoice.tenant_id)
      .eq("is_active", true)
      .single();

    if (gatewayError || !gateway) {
      throw new Error("Nenhum gateway de pagamento ativo encontrado");
    }

    console.log(`Processando pagamento para fatura ${invoiceId} usando ${gateway.gateway_name}`);

    // Aqui você implementaria a integração real com cada gateway
    // Por enquanto, vamos simular um pagamento bem-sucedido
    let paymentResult;
    
    switch (gateway.gateway_name.toLowerCase()) {
      case "mercadopago":
        paymentResult = await processMercadoPagoPayment(invoice, gateway);
        break;
      case "stripe":
        paymentResult = await processStripePayment(invoice, gateway);
        break;
      case "pagseguro":
        paymentResult = await processPagSeguroPayment(invoice, gateway);
        break;
      default:
        // Simular pagamento para desenvolvimento
        paymentResult = {
          success: true,
          transactionId: `sim_${Date.now()}`,
          message: "Pagamento simulado com sucesso",
        };
    }

    if (!paymentResult.success) {
      throw new Error(paymentResult.message || "Erro ao processar pagamento");
    }

    // Criar registro de pagamento
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        tenant_id: invoice.tenant_id,
        subscription_id: invoice.subscription_id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: "completed",
        payment_gateway: gateway.gateway_name,
        gateway_payment_id: paymentResult.transactionId,
        paid_at: new Date().toISOString(),
        gateway_response: paymentResult,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Erro ao criar pagamento:", paymentError);
      throw new Error("Erro ao registrar pagamento");
    }

    // Atualizar fatura
    const { error: updateError } = await supabaseClient
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_id: payment.id,
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Erro ao atualizar fatura:", updateError);
      throw new Error("Erro ao atualizar fatura");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pagamento processado com sucesso!",
        payment: payment,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

// Funções de integração com gateways (para implementar futuramente)
async function processMercadoPagoPayment(invoice: any, gateway: any) {
  // TODO: Implementar integração real com Mercado Pago
  console.log("Processando pagamento via Mercado Pago");
  return {
    success: true,
    transactionId: `mp_${Date.now()}`,
    message: "Pagamento Mercado Pago processado",
  };
}

async function processStripePayment(invoice: any, gateway: any) {
  // TODO: Implementar integração real com Stripe
  console.log("Processando pagamento via Stripe");
  return {
    success: true,
    transactionId: `stripe_${Date.now()}`,
    message: "Pagamento Stripe processado",
  };
}

async function processPagSeguroPayment(invoice: any, gateway: any) {
  // TODO: Implementar integração real com PagSeguro
  console.log("Processando pagamento via PagSeguro");
  return {
    success: true,
    transactionId: `ps_${Date.now()}`,
    message: "Pagamento PagSeguro processado",
  };
}