import { LocalRecordNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface RecordTabProps {
  record: LocalRecordNode;
}

export const RecordTab = ({ record }: RecordTabProps) => {
  const name =
    record.attributes.name && record.attributes.name.length > 0
      ? record.attributes.name
      : 'Untitled';

  return (
    <Tab id={record.id} avatar={record.attributes.avatar} name={name} />
  );
};
