import { createContext, useContext } from 'react';

import { Icon,IconData } from '@/shared/types/icons';

interface IconPickerContextProps {
  data: IconData;
  onPick: (icon: Icon) => void;
}

export const IconPickerContext = createContext<IconPickerContextProps>(
  {} as IconPickerContextProps
);

export const useIconPicker = () => useContext(IconPickerContext);
