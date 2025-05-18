import * as React from 'react';
import { useAsset } from '@colanode/ui/contexts/asset';

interface Props extends React.SVGProps<SVGSVGElement> {
  id: string;
}

export const IconElement = React.forwardRef<SVGSVGElement, Props>(
  (props, ref) => {
    const asset = useAsset();

    return (
      <svg ref={ref} {...props}>
        <use href={asset.getIconUrl(props.id)} />
      </svg>
    );
  }
);

IconElement.displayName = 'IconElement';
