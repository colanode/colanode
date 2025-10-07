import { Check, Laptop, Moon, Palette, Sun } from 'lucide-react';

import { ThemeColor, ThemeMode } from '@colanode/client/types';
import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';
import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { database } from '@colanode/ui/data';
import { useAppMetadata } from '@colanode/ui/hooks/use-app-metadata';
import { cn } from '@colanode/ui/lib/utils';

interface ThemeModeOption {
  key: string;
  value: ThemeMode | null;
  label: string;
  icon: typeof Laptop;
  title: string;
}

const themeModeOptions: ThemeModeOption[] = [
  {
    key: 'system',
    value: null,
    label: 'System',
    icon: Laptop,
    title: 'Follow system',
  },
  {
    key: 'light',
    value: 'light',
    label: 'Light',
    icon: Sun,
    title: 'Light theme',
  },
  {
    key: 'dark',
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    title: 'Dark theme',
  },
];

const themeColorOptions = [
  { value: 'default', label: 'Default', color: 'oklch(0.205 0 0)' },
  { value: 'blue', label: 'Blue', color: 'oklch(0.623 0.214 259.815)' },
  { value: 'red', label: 'Red', color: 'oklch(0.637 0.237 25.331)' },
  { value: 'rose', label: 'Rose', color: 'oklch(0.645 0.246 16.439)' },
  { value: 'orange', label: 'Orange', color: 'oklch(0.705 0.213 47.604)' },
  { value: 'green', label: 'Green', color: 'oklch(0.723 0.219 149.579)' },
  { value: 'yellow', label: 'Yellow', color: 'oklch(0.795 0.184 86.047)' },
  { value: 'violet', label: 'Violet', color: 'oklch(0.606 0.25 292.717)' },
];

export const AppAppearanceSettingsScreen = () => {
  const themeMode = useAppMetadata('theme.mode');
  const themeColor = useAppMetadata('theme.color');

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem
          icon={(className) => <Palette className={className} />}
          name="Appearance"
        />
      </Breadcrumb>
      <div className="max-w-4xl space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Appearance</h2>
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
                  if (option.value === null) {
                    database.metadata.delete('theme.mode');
                  } else {
                    const currentThemeMpde =
                      database.metadata.get('theme.mode');
                    if (currentThemeMpde) {
                      database.metadata.update('theme.mode', (metadata) => {
                        metadata.value = option.value as ThemeMode;
                        metadata.updatedAt = new Date().toISOString();
                      });
                    } else {
                      database.metadata.insert({
                        key: 'theme.mode',
                        value: option.value,
                        createdAt: new Date().toISOString(),
                        updatedAt: null,
                      });
                    }
                  }
                }}
                className={cn(
                  'h-10 w-full justify-start gap-2 relative',
                  isActive && 'ring-1 ring-ring border-primary'
                )}
                title={option.title}
              >
                <Icon className="size-5" />
                {option.label}
                {isActive && (
                  <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
                )}
              </Button>
            );
          })}
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Color</h2>
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
                    database.metadata.delete('theme.color');
                  } else {
                    const currentThemeColor =
                      database.metadata.get('theme.color');
                    if (currentThemeColor) {
                      database.metadata.update('theme.color', (metadata) => {
                        metadata.value = option.value as ThemeColor;
                        metadata.updatedAt = new Date().toISOString();
                      });
                    } else {
                      database.metadata.insert({
                        key: 'theme.color',
                        value: option.value as ThemeColor,
                        createdAt: new Date().toISOString(),
                        updatedAt: null,
                      });
                    }
                  }
                }}
                className={cn(
                  'h-10 justify-start gap-3 text-left relative',
                  isActive && 'ring-1 ring-ring border-primary'
                )}
                title={option.label}
              >
                <div
                  className="size-5 rounded-full border border-border/50 flex-shrink-0"
                  style={{ backgroundColor: option.color }}
                />
                {option.label}
                {isActive && (
                  <Check className="size-5 absolute -top-2 -right-2 text-background bg-primary rounded-full p-0.5" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
};
