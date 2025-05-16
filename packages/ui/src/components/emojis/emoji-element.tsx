import { useApp } from '@colanode/ui/contexts';
import * as React from 'react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  id: string;
}

export const EmojiElement = React.forwardRef<HTMLImageElement, Props>(
  (props, ref) => {
    const app = useApp();

    return (
      <img
        src={app.getEmojiUrl(props.id)}
        {...props}
        alt="Emoji"
        ref={ref}
        loading="lazy"
      />
    );
  }
);

EmojiElement.displayName = 'EmojiElement';
