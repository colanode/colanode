import { LogOut } from 'lucide-react';

export const AccountLogoutTab = () => {
  return (
    <div className="flex items-center space-x-2">
      <LogOut className="size-4" />
      <span>Logout</span>
    </div>
  );
};
