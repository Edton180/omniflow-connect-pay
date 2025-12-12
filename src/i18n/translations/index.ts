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

export const translations: Record<string, TranslationKeys> = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
  'zh-CN': zhCN,
  'hi': hi,
  'ja': ja,
  'fr': fr,
  'de': de,
  'it': it,
  'pt-PT': ptPT,
  'ru': ru,
  'ko': ko,
  'ar': ar,
  'tr': tr,
  'nl': nl,
  'pl': pl,
  'sv': sv,
  'no': no,
  'da': da,
  'fi': fi,
  'cs': cs,
  'el': el,
  'he': he,
  'th': th,
  'vi': vi,
  'id': id,
};

export { ptBR, en, es, zhCN, hi, ja, fr, de, it, ptPT, ru, ko, ar, tr, nl, pl, sv, no, da, fi, cs, el, he, th, vi, id };
