import { Laptop, Moon, Sun } from 'lucide-react';

import { ThemeColor } from '@colanode/client/types';
import { Button } from '@colanode/ui/components/ui/button';
import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useApp } from '@colanode/ui/contexts/app';

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

export const AppAppearanceSettings = () => {
  const app = useApp();
  const themeMode = app.getMetadata('theme.mode');
  const themeColor = app.getMetadata('theme.color');

  return (
    <Container>
      <ContainerBody className="max-w-4xl space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Appearance</h2>
          <Separator className="mt-3" />
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={!themeMode ? 'default' : 'outline'}
            onClick={() => app.deleteMetadata('theme.mode')}
            className="h-12 min-w-32 justify-center gap-2"
            title="Follow system"
          >
            <Laptop className="size-5" />
            System
          </Button>
          <Button
            variant={themeMode === 'light' ? 'default' : 'outline'}
            onClick={() => app.setMetadata('theme.mode', 'light')}
            className="h-12 min-w-32 justify-center gap-2"
            title="Light theme"
          >
            <Sun className="size-5" />
            Light
          </Button>
          <Button
            variant={themeMode === 'dark' ? 'default' : 'outline'}
            onClick={() => app.setMetadata('theme.mode', 'dark')}
            className="h-12 min-w-32 justify-center gap-2"
            title="Dark theme"
          >
            <Moon className="size-5" />
            Dark
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Color</h2>
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
                variant={isActive ? 'default' : 'outline'}
                onClick={() => {
                  if (isDefault) {
                    app.deleteMetadata('theme.color');
                  } else {
                    app.setMetadata('theme.color', option.value as ThemeColor);
                  }
                }}
                className="h-12 justify-start gap-3 text-left"
                title={option.label}
              >
                <div
                  className="w-5 h-5 rounded-full border border-border/50 flex-shrink-0"
                  style={{ backgroundColor: option.color }}
                />
                {option.label}
              </Button>
            );
          })}
        </div>
      </ContainerBody>
    </Container>
  );
};
