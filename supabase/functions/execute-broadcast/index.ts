import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { campaignId, action } = await req.json();

    if (!campaignId) {
      throw new Error("campaignId é obrigatório");
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("broadcast_campaigns")
      .select("*, channel:channels(*)")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campanha não encontrada");
    }

    if (action === "start") {
      if (campaign.status !== "draft" && campaign.status !== "scheduled") {
        throw new Error("Campanha já foi iniciada ou concluída");
      }

      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id, phone, name, email")
        .eq("tenant_id", campaign.tenant_id);

      if (contactsError) throw contactsError;
      if (!contacts || contacts.length === 0) {
        throw new Error("Nenhum contato encontrado");
      }

      const recipients = contacts.map((contact) => ({
        campaign_id: campaignId,
        contact_id: contact.id,
        status: "pending",
      }));

      await supabase.from("broadcast_recipients").insert(recipients);

      await supabase
        .from("broadcast_campaigns")
        .update({
          status: "running",
          started_at: new Date().toISOString(),
          total_contacts: contacts.length,
        })
        .eq("id", campaignId);

      return new Response(
        JSON.stringify({ success: true, total: contacts.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "stats") {
      const { data: recipients } = await supabase
        .from("broadcast_recipients")
        .select("status")
        .eq("campaign_id", campaignId);

      const stats = {
        total: recipients?.length || 0,
        pending: recipients?.filter((r) => r.status === "pending").length || 0,
        sent: recipients?.filter((r) => r.status === "sent").length || 0,
        failed: recipients?.filter((r) => r.status === "failed").length || 0,
      };

      return new Response(JSON.stringify({ success: true, stats }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Ação desconhecida: ${action}`);
  } catch (error) {
    console.error("Erro no broadcast:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
