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

    const { subscriptionId, dueDate, description } = await req.json();

    if (!subscriptionId) {
      throw new Error("ID da assinatura é obrigatório");
    }

    // Buscar assinatura e plano
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select(`
        *,
        plans:plan_id (
          name,
          price,
          currency,
          billing_period
        )
      `)
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      throw new Error("Assinatura não encontrada");
    }

    if (subscription.status !== "active") {
      throw new Error("Assinatura não está ativa");
    }

    // Calcular data de vencimento
    let invoiceDueDate = dueDate ? new Date(dueDate) : new Date();
    
    if (!dueDate) {
      // Se não foi fornecida data de vencimento, calcular baseado no período de cobrança
      const billingPeriod = subscription.plans.billing_period;
      if (billingPeriod === "monthly") {
        invoiceDueDate.setMonth(invoiceDueDate.getMonth() + 1);
      } else if (billingPeriod === "yearly") {
        invoiceDueDate.setFullYear(invoiceDueDate.getFullYear() + 1);
      }
    }

    // Criar fatura
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .insert({
        tenant_id: subscription.tenant_id,
        subscription_id: subscription.id,
        amount: subscription.plans.price,
        currency: subscription.plans.currency,
        status: "pending",
        due_date: invoiceDueDate.toISOString(),
        description: description || `Fatura - ${subscription.plans.name}`,
        metadata: {
          plan_name: subscription.plans.name,
          billing_period: subscription.plans.billing_period,
        },
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Erro ao criar fatura:", invoiceError);
      throw new Error("Erro ao gerar fatura");
    }

    console.log(`Fatura ${invoice.id} gerada com sucesso para assinatura ${subscriptionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        invoice: invoice,
        message: "Fatura gerada com sucesso",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro ao gerar fatura:", error);
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