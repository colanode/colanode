import '@/renderer/styles/index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import { App } from '@/renderer/app';
import { Account } from '@/renderer/components/accounts/account';
import { AccountRedirect } from '@/renderer/components/accounts/account-redirect';
import { Login } from '@/renderer/components/accounts/login';
import { DelayedComponent } from '@/renderer/components/ui/delayed-component';
import { Toaster } from '@/renderer/components/ui/toaster';
import { TooltipProvider } from '@/renderer/components/ui/tooltip';
import { Workspace } from '@/renderer/components/workspaces/workspace';
import { WorkspaceCreate } from '@/renderer/components/workspaces/workspace-create';
import { WorkspaceRedirect } from '@/renderer/components/workspaces/workspace-redirect';
import { useEventBus } from '@/renderer/hooks/use-event-bus';
import { RootLoader } from '@/renderer/root-loader';
import { Event } from '@/shared/types/events';

const router = createHashRouter([
  {
    path: '',
    element: <App />,
    children: [
      {
        path: '',
        element: <AccountRedirect />,
      },
      {
        path: ':accountId',
        element: <Account />,
        children: [
          {
            path: '',
            element: <WorkspaceRedirect />,
          },
          {
            path: 'create',
            element: <WorkspaceCreate />,
          },
          {
            path: ':workspaceId',
            element: <Workspace />,
          },
        ],
      },
      {
        path: '/login',
        element: <Login />,
      },
    ],
  },
]);

const queryClient = new QueryClient();

const Root = () => {
  const eventBus = useEventBus();
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    const id = eventBus.subscribe((event: Event) => {
      if (event.type === 'query_result_updated' && event.id && event.result) {
        const result = event.result;
        const queryId = event.id;

        if (!result) {
          return;
        }

        if (!queryId) {
          return;
        }

        queryClient.setQueryData([queryId], result);
      }
    });

    queryClient.getQueryCache().subscribe(async (event) => {
      if (
        event.type === 'removed' &&
        event.query &&
        event.query.queryKey &&
        event.query.queryKey.length > 0
      ) {
        await window.colanode.unsubscribeQuery(event.query.queryKey[0]);
      }
    });

    window.colanode.init().then(() => {
      setInitialized(true);
    });

    return () => {
      eventBus.unsubscribe(id);
    };
  }, []);

  if (!initialized) {
    return (
      <DelayedComponent>
        <RootLoader />
      </DelayedComponent>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
        <Toaster />
      </DndProvider>
    </QueryClientProvider>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
