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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    console.log("🔄 Iniciando atualização de status online dos contatos");

    // Buscar todos os canais ativos
    const { data: channels, error: channelsError } = await supabaseAdmin
      .from("channels")
      .select("id, tenant_id, type, config")
      .eq("status", "active");

    if (channelsError) {
      console.error("❌ Erro ao buscar canais:", channelsError);
      throw channelsError;
    }

    if (!channels || channels.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum canal ativo encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📡 Processando ${channels.length} canais`);

    let updatedContacts = 0;

    for (const channel of channels) {
      const { tenant_id, type, config } = channel;
      
      // Buscar contatos deste tenant
      const { data: contacts, error: contactsError } = await supabaseAdmin
        .from("contacts")
        .select("id, metadata")
        .eq("tenant_id", tenant_id);

      if (contactsError) {
        console.error(`❌ Erro ao buscar contatos do tenant ${tenant_id}:`, contactsError);
        continue;
      }

      if (!contacts || contacts.length === 0) {
        continue;
      }

      // Atualizar status baseado na última atividade
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      for (const contact of contacts) {
        const lastSeen = contact.metadata?.last_seen;
        const currentOnlineStatus = contact.metadata?.online || false;
        
        // Determinar se está online (última atividade há menos de 5 minutos)
        const isOnline = lastSeen && new Date(lastSeen) > new Date(fiveMinutesAgo);

        // Atualizar apenas se o status mudou
        if (currentOnlineStatus !== isOnline) {
          const { error: updateError } = await supabaseAdmin
            .from("contacts")
            .update({
              metadata: {
                ...contact.metadata,
                online: isOnline,
                last_checked: new Date().toISOString(),
              },
            })
            .eq("id", contact.id);

          if (!updateError) {
            updatedContacts++;
            console.log(
              `✅ Contato ${contact.id}: ${isOnline ? "online" : "offline"}`
            );
          } else {
            console.error(
              `❌ Erro ao atualizar contato ${contact.id}:`,
              updateError
            );
          }
        }

        // Pequeno delay para não sobrecarregar o banco
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    console.log(`✅ Atualização concluída: ${updatedContacts} contatos atualizados`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Status online atualizado com sucesso",
        updatedContacts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erro ao atualizar status online:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
