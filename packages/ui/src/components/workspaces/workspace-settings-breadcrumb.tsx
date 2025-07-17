import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from '@colanode/ui/components/ui/breadcrumb';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const WorkspaceSettingsBreadcrumb = () => {
  const workspace = useWorkspace();

  return (
    <Breadcrumb className="flex-grow">
      <BreadcrumbList>
        <BreadcrumbItem className="cursor-pointer hover:text-foreground">
          <div className="flex items-center space-x-2">
            <Avatar
              id={workspace.id}
              name={workspace.name}
              avatar={workspace.avatar}
              className="size-4"
            />
            <span>{workspace.name} Settings</span>
          </div>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
