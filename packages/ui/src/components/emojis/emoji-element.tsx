import { useAsset } from '@colanode/ui/contexts/asset';
import * as React from 'react';

interface Props extends React.SVGProps<SVGSVGElement> {
  id: string;
}

export const EmojiElement = React.forwardRef<SVGSVGElement, Props>(
  (props, ref) => {
    const asset = useAsset();

    return (
      <svg ref={ref} {...props}>
        <use href={asset.getEmojiUrl(props.id)} />
      </svg>
    );
  }
);

EmojiElement.displayName = 'EmojiElement';
