import { useAsset } from '@colanode/ui/contexts/asset';

export const FontLoader = () => {
  const asset = useAsset();

  return (
    <style>{`
      @font-face {
        font-family: 'neotrax';
        src: url('${asset.getFontUrl('neotrax')}') format('truetype');
        font-weight: normal;
        font-style: normal;
      }

      .font-neotrax {
        font-family: 'neotrax', serif;
      }
    `}</style>
  );
};
