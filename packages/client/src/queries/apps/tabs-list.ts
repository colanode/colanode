import { Tab } from '@colanode/client/types/apps';

export type TabsListQueryInput = {
  type: 'tabs.list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'tabs.list': {
      input: TabsListQueryInput;
      output: Tab[];
    };
  }
}
