import { useEffect, useRef } from 'react';

import { LocalSpaceNode } from '@colanode/client/types';
import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';

interface SpaceNameProps {
  space: LocalSpaceNode;
  readonly: boolean;
  onUpdate: (name: string) => void;
}

export const SpaceName = ({ space, readonly, onUpdate }: SpaceNameProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (readonly) return;

    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [readonly, inputRef]);

  return (
    <SmartTextInput
      value={space.attributes.name}
      readOnly={readonly}
      ref={inputRef}
      onChange={(value) => {
        if (readonly) {
          return;
        }

        if (value === space.attributes.name) {
          return;
        }

        onUpdate(value);
      }}
      className="font-heading border-0 pl-1 text-4xl font-bold shadow-none focus-visible:ring-0"
      placeholder="Unnamed"
    />
  );
};
