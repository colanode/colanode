import { SelectOptionAttributes } from '@colanode/core';

import { SelectOptionBadge } from '@/renderer/components/databases/fields/select-option-badge';

interface BoardViewColumnHeaderProps {
  option: SelectOptionAttributes;
}

export const BoardViewColumnHeader = ({
  option,
}: BoardViewColumnHeaderProps) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <SelectOptionBadge name={option.name} color={option.color} />
    </div>
  );
};
