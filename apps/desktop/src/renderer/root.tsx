import { createRoot } from 'react-dom/client';

import { AssetProvider } from '@colanode/desktop/renderer/asset-provider';
import { RootProvider } from '@colanode/ui';

const Root = () => {
  return (
    <AssetProvider>
      <RootProvider type="desktop" />
    </AssetProvider>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
