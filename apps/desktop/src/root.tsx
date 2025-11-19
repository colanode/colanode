// A workaround to make the globals.css file work in the web app
import '../../../packages/ui/src/styles/globals.css';

import { createRoot } from 'react-dom/client';

import { App } from '@colanode/ui';

const Root = () => {
  return <App type="desktop" />;
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
