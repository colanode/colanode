import { LocalPageNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface PageTabProps {
  page: LocalPageNode;
}

export const PageTab = ({ page }: PageTabProps) => {
  const name =
    page.attributes.name && page.attributes.name.length > 0
      ? page.attributes.name
      : 'Untitled';

  return (
    <Tab id={page.id} avatar={page.attributes.avatar} name={name} />
  );
};
