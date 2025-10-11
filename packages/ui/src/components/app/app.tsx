import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef } from 'react';
import { DndProvider } from 'react-dnd';

import { AppType } from '@colanode/client/types';
import { AppProvider } from '@colanode/ui/components/app/app-provider';
import { Toaster } from '@colanode/ui/components/ui/sonner';
import { TooltipProvider } from '@colanode/ui/components/ui/tooltip';
import { HTML5Backend } from '@colanode/ui/lib/dnd-backend';
import { buildQueryClient } from '@colanode/ui/lib/query';

interface AppProps {
  type: AppType;
}

export const App = ({ type }: AppProps) => {
  const queryClientRef = useRef<QueryClient>(buildQueryClient());

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <DndProvider backend={HTML5Backend}>
        <TooltipProvider>
          <AppProvider type={type} />
        </TooltipProvider>
        <Toaster />
      </DndProvider>
    </QueryClientProvider>
  );
};
