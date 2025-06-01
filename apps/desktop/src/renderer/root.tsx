import { createRoot } from 'react-dom/client';

import { RootProvider } from '@colanode/ui';

const Root = () => {
  return <RootProvider type="desktop" />;
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
