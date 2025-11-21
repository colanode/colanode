import isHotkey from 'is-hotkey';
import { SquareArrowOutUpRight } from 'lucide-react';
import React, { Fragment } from 'react';

import { RecordNode } from '@colanode/core';
import { collections } from '@colanode/ui/collections';
import { Link } from '@colanode/ui/components/ui/link';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface NameEditorProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

const NameEditor = ({ initialValue, onSave, onCancel }: NameEditorProps) => {
  const [value, setValue] = React.useState(initialValue ?? '');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBlur = () => {
    if (value === initialValue) {
      onCancel();
    } else {
      onSave(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isHotkey('enter', e)) {
      e.preventDefault();
      onSave(value);
    } else if (isHotkey('esc', e)) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="flex h-full w-full cursor-text flex-row items-center gap-1 p-1 text-sm"
    />
  );
};

interface TableViewNameCellProps {
  record: RecordNode;
}

export const TableViewNameCell = ({ record }: TableViewNameCellProps) => {
  const workspace = useWorkspace();
  const [isEditing, setIsEditing] = React.useState(false);

  const canEdit = true;
  const hasName = record.name && record.name.length > 0;

  const handleSave = (newName: string) => {
    if (newName === record.name) return;

    const nodes = collections.workspace(workspace.userId).nodes;
    nodes.update(record.id, (draft) => {
      if (draft.type !== 'record') {
        return;
      }
      draft.name = newName;
    });

    setIsEditing(false);
  };

  return (
    <div className="group relative flex h-full w-full items-center">
      {isEditing ? (
        <NameEditor
          initialValue={record.name ?? ''}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <Fragment>
          <div
            onClick={() => canEdit && setIsEditing(true)}
            className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm"
          >
            {hasName ? (
              <span className="truncate">{record.name}</span>
            ) : (
              <span className="text-muted-foreground">Unnamed</span>
            )}
          </div>
          <Link
            from="/workspace/$userId/$nodeId"
            to="modal/$modalNodeId"
            params={{ modalNodeId: record.id }}
            className="absolute right-2 flex h-6 cursor-pointer flex-row items-center gap-1 rounded-md border p-1 text-sm text-muted-foreground opacity-0 hover:bg-accent group-hover:opacity-100"
          >
            <SquareArrowOutUpRight className="mr-1 size-4" /> <p>Open</p>
          </Link>
        </Fragment>
      )}
    </div>
  );
};
