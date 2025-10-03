import { LocalFolderNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface FolderTabProps {
  folder: LocalFolderNode;
}

export const FolderTab = ({ folder }: FolderTabProps) => {
  const name =
    folder.attributes.name && folder.attributes.name.length > 0
      ? folder.attributes.name
      : 'Untitled';

  return (
    <Tab id={folder.id} avatar={folder.attributes.avatar} name={name} />
  );
};
