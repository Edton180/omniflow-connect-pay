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

    // Buscar todos os canais Telegram ativos
    const { data: channels } = await supabaseAdmin
      .from("channels")
      .select("id, tenant_id, config")
      .eq("type", "telegram")
      .eq("status", "active");

    if (!channels || channels.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum canal Telegram ativo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📡 Verificando status online de ${channels.length} canais Telegram`);

    for (const channel of channels) {
      const botToken = channel.config?.bot_token;
      
      if (!botToken) {
        console.log(`⚠️ Canal ${channel.id} sem bot token`);
        continue;
      }

      // Buscar contatos deste tenant com Telegram
      const { data: contacts } = await supabaseAdmin
        .from("contacts")
        .select("id, metadata")
        .eq("tenant_id", channel.tenant_id)
        .not("metadata->telegram_chat_id", "is", null);

      if (!contacts || contacts.length === 0) {
        console.log(`⚠️ Nenhum contato Telegram para tenant ${channel.tenant_id}`);
        continue;
      }

      console.log(`👥 Verificando ${contacts.length} contatos do tenant ${channel.tenant_id}`);

      // Verificar status de cada contato
      for (const contact of contacts) {
        const chatId = contact.metadata?.telegram_chat_id;
        
        if (!chatId) continue;

        try {
          // Buscar informações do chat via Telegram API
          const response = await fetch(
            `https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`,
            { method: "GET" }
          );

          const data = await response.json();

          if (data.ok && data.result) {
            const user = data.result;
            
            // Verificar última vez visto (se disponível)
            // Nota: A API do Telegram não fornece status online em tempo real via bot API
            // Então vamos atualizar baseado na última mensagem recebida
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const lastSeen = contact.metadata?.last_seen || null;
            
            const isOnline = lastSeen && new Date(lastSeen) > new Date(fiveMinutesAgo);
            
            // Atualizar contato
            await supabaseAdmin
              .from("contacts")
              .update({
                metadata: {
                  ...contact.metadata,
                  online: isOnline,
                  last_checked: new Date().toISOString(),
                  telegram_user_info: {
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    type: user.type,
                  },
                },
              })
              .eq("id", contact.id);

            console.log(`✅ Status atualizado para contato ${contact.id}: ${isOnline ? 'online' : 'offline'}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao verificar status do contato ${contact.id}:`, error);
        }

        // Pequeno delay para não sobrecarregar a API do Telegram
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Status verificado com sucesso",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erro ao verificar status online:", error);
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
