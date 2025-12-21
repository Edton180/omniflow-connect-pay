import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalAIConfig {
  lovableAIEnabled: boolean;
  defaultModel: string;
  fallbackEnabled: boolean;
  fallbackModel: string;
  globalPersonality: string;
  defaultTone: string;
  maxTokens: number;
  temperature: number;
  rateLimitPerTenant: number;
  enableLogging: boolean;
}

const defaultConfig: GlobalAIConfig = {
  lovableAIEnabled: true,
  defaultModel: 'google/gemini-2.5-flash',
  fallbackEnabled: true,
  fallbackModel: 'openai/gpt-5-mini',
  globalPersonality: 'Você é um assistente virtual profissional e prestativo. Responda de forma clara e objetiva.',
  defaultTone: 'professional',
  maxTokens: 1000,
  temperature: 0.7,
  rateLimitPerTenant: 100,
  enableLogging: true,
};

export function useGlobalAIConfig() {
  const [config, setConfig] = useState<GlobalAIConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from('system_secrets')
        .select('*')
        .eq('secret_name', 'global_ai_config')
        .maybeSingle();

      if (data?.secret_value) {
        try {
          const savedConfig = JSON.parse(data.secret_value);
          setConfig({ ...defaultConfig, ...savedConfig });
        } catch (e) {
          console.error('Error parsing global AI config:', e);
        }
      }
    } catch (error) {
      console.error('Error loading global AI config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: GlobalAIConfig) => {
    try {
      const { data: existing } = await supabase
        .from('system_secrets')
        .select('id')
        .eq('secret_name', 'global_ai_config')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('system_secrets')
          .update({
            secret_value: JSON.stringify(newConfig),
            updated_at: new Date().toISOString(),
          })
          .eq('secret_name', 'global_ai_config');
      } else {
        await supabase
          .from('system_secrets')
          .insert({
            secret_name: 'global_ai_config',
            secret_value: JSON.stringify(newConfig),
          });
      }

      setConfig(newConfig);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return { config, loading, saveConfig, refetch: loadConfig };
}

export const availableModels = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", recommended: true, description: "Balanceado: custo e latência baixos, boa qualidade" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", recommended: false, description: "Top-tier: melhor para raciocínio complexo" },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google", recommended: false, description: "Mais rápido e barato, ideal para tarefas simples" },
  { id: "openai/gpt-5", name: "GPT-5", provider: "OpenAI", recommended: false, description: "Poderoso, excelente raciocínio, mais caro" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI", recommended: false, description: "Custo médio, mantém qualidade" },
  { id: "openai/gpt-5-nano", name: "GPT-5 Nano", provider: "OpenAI", recommended: false, description: "Mais rápido e econômico" },
];

export const toneOptions = [
  { value: "professional", label: "Profissional", description: "Tom formal e direto" },
  { value: "friendly", label: "Amigável", description: "Tom casual e acolhedor" },
  { value: "technical", label: "Técnico", description: "Tom preciso e detalhado" },
  { value: "empathetic", label: "Empático", description: "Tom compreensivo e paciente" },
];
