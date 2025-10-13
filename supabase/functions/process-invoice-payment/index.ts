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

    // Usar a função SQL para processar o pagamento
    const { data: result, error: processError } = await supabaseClient
      .rpc('process_invoice_payment', { invoice_id_param: invoiceId });

    if (processError) {
      console.error("Erro ao processar pagamento:", processError);
      throw new Error(processError.message || "Erro ao processar pagamento");
    }

    if (!result || !result.success) {
      throw new Error(result?.error || "Erro ao processar pagamento");
    }

    console.log(`Pagamento processado com sucesso para fatura ${invoiceId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: result.message || "Pagamento processado com sucesso!",
        new_expiry_date: result.new_expiry_date,
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
