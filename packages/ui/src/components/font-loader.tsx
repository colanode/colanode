import { useApp } from '@colanode/ui/contexts';

export const FontLoader = () => {
  const app = useApp();
  const fontUrl =
    app.type === 'web'
      ? `/assets/fonts/neotrax.otf`
      : `asset://fonts/neotrax.otf`;

  return (
    <style>{`
      @font-face {
        font-family: 'neotrax';
        src: url('${fontUrl}') format('truetype');
        font-weight: normal;
        font-style: normal;
      }

      .font-neotrax {
        font-family: 'neotrax', serif;
      }
    `}</style>
  );
};
