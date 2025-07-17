import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useAccount } from '@colanode/ui/contexts/account';

export const AccountLogoutTab = () => {
  const account = useAccount();

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={account.id}
        name={account.name}
        avatar={account.avatar}
        size="small"
      />
      <span>{account.name} Logout</span>
    </div>
  );
};
