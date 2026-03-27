import isHotkey from 'is-hotkey';
import { SquareArrowOutUpRight } from 'lucide-react';
import React, { Fragment } from 'react';

import { RecordNode } from '@colanode/core';
import { useApp } from '@colanode/ui/contexts/app';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useNavigation } from '@colanode/ui/contexts/navigation';
import { useRecord } from '@colanode/ui/contexts/record';
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
  const app = useApp();
  const workspace = useWorkspace();
  const database = useDatabase();
  const currentRecord = useRecord();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = React.useState(false);

  const isMobile = app.type === 'mobile';
  const canEdit = currentRecord.canEdit && !database.isLocked;
  const hasName = record.name && record.name.length > 0;

  const handleSave = (newName: string) => {
    if (newName === record.name) return;

    const nodes = workspace.collections.nodes;
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
          <button
            type="button"
            className={`absolute right-2 flex h-6 cursor-pointer flex-row items-center gap-1 rounded-md border p-1 text-sm text-muted-foreground hover:bg-accent ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            onClick={() => navigation.openNode(record.id, 'record')}
          >
            <SquareArrowOutUpRight className="size-4" />
          </button>
        </Fragment>
      )}
    </div>
  );
};
