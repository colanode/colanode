import { Laptop, Moon, Sun } from 'lucide-react';

import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useApp } from '@colanode/ui/contexts/app';

export const AppearanceSettings = () => {
  const app = useApp();
  const theme = app.getMetadata('theme') ?? 'system';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Appearance</h2>
        <Separator className="mt-3" />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={theme === 'system' ? 'default' : 'outline'}
          onClick={() => app.setMetadata('theme', 'system')}
          className="min-w-28 justify-center"
          title="Follow system"
        >
          <Laptop className="size-4" />
          System
        </Button>
        <Button
          variant={theme === 'light' ? 'default' : 'outline'}
          onClick={() => app.setMetadata('theme', 'light')}
          className="min-w-28 justify-center"
          title="Light theme"
        >
          <Sun className="size-4" />
          Light
        </Button>
        <Button
          variant={theme === 'dark' ? 'default' : 'outline'}
          onClick={() => app.setMetadata('theme', 'dark')}
          className="min-w-28 justify-center"
          title="Dark theme"
        >
          <Moon className="size-4" />
          Dark
        </Button>
      </div>
    </div>
  );
};
