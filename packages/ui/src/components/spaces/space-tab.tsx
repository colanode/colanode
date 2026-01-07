import { LocalSpaceNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface SpaceTabProps {
  space: LocalSpaceNode;
}

export const SpaceTab = ({ space }: SpaceTabProps) => {
  return <Tab id={space.id} avatar={space.avatar} name={space.name} />;
};
