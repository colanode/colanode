import '@/renderer/styles/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/renderer/app';
import { TooltipProvider } from '@/renderer/components/ui/tooltip';
import { Toaster } from '@/renderer/components/ui/toaster';
import { WorkspaceCreate } from '@/renderer/components/workspaces/workspace-create';
import { Workspace } from '@/renderer/components/workspaces/workspace';
import { WorkspaceRedirect } from '@/renderer/components/workspaces/workspace-redirect';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Login } from '@/renderer/components/accounts/login';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventBus } from '@/renderer/hooks/use-event-bus';
import { Event } from '@/shared/types/events';
import { AccountRedirect } from '@/renderer/components/accounts/account-redirect';
import { Account } from '@/renderer/components/accounts/account';
import { DelayedComponent } from '@/renderer/components/ui/delayed-component';
import { AppLoading } from '@/renderer/app-loading';

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

        const existingData = queryClient.getQueryData<any>([queryId]);

        if (!existingData) {
          window.colanode.unsubscribeQuery(queryId);
          return;
        } else {
          queryClient.setQueryData([queryId], result);
        }
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
        <AppLoading />
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
