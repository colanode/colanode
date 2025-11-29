import { Check, Laptop, Moon, Sun } from 'lucide-react';

import { ThemeColor, ThemeMode } from '@colanode/client/types';
import { AppAppearanceBreadcrumb } from '@colanode/ui/components/app/app-appearance-breadcrumb';
import { Container } from '@colanode/ui/components/layouts/containers/container';
import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';
import { cn } from '@colanode/ui/lib/utils';
import { AppLanguageSection } from './app-language-section';

interface ThemeModeOption {
  key: string;
  value: ThemeMode | null;
  labelKey: string;
  icon: typeof Laptop;
  titleKey: string;
}

const themeModeOptions: ThemeModeOption[] = [
  {
    key: 'system',
    value: null,
    labelKey: 'appearance.system',
    icon: Laptop,
    titleKey: 'appearance.followSystem',
  },
  {
    key: 'light',
    value: 'light',
    labelKey: 'appearance.light',
    icon: Sun,
    titleKey: 'appearance.lightTheme',
  },
  {
    key: 'dark',
    value: 'dark',
    labelKey: 'appearance.dark',
    icon: Moon,
    titleKey: 'appearance.darkTheme',
  },
];

const themeColorOptions = [
  {
    value: 'default',
    labelKey: 'appearance.default',
    color: 'oklch(0.205 0 0)',
  },
  {
    value: 'blue',
    labelKey: 'appearance.blue',
    color: 'oklch(0.623 0.214 259.815)',
  },
  {
    value: 'red',
    labelKey: 'appearance.red',
    color: 'oklch(0.637 0.237 25.331)',
  },
  {
    value: 'rose',
    labelKey: 'appearance.rose',
    color: 'oklch(0.645 0.246 16.439)',
  },
  {
    value: 'orange',
    labelKey: 'appearance.orange',
    color: 'oklch(0.705 0.213 47.604)',
  },
  {
    value: 'green',
    labelKey: 'appearance.green',
    color: 'oklch(0.723 0.219 149.579)',
  },
  {
    value: 'yellow',
    labelKey: 'appearance.yellow',
    color: 'oklch(0.795 0.184 86.047)',
  },
  {
    value: 'violet',
    labelKey: 'appearance.violet',
    color: 'oklch(0.606 0.25 292.717)',
  },
];

export const AppAppearanceContainer = () => {
  const { t } = useI18n();
  const [themeMode, setThemeMode] = useMetadata('app', 'theme.mode');
  const [themeColor, setThemeColor] = useMetadata('app', 'theme.color');

  return (
    <Container type="full" breadcrumb={<AppAppearanceBreadcrumb />}>
      <div className="max-w-4xl space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('common.appearance')}
          </h2>
          <Separator className="mt-3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {themeModeOptions.map((option) => {
            const isActive =
              option.value === null ? !themeMode : themeMode === option.value;
            const Icon = option.icon;

            return (
              <Button
                key={option.key}
                variant="outline"
                onClick={() => {
                  setThemeMode(option.value ?? undefined);
                }}
                className={cn(
                  'h-10 w-full justify-start gap-2 relative',
                  isActive && 'ring-1 ring-ring border-primary'
                )}
                title={t(option.titleKey)}
              >
                <Icon className="size-5" />
                {t(option.labelKey)}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 max-w-2xl">
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
                    setThemeColor(undefined);
                  } else {
                    setThemeColor(option.value as ThemeColor);
                  }
                }}
                className={cn(
                  'h-10 justify-start gap-3 text-left relative',
                  isActive && 'ring-1 ring-ring border-primary'
                )}
                title={t(option.labelKey)}
              >
                <div
                  className="size-5 rounded-full border border-border/50 shrink-0"
                  style={{ backgroundColor: option.color }}
                />
                {t(option.labelKey)}
                {isActive && (
                  <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
                )}
              </Button>
            );
          })}
        </div>
        <AppLanguageSection />
      </div>
    </Container>
  );
};
