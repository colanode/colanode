import { CollectionViewCard } from '@colanode/ui/components/databases/collection-view-card';
import { CollectionRow } from '@colanode/ui/lib/collection-row';

interface GalleryViewCollectionCardProps {
  row: CollectionRow;
}

export const GalleryViewCollectionCard = ({ row }: GalleryViewCollectionCardProps) => {
  return <CollectionViewCard row={row} />;
};
