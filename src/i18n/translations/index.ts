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

// Use type assertion to allow partial translations - missing keys will fallback to pt-BR
export const translations: Record<string, TranslationKeys> = {
  'pt-BR': ptBR,
  'en': en as TranslationKeys,
  'es': es as TranslationKeys,
  'zh-CN': zhCN as TranslationKeys,
  'hi': hi as TranslationKeys,
  'ja': ja as TranslationKeys,
  'fr': fr as TranslationKeys,
  'de': de as TranslationKeys,
  'it': it as TranslationKeys,
  'pt-PT': ptPT as TranslationKeys,
  'ru': ru as TranslationKeys,
  'ko': ko as TranslationKeys,
  'ar': ar as TranslationKeys,
  'tr': tr as TranslationKeys,
  'nl': nl as TranslationKeys,
  'pl': pl as TranslationKeys,
  'sv': sv as TranslationKeys,
  'no': no as TranslationKeys,
  'da': da as TranslationKeys,
  'fi': fi as TranslationKeys,
  'cs': cs as TranslationKeys,
  'el': el as TranslationKeys,
  'he': he as TranslationKeys,
  'th': th as TranslationKeys,
  'vi': vi as TranslationKeys,
  'id': id as TranslationKeys,
};

export { ptBR, en, es, zhCN, hi, ja, fr, de, it, ptPT, ru, ko, ar, tr, nl, pl, sv, no, da, fi, cs, el, he, th, vi, id };
