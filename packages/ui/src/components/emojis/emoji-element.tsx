import * as React from 'react';
import { getEmojiUrl } from '@colanode/ui/lib/assets';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  id: string;
}

export const EmojiElement = React.forwardRef<HTMLImageElement, Props>(
  (props, ref) => (
    <img
      src={getEmojiUrl(props.id)}
      {...props}
      alt="Emoji"
      ref={ref}
      loading="lazy"
    />
  )
);

EmojiElement.displayName = 'EmojiElement';
