import { createRoot } from 'react-dom/client';
import { RootProvider } from '@colanode/ui';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<RootProvider />);
