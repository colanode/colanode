import { FileSubtype, formatBytes } from '@colanode/core';
import { bigintToPercent } from '@colanode/ui/lib/utils';

const subtypeColors: Record<FileSubtype, string> = {
  image: 'bg-blue-500',
  video: 'bg-green-500',
  audio: 'bg-purple-500',
  pdf: 'bg-red-500',
  other: 'bg-gray-500',
};

const subtypeNames: Record<FileSubtype, string> = {
  image: 'Images',
  video: 'Videos',
  audio: 'Audio',
  pdf: 'PDFs',
  other: 'Other Files',
};

interface StorageSubtype {
  subtype: string;
  size: string;
}

interface StorageStatsProps {
  usedBytes: bigint;
  limitBytes: bigint | null;
  subtypes: StorageSubtype[];
  isLoading?: boolean;
}

export const StorageStats = ({
  usedBytes,
  limitBytes,
  subtypes,
  isLoading = false,
}: StorageStatsProps) => {
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading storage data...
      </div>
    );
  }

  const usedPercentage = limitBytes
    ? bigintToPercent(limitBytes, usedBytes)
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-baseline">
        <span className="text-2xl font-medium">{formatBytes(usedBytes)}</span>
        <span className="text-xl text-muted-foreground">
          {' '}
          of {limitBytes ? formatBytes(limitBytes) : 'Unlimited'}
        </span>
        <span className="text-sm text-muted-foreground">
          ({usedPercentage}%) used
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
        {subtypes.map((subtype) => {
          const size = BigInt(subtype.size);
          if (size === BigInt(0)) {
            return null;
          }

          const percentage = limitBytes ? bigintToPercent(limitBytes, size) : 0;
          return (
            <div
              key={subtype.subtype}
              className={
                subtypeColors[subtype.subtype as keyof typeof subtypeColors]
              }
              style={{ width: `${percentage}%` }}
              title={`${subtypeNames[subtype.subtype as keyof typeof subtypeNames]}: ${formatBytes(BigInt(subtype.size))}`}
            />
          );
        })}
        {usedPercentage < 100 && (
          <div
            className="bg-gray-200"
            style={{ width: `${100 - usedPercentage}%` }}
          />
        )}
      </div>

      <div className="mb-6 space-y-2">
        {subtypes.map((subtype) => (
          <div
            key={subtype.subtype}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${subtypeColors[subtype.subtype as keyof typeof subtypeColors]}`}
              />
              <span className="text-sm">
                {subtypeNames[subtype.subtype as keyof typeof subtypeNames]}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatBytes(BigInt(subtype.size))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
