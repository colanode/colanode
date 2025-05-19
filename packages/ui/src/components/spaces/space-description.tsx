import { useEffect, useRef } from 'react';

import { LocalSpaceNode } from '@colanode/client/types';
import { SmartTextarea } from '@colanode/ui/components/ui/smart-textarea';

interface SpaceDescriptionProps {
  space: LocalSpaceNode;
  readonly: boolean;
  onUpdate: (description: string) => void;
}

export const SpaceDescription = ({
  space,
  readonly,
  onUpdate,
}: SpaceDescriptionProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (readonly) return;

    const timeoutId = setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [readonly, textareaRef]);

  return (
    <SmartTextarea
      value={space.attributes.description ?? ''}
      readOnly={readonly}
      ref={textareaRef}
      onChange={(value) => {
        if (readonly) {
          return;
        }

        if (value === space.attributes.description) {
          return;
        }

        onUpdate(value);
      }}
      placeholder="No description"
    />
  );
};
