import { useState } from 'react';

import { Icon } from '@colanode/client/types';
import { IconBrowser } from '@colanode/ui/components/icons/icon-browser';
import { IconSearch } from '@colanode/ui/components/icons/icon-search';
import { IconPickerContext } from '@colanode/ui/contexts/icon-picker';

interface IconPickerProps {
  onPick: (icon: Icon) => void;
}

export const IconPicker = ({ onPick }: IconPickerProps) => {
  const [query, setQuery] = useState('');

  return (
    <IconPickerContext.Provider value={{ onPick }}>
      <div className="flex flex-col gap-1 p-1">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md bg-gray-100 p-2 text-xs focus:outline-none"
        />
        <div className="h-[280px] min-h-[280px] overflow-auto w-[330px] min-w-[330px]">
          {query.length > 2 ? <IconSearch query={query} /> : <IconBrowser />}
        </div>
      </div>
    </IconPickerContext.Provider>
  );
};
