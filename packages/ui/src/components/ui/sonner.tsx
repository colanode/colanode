import { Toaster as Sonner, ToasterProps } from 'sonner';

import { useApp } from '@colanode/ui/contexts/app';

const Toaster = ({ ...props }: ToasterProps) => {
  const app = useApp();

  return (
    <Sonner
      theme={app.theme === 'dark' ? 'dark' : 'light'}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
