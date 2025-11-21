import { Check, Laptop, Moon, Sun } from 'lucide-react';

import { ThemeColor, ThemeMode } from '@colanode/client/types';
import { Button } from '@colanode/ui/components/ui/button';
import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useApp } from '@colanode/ui/contexts/app';
import { useI18n } from '@colanode/ui/contexts/i18n';
import { cn } from '@colanode/ui/lib/utils';

interface ThemeModeOption {
  key: string;
  value: ThemeMode | null;
  label: string;
  icon: typeof Laptop;
  title: string;
}

const getThemeModeOptions = (t: (key: string) => string): ThemeModeOption[] => [
  {
    key: 'system',
    value: null,
    label: t('appearance.system'),
    icon: Laptop,
    title: t('appearance.followSystem'),
  },
  {
    key: 'light',
    value: 'light',
    label: t('appearance.light'),
    icon: Sun,
    title: t('appearance.lightTheme'),
  },
  {
    key: 'dark',
    value: 'dark',
    label: t('appearance.dark'),
    icon: Moon,
    title: t('appearance.darkTheme'),
  },
];

const getThemeColorOptions = (t: (key: string) => string) => [
  {
    value: 'default',
    label: t('appearance.default'),
    color: 'oklch(0.205 0 0)',
  },
  {
    value: 'blue',
    label: t('appearance.blue'),
    color: 'oklch(0.623 0.214 259.815)',
  },
  {
    value: 'red',
    label: t('appearance.red'),
    color: 'oklch(0.637 0.237 25.331)',
  },
  {
    value: 'rose',
    label: t('appearance.rose'),
    color: 'oklch(0.645 0.246 16.439)',
  },
  {
    value: 'orange',
    label: t('appearance.orange'),
    color: 'oklch(0.705 0.213 47.604)',
  },
  {
    value: 'green',
    label: t('appearance.green'),
    color: 'oklch(0.723 0.219 149.579)',
  },
  {
    value: 'yellow',
    label: t('appearance.yellow'),
    color: 'oklch(0.795 0.184 86.047)',
  },
  {
    value: 'violet',
    label: t('appearance.violet'),
    color: 'oklch(0.606 0.25 292.717)',
  },
];

export const AppAppearanceSettings = () => {
  const { t, locale, setLocale } = useI18n();
  const app = useApp();
  const themeMode = app.getMetadata('theme.mode');
  const themeColor = app.getMetadata('theme.color');

  const themeModeOptions = getThemeModeOptions(t);
  const themeColorOptions = getThemeColorOptions(t);

  return (
    <Container>
      <ContainerBody className="max-w-4xl space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('common.appearance')}
          </h2>
          <Separator className="mt-3" />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {themeModeOptions.map((option) => {
            const isActive =
              option.value === null ? !themeMode : themeMode === option.value;
            const Icon = option.icon;

            return (
              <Button
                key={option.key}
                variant="outline"
                onClick={() => {
                  if (option.value === null) {
                    app.deleteMetadata('theme.mode');
                  } else {
                    app.setMetadata('theme.mode', option.value);
                  }
                }}
                className={cn(
                  'flex-1 min-w-fit justify-center gap-2 relative py-2 px-4',
                  isActive && 'ring-1 ring-ring border-primary'
                )}
                title={option.title}
              >
                <Icon className="size-5 shrink-0" />
                <span className="whitespace-nowrap">{option.label}</span>
                {isActive && (
                  <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
                )}
              </Button>
            );
          })}
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('misc.color')}
          </h2>
          <Separator className="mt-3" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
          {themeColorOptions.map((option) => {
            const isDefault = option.value === 'default';
            const isActive = isDefault
              ? !themeColor
              : themeColor === option.value;

            return (
              <Button
                key={option.value}
                variant="outline"
                onClick={() => {
                  if (isDefault) {
                    app.deleteMetadata('theme.color');
                  } else {
                    app.setMetadata('theme.color', option.value as ThemeColor);
                  }
                }}
                className={cn(
                  'justify-start gap-3 text-left relative py-2 px-3',
                  isActive && 'ring-1 ring-ring border-primary'
                )}
                title={option.label}
              >
                <div
                  className="size-5 rounded-full border border-border/50 shrink-0"
                  style={{ backgroundColor: option.color }}
                />
                <span className="truncate">{option.label}</span>
                {isActive && (
                  <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
                )}
              </Button>
            );
          })}
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('app.language')}
          </h2>
          <Separator className="mt-3" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl">
          <Button
            variant="outline"
            onClick={() => setLocale('en')}
            className={cn(
              'justify-center gap-2 relative py-2',
              locale === 'en' && 'ring-1 ring-ring border-primary'
            )}
          >
            <span className="truncate">English</span>
            {locale === 'en' && (
              <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocale('fr')}
            className={cn(
              'justify-center gap-2 relative py-2',
              locale === 'fr' && 'ring-1 ring-ring border-primary'
            )}
          >
            <span className="truncate">Français</span>
            {locale === 'fr' && (
              <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocale('de')}
            className={cn(
              'justify-center gap-2 relative py-2',
              locale === 'de' && 'ring-1 ring-ring border-primary'
            )}
          >
            <span className="truncate">Deutsch</span>
            {locale === 'de' && (
              <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocale('es')}
            className={cn(
              'justify-center gap-2 relative py-2',
              locale === 'es' && 'ring-1 ring-ring border-primary'
            )}
          >
            <span className="truncate">Español</span>
            {locale === 'es' && (
              <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocale('zh')}
            className={cn(
              'justify-center gap-2 relative py-2',
              locale === 'zh' && 'ring-1 ring-ring border-primary'
            )}
          >
            <span className="truncate">中文</span>
            {locale === 'zh' && (
              <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocale('ar')}
            className={cn(
              'justify-center gap-2 relative py-2',
              locale === 'ar' && 'ring-1 ring-ring border-primary'
            )}
          >
            <span className="truncate">العربية</span>
            {locale === 'ar' && (
              <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
            )}
          </Button>
        </div>
      </ContainerBody>
    </Container>
  );
};
