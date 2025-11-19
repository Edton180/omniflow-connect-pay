import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SecretUpdate {
  name: string;
  value: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar se usuário é super admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .single();

    if (!roles) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas super admins." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    console.log("📦 Body recebido:", JSON.stringify(body, null, 2));
    
    const { secrets }: { secrets: SecretUpdate[] } = body;

    if (!Array.isArray(secrets) || secrets.length === 0) {
      console.error("❌ Nenhum secret fornecido ou formato inválido");
      return new Response(
        JSON.stringify({ 
          error: "Nenhum secret fornecido para atualização",
          received: body
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`💾 Salvando ${secrets.length} secret(s) por usuário ${user.id}`);

    // Inserir ou atualizar cada secret (UPSERT)
    console.log("🔄 Iniciando UPSERT dos secrets...");
    const results = await Promise.all(
      secrets.map(async (secret, index) => {
        console.log(`  [${index + 1}/${secrets.length}] Processando secret: ${secret.name}`);
        
        try {
          const { data, error } = await supabase
            .from("system_secrets")
            .upsert({
              secret_name: secret.name,
              secret_value: secret.value,
              created_by: user.id,
              description: `Configurado via interface em ${new Date().toISOString()}`,
            }, {
              onConflict: "secret_name"
            })
            .select()
            .single();

          if (error) {
            console.error(`❌ Error saving secret ${secret.name}:`, error);
            return { name: secret.name, success: false, error: error.message };
          }

          console.log(`✅ Secret ${secret.name} salvo com sucesso (ID: ${data.id})`);
          return { name: secret.name, success: true };
        } catch (err: any) {
          console.error(`❌ Exception saving secret ${secret.name}:`, err);
          return { name: secret.name, success: false, error: err.message };
        }
      })
    );

    const failedUpdates = results.filter((r) => !r.success);
    if (failedUpdates.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Alguns secrets falharam ao atualizar",
          details: failedUpdates,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${secrets.length} secret(s) salvos com sucesso`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in save-system-secrets:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
