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

export const StorageStats = ({ storageLimit, usage }: StorageStatsProps) => {
  const uploadsUsed = BigInt(usage.uploads.size ?? '0');
  const limit = storageLimit ? BigInt(storageLimit) : null;
  const usedPercentage = limit ? bigintToPercent(limit, uploadsUsed) : 0;

  // Files: uploads
  const filesSize = BigInt(usage.uploads.size ?? '0');
  const filesCount = BigInt(usage.uploads.count ?? '0');

  // Content: nodes + documents
  const nodesSize = BigInt(usage.nodes.size ?? '0');
  const nodesCount = BigInt(usage.nodes.count ?? '0');
  const documentsSize = BigInt(usage.documents.size ?? '0');
  const contentSize = nodesSize + documentsSize;
  const contentCount = nodesCount;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-baseline">
        <span className="text-2xl font-medium">{formatBytes(uploadsUsed)}</span>
        <span className="text-xl text-muted-foreground">
          {' '}
          of {limit ? formatBytes(limit) : 'Unlimited'}
        </span>
        <span className="text-sm text-muted-foreground">
          ({Math.min(usedPercentage, 100).toFixed(1)}%) used
        </span>
      </div>
      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden flex">
        <div
          className="bg-primary"
          style={{ width: `${Math.min(usedPercentage, 100)}%` }}
        />
        <div
          className="bg-secondary flex-1"
          style={{
            width: `${Math.max(0, 100 - Math.min(usedPercentage, 100))}%`,
          }}
        />
      </div>

      <div className="flex items-center gap-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div>
                <span className="text-sm font-medium">Content</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatBytes(contentSize)} •{' '}
                  {new Intl.NumberFormat().format(Number(contentCount))} items
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Contains the total size for all content created inside Colanode
              (messages, pages, databases, records etc)
            </p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <div>
                <span className="text-sm font-medium">Files</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatBytes(filesSize)} •{' '}
                  {new Intl.NumberFormat().format(Number(filesCount))} items
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Contains all uploaded files size</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
