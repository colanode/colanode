import { QueryClientProvider } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';

import { AppType } from '@colanode/client/types';
import { AppProvider } from '@colanode/ui/components/app/app-provider';
import { Toaster } from '@colanode/ui/components/ui/sonner';
import { TooltipProvider } from '@colanode/ui/components/ui/tooltip';
import { HTML5Backend } from '@colanode/ui/lib/dnd-backend';
import { queryClient } from '@colanode/ui/lib/query';

interface AppProps {
  type: AppType;
}

export const App = ({ type }: AppProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <TooltipProvider>
          <AppProvider type={type} />
        </TooltipProvider>
        <Toaster />
      </DndProvider>
    </QueryClientProvider>
  );
};
