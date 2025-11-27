import { Fullscreen } from 'lucide-react';
import { useRef } from 'react';

import { SidebarMobile } from '@colanode/ui/components/layouts/sidebars/sidebar-mobile';
import {
  ScrollArea,
  ScrollBar,
  ScrollViewport,
} from '@colanode/ui/components/ui/scroll-area';
import { useApp } from '@colanode/ui/contexts/app';
import {
  ContainerContext,
  ContainerType,
} from '@colanode/ui/contexts/container';
import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { cn } from '@colanode/ui/lib/utils';

interface ContainerProps {
  type: ContainerType;
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  onFullscreen?: () => void;
}

export const Container = ({
  type,
  children,
  breadcrumb,
  actions,
  onFullscreen,
}: ContainerProps) => {
  const app = useApp();
  const isMobile = useIsMobile();

  const scrollAreaRef = useRef<HTMLDivElement>(null!);
  const scrollViewportRef = useRef<HTMLDivElement>(null!);

  return (
    <ContainerContext.Provider
      value={{
        type,
        scrollAreaRef,
        scrollViewportRef,
      }}
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            'sticky top-0 z-20 flex flex-row w-full items-center gap-2 p-3 h-10 mb-2 shrink-0 bg-background/80 backdrop-blur',
            app.type === 'mobile' && 'p-0 pr-2'
          )}
        >
          {isMobile && type === 'full' && <SidebarMobile />}
          {type === 'modal' && onFullscreen && (
            <Fullscreen
              className="size-4 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={onFullscreen}
            />
          )}
          <div className="flex-1 flex justify-between items-center">
            <div>{type === 'full' ? breadcrumb : null}</div>
            <div>{actions}</div>
          </div>
        </div>
        <ScrollArea ref={scrollAreaRef} className="overflow-hidden h-full">
          <ScrollViewport ref={scrollViewportRef} className="h-full">
            <div className="lg:px-10 px-4 min-h-0 flex-1 h-full">
              {children}
            </div>
          </ScrollViewport>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </ContainerContext.Provider>
  );
};
