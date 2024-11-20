import { UrlFieldAttributes } from '@colanode/core';
import { cn, isValidUrl } from '@/shared/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/renderer/components/ui/hover-card';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { ExternalLink } from 'lucide-react';
import { useRecord } from '@/renderer/contexts/record';

interface RecordUrlValueProps {
  field: UrlFieldAttributes;
  readOnly?: boolean;
}

export const RecordUrlValue = ({ field, readOnly }: RecordUrlValueProps) => {
  const record = useRecord();

  const text = record.getUrlValue(field);
  const isUrl = text && isValidUrl(text);

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger>
        <SmartTextInput
          value={text}
          readOnly={!record.canEdit || readOnly}
          onChange={(newValue) => {
            if (!record.canEdit || readOnly) return;

            if (newValue === text) {
              return;
            }

            if (newValue === null || newValue === '') {
              record.removeFieldValue(field);
            } else {
              record.updateFieldValue(field, {
                type: 'url',
                value: newValue,
              });
            }
          }}
          className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-0 text-sm focus-visible:cursor-text"
        />
      </HoverCardTrigger>
      <HoverCardContent
        className={cn(
          'flex w-full min-w-80 max-w-128 flex-row items-center justify-between gap-2 text-ellipsis',
          !isUrl && 'hidden'
        )}
      >
        <a
          className="text-blue-500 underline hover:cursor-pointer hover:text-blue-600"
          href={text ?? ''}
          target="_blank"
          rel="noreferrer"
        >
          {text}
        </a>
        <ExternalLink className="size-4 min-h-4 min-w-4 text-muted-foreground" />
      </HoverCardContent>
    </HoverCard>
  );
};
