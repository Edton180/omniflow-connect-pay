import { ptBR } from './pt-BR';
import { en } from './en';
import { es } from './es';
import { zhCN } from './zh-CN';
import { hi } from './hi';
import { ja } from './ja';

export type TranslationKeys = typeof ptBR;

export const translations: Record<string, TranslationKeys> = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
  'zh-CN': zhCN,
  'hi': hi,
  'ja': ja,
};

export { ptBR, en, es, zhCN, hi, ja };
