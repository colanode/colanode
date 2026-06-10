import { useEntityFields } from '@colanode/ui/contexts/entity-fields';

export const useEntity = () => {
  const entity = useEntityFields();

  return {
    id: entity.id,
    name: entity.name,
    avatar: entity.avatar,
    fields: entity.fields,
    createdBy: entity.createdBy,
    createdAt: entity.createdAt,
    updatedBy: entity.updatedBy,
    updatedAt: entity.updatedAt,
    databaseId: entity.schemaId,
    localRevision: entity.localRevision,
    canEdit: entity.canEdit,
    entityType: entity.entityType,
  };
};
