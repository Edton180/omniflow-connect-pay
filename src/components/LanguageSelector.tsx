import React from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LanguageSelectorProps {
  variant?: 'default' | 'ghost' | 'outline' | 'solid';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'ghost',
  size = 'default',
  showLabel = false,
  className,
}) => {
  const { language, setLanguage, availableLanguages } = useLanguage();

  // Variant "solid" for better visibility on gradient backgrounds
  const buttonVariant = variant === 'solid' ? 'default' : variant;
  const solidStyles = variant === 'solid' 
    ? 'bg-background/90 backdrop-blur-sm text-foreground hover:bg-background border border-border shadow-lg' 
    : '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={buttonVariant as any}
          size={size}
          className={cn(
            'gap-2 min-w-[120px]',
            solidStyles,
            className
          )}
        >
          <span className="text-lg">{language.flagEmoji}</span>
          <span className="text-sm font-medium">{language.code.toUpperCase()}</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-1">
            {availableLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang)}
                className={cn(
                  'flex items-center gap-3 cursor-pointer py-2.5 px-3 rounded-md',
                  language.code === lang.code && 'bg-primary/10 text-primary'
                )}
              >
                <span className="text-xl">{lang.flagEmoji}</span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium truncate">{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                </div>
                {language.code === lang.code && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
