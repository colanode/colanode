import { LocalPageNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface PageTabProps {
  page: LocalPageNode;
}

export const PageTab = ({ page }: PageTabProps) => {
  const name = page.name && page.name.length > 0 ? page.name : 'Untitled';
  return <Tab id={page.id} avatar={page.avatar} name={name} />;
};
