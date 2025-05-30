import { AppType } from '@colanode/client/types';

interface FontLoaderProps {
  type: AppType;
}

export const FontLoader = ({ type }: FontLoaderProps) => {
  const fontUrl =
    type === 'web' ? `/assets/fonts/neotrax.otf` : `asset://fonts/neotrax.otf`;

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
