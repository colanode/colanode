import { Check, Laptop, Moon, Palette, Sun } from 'lucide-react';

import { ThemeColor, ThemeMode } from '@colanode/client/types';
import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { cn } from '@colanode/ui/lib/utils';
import { useAppStore } from '@colanode/ui/stores/app';

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
  const mutation = useMutation();
  const updateAppMetadata = useAppStore((state) => state.updateAppMetadata);
  const deleteAppMetadata = useAppStore((state) => state.deleteAppMetadata);
  const themeMode = useAppStore((state) => state.metadata.theme.mode);
  const themeColor = useAppStore((state) => state.metadata.theme.color);

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
                    deleteAppMetadata('theme.mode');
                    mutation.mutate({
                      input: {
                        type: 'app.metadata.delete',
                        key: 'theme.mode',
                      },
                    });
                  } else {
                    updateAppMetadata({
                      key: 'theme.mode',
                      value: option.value,
                    });
                    mutation.mutate({
                      input: {
                        type: 'app.metadata.update',
                        key: 'theme.mode',
                        value: option.value,
                      },
                    });
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
                    deleteAppMetadata('theme.color');
                    mutation.mutate({
                      input: {
                        type: 'app.metadata.delete',
                        key: 'theme.color',
                      },
                    });
                  } else {
                    updateAppMetadata({
                      key: 'theme.color',
                      value: option.value as ThemeColor,
                    });
                    mutation.mutate({
                      input: {
                        type: 'app.metadata.update',
                        key: 'theme.color',
                        value: option.value as ThemeColor,
                      },
                    });
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
