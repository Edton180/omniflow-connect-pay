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

    const { campaignId, action, batchSize = 50, delayMs = 1000 } = await req.json();

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

    console.log(`📢 Broadcast action: ${action} for campaign: ${campaignId}`);

    switch (action) {
      case "start": {
        if (campaign.status !== "draft" && campaign.status !== "scheduled") {
          throw new Error("Campanha já foi iniciada ou concluída");
        }

        // Get contacts based on filters
        let query = supabase
          .from("contacts")
          .select("id, phone, name, email, metadata")
          .eq("tenant_id", campaign.tenant_id);

        // Apply contact filters if present
        if (campaign.contact_filter && Object.keys(campaign.contact_filter).length > 0) {
          const filters = campaign.contact_filter as Record<string, any>;
          if (filters.tags && filters.tags.length > 0) {
            query = query.overlaps("tags", filters.tags);
          }
        }

        const { data: contacts, error: contactsError } = await query;

        if (contactsError) throw contactsError;
        if (!contacts || contacts.length === 0) {
          throw new Error("Nenhum contato encontrado");
        }

        // Create recipients
        const recipients = contacts.map((contact) => ({
          campaign_id: campaignId,
          contact_id: contact.id,
          status: "pending",
        }));

        await supabase.from("broadcast_recipients").insert(recipients);

        // Update campaign status
        await supabase
          .from("broadcast_campaigns")
          .update({
            status: "running",
            started_at: new Date().toISOString(),
            total_contacts: contacts.length,
          })
          .eq("id", campaignId);

        console.log(`✅ Campaign started with ${contacts.length} recipients`);

        return new Response(
          JSON.stringify({ success: true, total: contacts.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send": {
        if (campaign.status !== "running") {
          throw new Error("Campanha não está em execução");
        }

        // Get pending recipients
        const { data: pendingRecipients, error: recipientsError } = await supabase
          .from("broadcast_recipients")
          .select("*, contact:contacts(*)")
          .eq("campaign_id", campaignId)
          .eq("status", "pending")
          .limit(batchSize);

        if (recipientsError) throw recipientsError;

        if (!pendingRecipients || pendingRecipients.length === 0) {
          // No more pending, mark as completed
          await supabase
            .from("broadcast_campaigns")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", campaignId);

          return new Response(
            JSON.stringify({ success: true, completed: true, sent: 0 }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let sentCount = 0;
        let failedCount = 0;
        const channel = campaign.channel;

        for (const recipient of pendingRecipients) {
          const contact = recipient.contact;
          if (!contact) continue;

          try {
            // Personalize message
            let personalizedMessage = (campaign.message || "")
              .replace(/\{\{nome\}\}/g, contact.name || "")
              .replace(/\{\{telefone\}\}/g, contact.phone || "")
              .replace(/\{\{email\}\}/g, contact.email || "");

            let functionName = "";
            let body: Record<string, any> = {};

            if (channel?.type === "telegram") {
              const chatId = contact.metadata?.telegram_chat_id;
              if (!chatId) {
                throw new Error("Contato sem chat_id do Telegram");
              }

              functionName = campaign.media_url ? "send-telegram-media" : "send-telegram-message";
              body = {
                chatId: String(chatId),
                message: personalizedMessage,
                channelId: channel.id,
              };

              if (campaign.media_url) {
                body.mediaUrl = campaign.media_url;
                body.mediaType = campaign.media_type;
              }
            } else if (channel?.type === "whatsapp" || channel?.type === "waba") {
              if (!contact.phone) {
                throw new Error("Contato sem telefone");
              }

              functionName = "send-waba-message";
              body = {
                channelId: channel.id,
                to: contact.phone,
                message: personalizedMessage,
              };

              // If using template
              if (campaign.template_name) {
                body.type = "template";
                body.template = {
                  name: campaign.template_name,
                  language: { code: "pt_BR" },
                  components: campaign.template_params || [],
                };
              } else {
                body.type = "text";
              }

              if (campaign.media_url && !campaign.template_name) {
                body.mediaUrl = campaign.media_url;
                body.mediaType = campaign.media_type;
              }
            }

            if (functionName) {
              console.log(`📤 Sending to ${contact.name || contact.phone} via ${functionName}`);
              
              const { data, error } = await supabase.functions.invoke(functionName, { body });
              
              if (error) throw error;

              // Update recipient status
              await supabase
                .from("broadcast_recipients")
                .update({
                  status: "sent",
                  sent_at: new Date().toISOString(),
                  waba_message_id: data?.message_id || null,
                })
                .eq("id", recipient.id);

              sentCount++;
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, delayMs));

          } catch (err: any) {
            console.error(`❌ Error sending to ${contact.name}:`, err.message);
            
            await supabase
              .from("broadcast_recipients")
              .update({
                status: "failed",
                error_message: err.message?.slice(0, 255),
              })
              .eq("id", recipient.id);

            failedCount++;
          }
        }

        // Update campaign counts
        const { data: stats } = await supabase
          .from("broadcast_recipients")
          .select("status")
          .eq("campaign_id", campaignId);

        const sentTotal = stats?.filter(r => r.status === "sent").length || 0;
        const failedTotal = stats?.filter(r => r.status === "failed").length || 0;
        const pendingTotal = stats?.filter(r => r.status === "pending").length || 0;

        await supabase
          .from("broadcast_campaigns")
          .update({
            sent_count: sentTotal,
            failed_count: failedTotal,
            status: pendingTotal === 0 ? "completed" : "running",
            completed_at: pendingTotal === 0 ? new Date().toISOString() : null,
          })
          .eq("id", campaignId);

        console.log(`📊 Batch complete: ${sentCount} sent, ${failedCount} failed, ${pendingTotal} remaining`);

        return new Response(
          JSON.stringify({
            success: true,
            sent: sentCount,
            failed: failedCount,
            remaining: pendingTotal,
            completed: pendingTotal === 0,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "pause": {
        if (campaign.status !== "running") {
          throw new Error("Campanha não está em execução");
        }

        await supabase
          .from("broadcast_campaigns")
          .update({ status: "paused" })
          .eq("id", campaignId);

        console.log(`⏸️ Campaign paused`);

        return new Response(
          JSON.stringify({ success: true, status: "paused" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "resume": {
        if (campaign.status !== "paused") {
          throw new Error("Campanha não está pausada");
        }

        await supabase
          .from("broadcast_campaigns")
          .update({ status: "running" })
          .eq("id", campaignId);

        console.log(`▶️ Campaign resumed`);

        return new Response(
          JSON.stringify({ success: true, status: "running" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "retry_failed": {
        // Reset failed recipients to pending
        const { data: updated, error: updateError } = await supabase
          .from("broadcast_recipients")
          .update({
            status: "pending",
            error_message: null,
          })
          .eq("campaign_id", campaignId)
          .eq("status", "failed")
          .select();

        if (updateError) throw updateError;

        const retriedCount = updated?.length || 0;

        if (retriedCount > 0 && campaign.status === "completed") {
          await supabase
            .from("broadcast_campaigns")
            .update({ status: "running" })
            .eq("id", campaignId);
        }

        console.log(`🔄 ${retriedCount} failed recipients reset for retry`);

        return new Response(
          JSON.stringify({ success: true, retried: retriedCount }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "stats": {
        const { data: recipients } = await supabase
          .from("broadcast_recipients")
          .select("status, delivered_at, read_at")
          .eq("campaign_id", campaignId);

        const stats = {
          total: recipients?.length || 0,
          pending: recipients?.filter((r) => r.status === "pending").length || 0,
          sent: recipients?.filter((r) => r.status === "sent").length || 0,
          delivered: recipients?.filter((r) => r.delivered_at).length || 0,
          read: recipients?.filter((r) => r.read_at).length || 0,
          failed: recipients?.filter((r) => r.status === "failed").length || 0,
        };

        return new Response(
          JSON.stringify({ success: true, stats }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  } catch (error) {
    console.error("❌ Erro no broadcast:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
