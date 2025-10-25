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

    const { action, channelId, tenantId, loginToken, botToken } = await req.json();

    console.log("📱 Ação de QR Login:", action);

    // Gerar novo QR code
    if (action === "generate") {
      if (!channelId || !tenantId) {
        return new Response(
          JSON.stringify({ error: "channelId e tenantId são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Gerar um token único para o QR code
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30000); // 30 segundos
      
      // Criar URL do QR code seguindo o padrão do Telegram
      const qrCodeUrl = `tg://login?token=${btoa(token)}`;

      // Salvar no banco de dados
      const { data, error } = await supabaseAdmin
        .from("telegram_qr_sessions")
        .insert({
          channel_id: channelId,
          tenant_id: tenantId,
          login_token: token,
          qr_code_url: qrCodeUrl,
          expires_at: expiresAt.toISOString(),
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao criar sessão de QR:", error);
        throw error;
      }

      console.log("✅ QR code gerado:", data.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          qrCodeUrl,
          sessionId: data.id,
          expiresAt: expiresAt.toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aceitar login (quando usuário escaneia QR)
    if (action === "accept") {
      if (!loginToken || !botToken) {
        return new Response(
          JSON.stringify({ error: "loginToken e botToken são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Buscar sessão pendente
      const { data: session, error: sessionError } = await supabaseAdmin
        .from("telegram_qr_sessions")
        .select("*")
        .eq("login_token", loginToken)
        .eq("status", "pending")
        .single();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ error: "Sessão não encontrada ou expirada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verificar se expirou
      if (new Date(session.expires_at) < new Date()) {
        await supabaseAdmin
          .from("telegram_qr_sessions")
          .update({ status: "expired" })
          .eq("id", session.id);

        return new Response(
          JSON.stringify({ error: "Sessão expirada" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Atualizar canal com o bot token
      const { error: updateError } = await supabaseAdmin
        .from("channels")
        .update({
          config: { bot_token: botToken },
          status: "active",
        })
        .eq("id", session.channel_id);

      if (updateError) {
        console.error("❌ Erro ao atualizar canal:", updateError);
        throw updateError;
      }

      // Atualizar sessão como aceita
      await supabaseAdmin
        .from("telegram_qr_sessions")
        .update({ 
          status: "accepted",
          bot_token: botToken
        })
        .eq("id", session.id);

      console.log("✅ Login aceito para canal:", session.channel_id);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Login realizado com sucesso"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar status do QR
    if (action === "check") {
      const { sessionId } = await req.json();

      const { data: session, error } = await supabaseAdmin
        .from("telegram_qr_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ error: "Sessão não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          status: session.status,
          expiresAt: session.expires_at
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro no QR login:", error);
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