export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  flagEmoji: string;
}

export const languages: Language[] = [
  {
    code: 'pt-BR',
    name: 'Portuguese',
    nativeName: 'Português (Brasil)',
    flag: '🇧🇷',
    flagEmoji: '🇧🇷',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    flagEmoji: '🇺🇸',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    flagEmoji: '🇪🇸',
  },
  {
    code: 'zh-CN',
    name: 'Chinese',
    nativeName: '中文 (简体)',
    flag: '🇨🇳',
    flagEmoji: '🇨🇳',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳',
    flagEmoji: '🇮🇳',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    flagEmoji: '🇯🇵',
  },
];

export const getLanguageByCode = (code: string): Language | undefined => {
  return languages.find(lang => lang.code === code || lang.code.startsWith(code.split('-')[0]));
};

export const getDefaultLanguage = (): Language => {
  return languages[0]; // pt-BR
};
