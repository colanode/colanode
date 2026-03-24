import './globals.css';

type FatalReporterWindow = Window &
  typeof globalThis & {
    __colanodeReportFatal?: (message: string) => void;
  };

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }

  return String(error);
};

const reportFatal = (message: string, error?: unknown) => {
  const details = error == null ? message : `${message}\n${serializeError(error)}`;
  const fatalWindow = window as FatalReporterWindow;

  fatalWindow.__colanodeReportFatal?.(details);
  console.error('[Mobile Editor Bootstrap]', details);
};

const bootstrap = async () => {
  try {
    const root = document.getElementById('editor-root');
    if (!root) {
      reportFatal('Missing #editor-root');
      return;
    }

    const [{ StrictMode }, { createRoot }, { MobileEditorApp }] =
      await Promise.all([
        import('react'),
        import('react-dom/client'),
        import('./editor'),
        import('./bridge'),
      ]);

    createRoot(root).render(
      <StrictMode>
        <MobileEditorApp />
      </StrictMode>
    );
  } catch (error) {
    reportFatal('Bootstrap failed', error);
  }
};

void bootstrap();
