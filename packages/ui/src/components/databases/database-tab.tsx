import { LocalDatabaseNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface DatabaseTabProps {
  database: LocalDatabaseNode;
}

export const DatabaseTab = ({ database }: DatabaseTabProps) => {
  const name =
    database.attributes.name && database.attributes.name.length > 0
      ? database.attributes.name
      : 'Untitled';

  return (
    <Tab
      id={database.id}
      avatar={database.attributes.avatar}
      name={name}
    />
  );
};
