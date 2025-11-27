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
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autenticação necessária');
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { invoiceId, paymentId, gateway, gatewayPaymentId } = await req.json();

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

    console.log("Processando pagamento para fatura:", invoiceId);

    // Criar client admin para operações privilegiadas
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Usar a função SQL para processar o pagamento
    const { data: result, error: processError } = await supabaseAdmin
      .rpc('process_invoice_payment', { 
        p_invoice_id: invoiceId,
        p_payment_id: paymentId || null,
        p_gateway: gateway || null,
        p_gateway_payment_id: gatewayPaymentId || null,
      });

    if (processError) {
      console.error("Erro ao processar pagamento:", processError);
      throw new Error(processError.message || "Erro ao processar pagamento");
    }

    const resultData = typeof result === 'string' ? JSON.parse(result) : result;

    if (!resultData || !resultData.success) {
      throw new Error(resultData?.error || "Erro ao processar pagamento");
    }

    console.log(`Pagamento processado com sucesso para fatura ${invoiceId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: resultData.message || "Pagamento processado com sucesso!",
        new_expiry_date: resultData.new_expiry_date,
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
