import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Buscar todos os secrets (sem expor valores completos, apenas indicar se estão configurados)
    const { data: secrets, error } = await supabase
      .from("system_secrets")
      .select("id, secret_name, description, created_at, updated_at")
      .order("secret_name");

    if (error) {
      console.error("Error fetching secrets:", error);
      throw error;
    }

    // Adicionar flag indicando se secret está configurado (tem valor não vazio)
    const secretsWithStatus = await Promise.all(
      secrets.map(async (secret) => {
        const { data: fullSecret } = await supabase
          .from("system_secrets")
          .select("secret_value")
          .eq("id", secret.id)
          .single();

        return {
          ...secret,
          is_configured: fullSecret?.secret_value !== "",
        };
      })
    );

    return new Response(JSON.stringify({ secrets: secretsWithStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in get-system-secrets:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
