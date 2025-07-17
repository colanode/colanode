import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from '@colanode/ui/components/ui/breadcrumb';
import { useAccount } from '@colanode/ui/contexts/account';

export const AccountSettingsBreadcrumb = () => {
  const account = useAccount();

  return (
    <Breadcrumb className="flex-grow">
      <BreadcrumbList>
        <BreadcrumbItem className="cursor-pointer hover:text-foreground">
          <div className="flex items-center space-x-2">
            <Avatar
              id={account.id}
              name={account.name}
              avatar={account.avatar}
              className="size-4"
            />
            <span>{account.name} Settings</span>
          </div>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
