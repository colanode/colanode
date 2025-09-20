import { Container } from '@colanode/ui/components/layouts/containers/container';
import { SidebarDesktop } from '@colanode/ui/components/layouts/sidebars/sidebar-desktop';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';

export const Layout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="w-screen min-w-screen h-screen min-h-screen flex flex-row bg-background">
      {!isMobile && <SidebarDesktop />}
      <div className="h-full max-h-screen w-full flex-grow overflow-hidden">
        <Container />
      </div>
    </div>
  );
};
