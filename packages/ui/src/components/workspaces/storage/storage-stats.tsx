import { FileSubtype, formatBytes } from '@colanode/core';
import { bigintToPercent } from '@colanode/ui/lib/utils';

interface SubtypeMetadata {
  subtype: FileSubtype;
  color: string;
  name: string;
}

const subtypeMetadata: SubtypeMetadata[] = [
  {
    subtype: 'image',
    color: 'bg-blue-500',
    name: 'Images',
  },
  {
    subtype: 'video',
    color: 'bg-green-500',
    name: 'Videos',
  },
  {
    subtype: 'audio',
    color: 'bg-purple-500',
    name: 'Audio',
  },
  {
    subtype: 'pdf',
    color: 'bg-red-500',
    name: 'PDFs',
  },
  {
    subtype: 'other',
    color: 'bg-gray-500',
    name: 'Other Files',
  },
];

interface StorageSubtype {
  subtype: string;
  storageUsed: string;
}

interface StorageStatsProps {
  storageUsed: string;
  storageLimit: string | null;
  subtypes: StorageSubtype[];
}

export const StorageStats = ({
  storageUsed,
  storageLimit,
  subtypes,
}: StorageStatsProps) => {
  const usedPercentage = storageLimit
    ? bigintToPercent(BigInt(storageLimit), BigInt(storageUsed))
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-baseline">
        <span className="text-2xl font-medium">
          {formatBytes(BigInt(storageUsed))}
        </span>
        <span className="text-xl text-muted-foreground">
          {' '}
          of {storageLimit ? formatBytes(BigInt(storageLimit)) : 'Unlimited'}
        </span>
        <span className="text-sm text-muted-foreground">
          ({usedPercentage}%) used
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
        {subtypes.map((subtype) => {
          const storageUsed = BigInt(subtype.storageUsed);
          if (storageUsed === BigInt(0)) {
            return null;
          }

          const percentage = storageLimit
            ? bigintToPercent(BigInt(storageLimit), storageUsed)
            : 0;
          const metadata = subtypeMetadata.find(
            (m) => m.subtype === subtype.subtype
          );

          if (!metadata) {
            return null;
          }

          const name = metadata.name;
          const color = metadata.color;
          const title = `${name}: ${formatBytes(BigInt(subtype.storageUsed))}`;

          return (
            <div
              key={subtype.subtype}
              className={color}
              style={{ width: `${percentage}%` }}
              title={title}
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
        {subtypes.map((subtype) => {
          const storageUsed = BigInt(subtype.storageUsed);
          if (storageUsed === BigInt(0)) {
            return null;
          }

          const metadata = subtypeMetadata.find(
            (m) => m.subtype === subtype.subtype
          );

          if (!metadata) {
            return null;
          }

          const name = metadata.name;
          const color = metadata.color;

          return (
            <div
              key={subtype.subtype}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm">{name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatBytes(BigInt(subtype.storageUsed))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
