import { LayoutSingle } from '@colanode/ui/components/layouts/layout-single';
import { LayoutTabs } from '@colanode/ui/components/layouts/layout-tabs';
import { useApp } from '@colanode/ui/contexts/app';

export const Layout = () => {
  const app = useApp();

  return (
    <div className="h-[100dvh] w-[100dvw] bg-background text-foreground">
      {app.type === 'desktop' ? <LayoutTabs /> : <LayoutSingle />}
    </div>
  );
};
