import { LocalFileNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { defaultIcons } from '@colanode/ui/lib/assets';

interface FileBreadcrumbItemProps {
  file: LocalFileNode;
}

export const FileBreadcrumbItem = ({ file }: FileBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem id={file.id} avatar={defaultIcons.file} name={file.name} />
  );
};
