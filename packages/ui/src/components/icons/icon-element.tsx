import * as React from 'react';
import { useApp } from '@colanode/ui/contexts';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  id: string;
}

export const IconElement = React.forwardRef<HTMLImageElement, Props>(
  (props, ref) => {
    const app = useApp();

    return (
      <img
        src={app.getIconUrl(props.id)}
        {...props}
        alt="Icon"
        ref={ref}
        loading="lazy"
      />
    );
  }
);

IconElement.displayName = 'IconElement';
