import { Container } from '@colanode/ui/components/layouts/containers/container';
import { SidebarDesktop } from '@colanode/ui/components/layouts/sidebars/sidebar-desktop';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';

export const Layout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="w-full h-full flex">
      {!isMobile && <SidebarDesktop />}
      <section className="min-w-0 flex-1">
        <Container />
      </section>
    </div>
  );
};
