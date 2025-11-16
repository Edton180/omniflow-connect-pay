import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("Iniciando verificação de faturas a vencer...");

    // Chamar a função do banco de dados que cria notificações para faturas a vencer
    const { error: notifyError } = await supabase.rpc('notify_due_invoices');
    
    if (notifyError) {
      console.error("Erro ao notificar faturas:", notifyError);
      throw notifyError;
    }

    console.log("Notificações de faturas criadas com sucesso");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificações processadas com sucesso",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Erro ao processar notificações:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao processar notificações",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
