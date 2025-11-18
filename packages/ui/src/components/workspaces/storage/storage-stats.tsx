import { Info } from 'lucide-react';

import { formatBytes, WorkspaceStorageUsage } from '@colanode/core';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@colanode/ui/components/ui/tooltip';
import { bigintToPercent } from '@colanode/ui/lib/utils';

interface StorageStatsProps {
  storageLimit: string | null | undefined;
  usage: WorkspaceStorageUsage;
}

const numberFormatter = new Intl.NumberFormat();

const formatCount = (value: bigint) => {
  const asNumber = Number(value);
  if (Number.isSafeInteger(asNumber)) {
    return numberFormatter.format(asNumber);
  }

  return value.toString();
};

export const StorageStats = ({ storageLimit, usage }: StorageStatsProps) => {
  const uploadsUsed = BigInt(usage.uploads.size ?? '0');
  const limit = storageLimit ? BigInt(storageLimit) : null;
  const usedPercentage = limit ? bigintToPercent(limit, uploadsUsed) : 0;
  const clampedUsedPercentage = Math.min(usedPercentage, 100);
  const remaining = limit
    ? limit > uploadsUsed
      ? limit - uploadsUsed
      : BigInt(0)
    : null;

  const filesSize = BigInt(usage.uploads.size ?? '0');
  const filesCount = BigInt(usage.uploads.count ?? '0');

  const nodesSize = BigInt(usage.nodes.size ?? '0');
  const nodesCount = BigInt(usage.nodes.count ?? '0');
  const documentsSize = BigInt(usage.documents.size ?? '0');
  const contentSize = nodesSize + documentsSize;
  const contentCount = nodesCount;

  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
      <div className="rounded-xl border p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Total storage
        </p>
        <div className="mt-4 flex flex-col gap-1">
          <span className="text-3xl font-semibold tracking-tight">
            {formatBytes(uploadsUsed)}
          </span>
          <span className="text-sm text-muted-foreground">
            of {limit ? formatBytes(limit) : 'Unlimited'}
          </span>
        </div>
        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${clampedUsedPercentage}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {clampedUsedPercentage.toFixed(1)}%{' '}
            {limit ? 'of your limit' : 'used'}
          </span>
          {remaining !== null ? (
            <span>{formatBytes(remaining)} remaining</span>
          ) : (
            <span>No limit set</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {[
          {
            label: 'Content',
            size: formatBytes(contentSize),
            count: formatCount(contentCount),
            info: 'Messages, documents, databases and other items created directly in Colanode.',
          },
          {
            label: 'Files',
            size: formatBytes(filesSize),
            count: formatCount(filesCount),
            info: 'Includes every file uploaded to your workspace.',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="flex flex-1 flex-col justify-center rounded-xl border p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              {card.info ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`More info about ${card.label}`}
                      className="text-muted-foreground transition hover:text-foreground"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{card.info}</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-2xl font-semibold">{card.size}</span>
              <span className="text-xs text-muted-foreground">
                {card.count} items
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
