import { LocalFolderNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface FolderTabProps {
  folder: LocalFolderNode;
}

export const FolderTab = ({ folder }: FolderTabProps) => {
  const name = folder.name && folder.name.length > 0 ? folder.name : 'Untitled';
  return <Tab id={folder.id} avatar={folder.avatar} name={name} />;
};
