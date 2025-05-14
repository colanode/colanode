import * as React from 'react';
import { getIconUrl } from '@colanode/ui/lib/assets';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  id: string;
}

export const IconElement = React.forwardRef<HTMLImageElement, Props>(
  (props, ref) => (
    <img
      src={getIconUrl(props.id)}
      {...props}
      alt="Icon"
      ref={ref}
      loading="lazy"
    />
  )
);

IconElement.displayName = 'IconElement';
