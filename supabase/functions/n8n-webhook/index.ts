import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event, data, tenant_id } = await req.json();
    console.log(`N8N Webhook: ${event}`, data);

    switch (event) {
      case "create_ticket": {
        const { contact_id, channel, message, priority } = data;
        if (!contact_id || !channel) throw new Error("contact_id e channel obrigatórios");

        const { data: ticket, error } = await supabase
          .from("tickets")
          .insert({ tenant_id, contact_id, channel, status: "open", priority: priority || "medium", last_message: message })
          .select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, ticket }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_message": {
        const { ticket_id, content, sender_id } = data;
        if (!ticket_id || !content) throw new Error("ticket_id e content obrigatórios");

        const { data: message, error } = await supabase
          .from("messages")
          .insert({ ticket_id, content, sender_id, is_from_contact: false })
          .select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "webhook_test":
        return new Response(JSON.stringify({ success: true, message: "N8N conectado!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        throw new Error(`Evento desconhecido: ${event}`);
    }
  } catch (error) {
    console.error("Erro N8N:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
