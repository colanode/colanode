import { Check, Globe } from 'lucide-react';
import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useI18n, LanguageCode } from '@colanode/ui/contexts/i18n';
import { cn } from '@colanode/ui/lib/utils';

const languages: Array<{
  code: LanguageCode;
  nativeName: string;
}> = [
  { code: 'en', nativeName: 'English' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'es', nativeName: 'Español' },
  { code: 'zh', nativeName: '中文' },
  { code: 'ar', nativeName: 'العربية' },
];

export const AppLanguageSection = () => {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">
        {t('app.language')}
      </h2>
      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl">
        {languages.map((lang) => {
          const isActive = locale === lang.code;

          return (
            <Button
              key={lang.code}
              variant="outline"
              onClick={() => setLocale(lang.code)}
              className={cn(
                'h-10 justify-start gap-3 relative',
                isActive && 'ring-1 ring-ring border-primary'
              )}
              title={lang.nativeName}
            >
              <Globe className="size-5" />
              {lang.nativeName}
              {isActive && (
                <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
