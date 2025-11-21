import { Check, Globe } from 'lucide-react';

import { Button } from '@colanode/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import { useI18n, LanguageCode } from '@colanode/ui/contexts/i18n';

const languages: Array<{
  code: LanguageCode;
  name: string;
  nativeName: string;
}> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

export const LanguageSelector = () => {
  const { locale, setLocale, t } = useI18n();

  const currentLanguage = languages.find((lang) => lang.code === locale);

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex-1 space-y-2">
        <h3 className="font-semibold">{t('app.language')}</h3>
        <p className="text-sm text-muted-foreground">
          {currentLanguage?.nativeName || 'English'}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Globe className="size-4 shrink-0" />
            <span className="truncate">
              {currentLanguage?.nativeName || 'English'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => setLocale(language.code)}
              className="flex items-center justify-between"
            >
              <span>{language.nativeName}</span>
              {locale === language.code && (
                <Check className="size-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
