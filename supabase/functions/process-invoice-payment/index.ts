import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para validar UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== process-invoice-payment iniciado ===");
    
    const { invoiceId, paymentId, gateway, gatewayPaymentId, action } = await req.json();

    console.log("Dados recebidos:", { invoiceId, paymentId, gateway, action });

    if (!invoiceId) {
      throw new Error("ID da fatura é obrigatório");
    }

    // Validar UUIDs
    if (!isValidUUID(invoiceId)) {
      throw new Error('ID da fatura inválido');
    }

    if (paymentId && !isValidUUID(paymentId)) {
      throw new Error('ID do pagamento inválido');
    }

    // Criar client admin para operações privilegiadas (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verificar se a fatura existe
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*, tenants(name)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Fatura não encontrada:", invoiceError);
      throw new Error('Fatura não encontrada');
    }

    console.log("Fatura encontrada:", invoice.id, "Status:", invoice.status);

    // Se for rejeição
    if (action === 'reject') {
      console.log("Processando rejeição da fatura...");
      
      const { error: updateError } = await supabaseAdmin
        .from('invoices')
        .update({
          status: 'pending',
          proof_file_url: null,
          proof_submitted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error("Erro ao rejeitar:", updateError);
        throw new Error('Erro ao rejeitar pagamento: ' + updateError.message);
      }

      console.log("Fatura rejeitada com sucesso");

      return new Response(
        JSON.stringify({
          success: true,
          message: "Pagamento rejeitado com sucesso!",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Processar aprovação de pagamento
    console.log("Processando aprovação de pagamento para fatura:", invoiceId);

    // Atualizar a fatura como paga
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error("Erro ao atualizar fatura:", updateError);
      throw new Error('Erro ao aprovar pagamento: ' + updateError.message);
    }

    // Se a fatura tem uma subscription associada, atualizar a data de expiração
    let newExpiryDate = null;
    if (invoice.subscription_id) {
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('id', invoice.subscription_id)
        .single();

      if (subscription) {
        // Calcular nova data de expiração baseada no período do plano
        const billingPeriod = subscription.plans?.billing_period || 'monthly';
        const currentExpiry = subscription.expires_at ? new Date(subscription.expires_at) : new Date();
        
        if (billingPeriod === 'monthly') {
          currentExpiry.setMonth(currentExpiry.getMonth() + 1);
        } else if (billingPeriod === 'yearly') {
          currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
        } else if (billingPeriod === 'quarterly') {
          currentExpiry.setMonth(currentExpiry.getMonth() + 3);
        }

        newExpiryDate = currentExpiry.toISOString();

        // Atualizar subscription
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            expires_at: newExpiryDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoice.subscription_id);

        console.log("Subscription atualizada com nova expiração:", newExpiryDate);
      }
    }

    // Criar registro de pagamento se não existir
    if (!invoice.payment_id) {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          tenant_id: invoice.tenant_id,
          subscription_id: invoice.subscription_id,
          amount: invoice.amount,
          currency: invoice.currency || 'BRL',
          status: 'completed',
          payment_gateway: gateway || 'manual',
          gateway_payment_id: gatewayPaymentId || null,
          payment_method: 'manual_proof',
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!paymentError && payment) {
        await supabaseAdmin
          .from('invoices')
          .update({ payment_id: payment.id })
          .eq('id', invoiceId);
        
        console.log("Registro de pagamento criado:", payment.id);
      }
    }

    console.log(`Pagamento processado com sucesso para fatura ${invoiceId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pagamento aprovado com sucesso!",
        new_expiry_date: newExpiryDate,
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
