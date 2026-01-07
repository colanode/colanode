import { LocalRecordNode } from '@colanode/client/types';
import { Tab } from '@colanode/ui/components/layouts/tabs/tab';

interface RecordTabProps {
  record: LocalRecordNode;
}

export const RecordTab = ({ record }: RecordTabProps) => {
  const name = record.name && record.name.length > 0 ? record.name : 'Untitled';
  return <Tab id={record.id} avatar={record.avatar} name={name} />;
};
