import { ptBR } from './pt-BR';
import { en } from './en';
import { es } from './es';
import { zhCN } from './zh-CN';
import { hi } from './hi';
import { ja } from './ja';
import { fr } from './fr';
import { de } from './de';
import { it } from './it';
import { ptPT } from './pt-PT';
import { ru } from './ru';
import { ko } from './ko';
import { ar } from './ar';
import { tr } from './tr';
import { nl } from './nl';
import { pl } from './pl';
import { sv } from './sv';
import { no } from './no';
import { da } from './da';
import { fi } from './fi';
import { cs } from './cs';
import { el } from './el';
import { he } from './he';
import { th } from './th';
import { vi } from './vi';
import { id } from './id';

export type TranslationKeys = typeof ptBR;

// Use double assertion to allow partial translations - missing keys will fallback to pt-BR
export const translations: Record<string, TranslationKeys> = {
  'pt-BR': ptBR,
  'en': en as unknown as TranslationKeys,
  'es': es as unknown as TranslationKeys,
  'zh-CN': zhCN as unknown as TranslationKeys,
  'hi': hi as unknown as TranslationKeys,
  'ja': ja as unknown as TranslationKeys,
  'fr': fr as unknown as TranslationKeys,
  'de': de as unknown as TranslationKeys,
  'it': it as unknown as TranslationKeys,
  'pt-PT': ptPT as unknown as TranslationKeys,
  'ru': ru as unknown as TranslationKeys,
  'ko': ko as unknown as TranslationKeys,
  'ar': ar as unknown as TranslationKeys,
  'tr': tr as unknown as TranslationKeys,
  'nl': nl as unknown as TranslationKeys,
  'pl': pl as unknown as TranslationKeys,
  'sv': sv as unknown as TranslationKeys,
  'no': no as unknown as TranslationKeys,
  'da': da as unknown as TranslationKeys,
  'fi': fi as unknown as TranslationKeys,
  'cs': cs as unknown as TranslationKeys,
  'el': el as unknown as TranslationKeys,
  'he': he as unknown as TranslationKeys,
  'th': th as unknown as TranslationKeys,
  'vi': vi as unknown as TranslationKeys,
  'id': id as unknown as TranslationKeys,
};

export { ptBR, en, es, zhCN, hi, ja, fr, de, it, ptPT, ru, ko, ar, tr, nl, pl, sv, no, da, fi, cs, el, he, th, vi, id };
