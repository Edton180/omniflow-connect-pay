import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Busca um secret do sistema de forma segura
 * Primeiro tenta buscar do banco (system_secrets), se não encontrar, tenta das variáveis de ambiente
 */
export async function getSystemSecret(
  secretName: string,
  supabaseUrl?: string,
  supabaseServiceKey?: string
): Promise<string | null> {
  try {
    // Primeiro tenta buscar das variáveis de ambiente (fallback para compatibilidade)
    const envSecret = Deno.env.get(secretName);
    if (envSecret && envSecret.trim() !== "") {
      console.log(`Secret ${secretName} encontrado nas variáveis de ambiente`);
      return envSecret;
    }

    // Se não encontrou nas env vars, busca no banco
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log(
        `Secret ${secretName} não encontrado e não há credenciais do Supabase para buscar no banco`
      );
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase
      .from("system_secrets")
      .select("secret_value")
      .eq("secret_name", secretName)
      .single();

    if (error) {
      console.error(`Erro ao buscar secret ${secretName} no banco:`, error);
      return null;
    }

    if (!data || data.secret_value.trim() === "") {
      console.log(`Secret ${secretName} não configurado no banco`);
      return null;
    }

    console.log(`Secret ${secretName} encontrado no banco`);
    return data.secret_value;
  } catch (error) {
    console.error(`Erro ao buscar secret ${secretName}:`, error);
    return null;
  }
}
