import { AccountDelete } from '@colanode/ui/components/accounts/account-delete';
import { AccountUpdate } from '@colanode/ui/components/accounts/account-update';
import { Separator } from '@colanode/ui/components/ui/separator';

export const AccountSettingsContainer = () => {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">General</h2>
          <Separator className="mt-3" />
        </div>
        <AccountUpdate />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Danger Zone</h2>
          <Separator className="mt-3" />
        </div>
        <AccountDelete />
      </div>
    </div>
  );
};
