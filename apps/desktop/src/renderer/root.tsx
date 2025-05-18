import { createRoot } from 'react-dom/client';
import { RootProvider } from '@colanode/ui';

import { AssetProvider } from '@/renderer/asset-provider';

const Root = () => {
  return (
    <AssetProvider>
      <RootProvider type="desktop" />
    </AssetProvider>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
