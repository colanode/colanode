import './globals.css';
import './bridge';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { MobileEditorApp } from './editor';

const root = document.getElementById('editor-root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <MobileEditorApp />
    </StrictMode>
  );
}
