import { Tab } from '@colanode/ui/components/layouts/tabs/tab';
import { defaultIcons } from '@colanode/ui/lib/assets';

export const LoginTab = () => {
  return <Tab id="login" avatar={defaultIcons.login} name="Login" />;
};
