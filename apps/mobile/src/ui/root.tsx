// A workaround to make the globals.css file work in the mobile app
import '../../../../packages/ui/src/styles/globals.css';

import { RootProvider } from '@colanode/ui';

export const Root = () => {
  return <RootProvider type="mobile" />;
};
