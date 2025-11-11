import { useEffect } from 'react';

import { useContainer } from '@colanode/ui/contexts/container';

interface ContainerSettingsProps {
  children: React.ReactNode;
}

export const ContainerSettings = ({ children }: ContainerSettingsProps) => {
  const container = useContainer();

  useEffect(() => {
    container.setSettings(children);

    return () => {
      container.resetSettings();
    };
  }, [children]);

  return null;
};
