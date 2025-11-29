import { useApp } from '@colanode/ui/contexts/app';

export const AppAssets = () => {
  const app = useApp();
  const fontPrefix = app.type === 'web' ? `/assets/fonts` : `local://fonts`;

  return (
    <style>{`
      @font-face {
        font-family: "satoshi";
        src: url('${fontPrefix}/satoshi-variable.woff2') format("woff2-variations"),
            url('${fontPrefix}/satoshi-variable.woff2') format("woff2");
        font-weight: 300 900;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: "satoshi";
        src: url('${fontPrefix}/satoshi-variable-italic.woff2') format("woff2-variations"),
            url('${fontPrefix}/satoshi-variable-italic.woff2') format("woff2");
        font-weight: 300 900;
        font-style: italic;
        font-display: swap;
      }

      .font-satoshi {
        font-family: 'satoshi';
      }

      @font-face {
        font-family: 'antonio';
        src: url('${fontPrefix}/antonio.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }

      .font-antonio {
        font-family: 'antonio';
      }
    `}</style>
  );
};
