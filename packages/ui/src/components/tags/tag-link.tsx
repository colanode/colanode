import { useNavigate } from '@tanstack/react-router';
import { type MouseEvent } from 'react';

import { TagAttributes } from '@colanode/core';
import { SelectOptionBadge } from '@colanode/ui/components/databases/fields/select-option-badge';
import { useLayout } from '@colanode/ui/contexts/layout';

interface TagLinkProps {
  tag: TagAttributes;
  userId: string;
}

export const TagLink = ({ tag, userId }: TagLinkProps) => {
  const navigate = useNavigate();
  const layout = useLayout();

  const openTag = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      layout.openInNewTab(`/workspace/${userId}/tags/${tag.id}`);
      return;
    }

    navigate({
      to: '/workspace/$userId/tags/$tagId',
      params: { userId, tagId: tag.id },
    });
  };

  const openTagInNewTab = (event: MouseEvent) => {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    layout.openInNewTab(`/workspace/${userId}/tags/${tag.id}`);
  };

  return (
    <button
      type="button"
      onClick={openTag}
      onAuxClick={openTagInNewTab}
      className="cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <SelectOptionBadge name={tag.name} color={tag.color} />
    </button>
  );
};
