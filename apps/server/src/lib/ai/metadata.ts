import {
  getNodeModel,
  FieldAttributes,
  RecordAttributes,
  DatabaseAttributes,
} from '@colanode/core';

import { database } from '@/data/database';
import {
  NodeMetadata,
  DocumentMetadata,
  BaseMetadata,
  ContextItem,
  UserInfo,
  ParentContextInfo,
  DatabaseInfo,
  DatabaseFieldInfo,
} from '@/types/metadata';

const fetchBaseMetadata = async (
  id: string,
  workspaceId: string,
  createdBy: string,
  createdAt: Date,
  updatedBy: string | null = null,
  updatedAt: Date | null = null
): Promise<BaseMetadata> => {
  const userIds = [createdBy];
  if (updatedBy) {
    userIds.push(updatedBy);
  }

  const users = await database
    .selectFrom('users')
    .select(['id', 'name'])
    .where('id', 'in', userIds)
    .execute();

  const userMap = new Map(users.map((u) => [u.id, u]));
  const author = userMap.get(createdBy);
  const lastAuthor = updatedBy ? userMap.get(updatedBy) : undefined;

  const workspace = await database
    .selectFrom('workspaces')
    .select(['id', 'name'])
    .where('id', '=', workspaceId)
    .executeTakeFirst();

  return {
    id,
    createdAt,
    createdBy,
    updatedAt,
    updatedBy,
    author: author ? { id: author.id, name: author.name } : undefined,
    lastAuthor: lastAuthor
      ? { id: lastAuthor.id, name: lastAuthor.name }
      : undefined,
    workspace: workspace
      ? { id: workspace.id, name: workspace.name }
      : undefined,
  };
};

const fetchParentContext = async (
  parentId: string | null
): Promise<ParentContextInfo | undefined> => {
  if (!parentId) {
    return undefined;
  }

  const parentNode = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', parentId)
    .executeTakeFirst();

  if (!parentNode) {
    return undefined;
  }

  const parentModel = getNodeModel(parentNode.type);
  if (!parentModel) {
    return undefined;
  }

  const parentText = parentModel.extractText(
    parentNode.id,
    parentNode.attributes
  );

  const pathNodes = await database
    .selectFrom('node_paths')
    .innerJoin('nodes', 'nodes.id', 'node_paths.ancestor_id')
    .select(['nodes.id', 'nodes.attributes'])
    .where('node_paths.descendant_id', '=', parentId)
    .orderBy('node_paths.level', 'desc')
    .execute();

  const path = pathNodes
    .map((n) => {
      const model = getNodeModel(n.attributes.type);
      return model?.extractText(n.id, n.attributes)?.name ?? '';
    })
    .join(' / ');

  return {
    id: parentNode.id,
    type: parentNode.type,
    name: parentText?.name,
    path,
  };
};

const fetchCollaborators = async (
  collaboratorIds: string[]
): Promise<UserInfo[]> => {
  if (!collaboratorIds.length) return [];

  const collaborators = await database
    .selectFrom('users')
    .select(['id', 'name'])
    .where('id', 'in', collaboratorIds)
    .execute();

  return collaborators.map((c) => ({ id: c.id, name: c.name }));
};

const fetchDatabaseInfo = async (
  databaseId: string
): Promise<DatabaseInfo | undefined> => {
  const databaseNode = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', databaseId)
    .executeTakeFirst();

  if (!databaseNode || databaseNode.type !== 'database') return undefined;

  const dbAttrs = databaseNode.attributes as DatabaseAttributes;

  return {
    id: databaseNode.id,
    name: dbAttrs.name || 'Untitled Database',
    fields: Object.entries(dbAttrs.fields || {}).reduce(
      (acc, [fieldId, field]) => ({
        ...acc,
        [fieldId]: {
          type: (field as FieldAttributes).type,
          name: (field as FieldAttributes).name,
        },
      }),
      {} as Record<string, DatabaseFieldInfo>
    ),
  };
};

export const fetchNodeMetadata = async (
  nodeId: string
): Promise<NodeMetadata | undefined> => {
  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', nodeId)
    .executeTakeFirst();

  if (!node) {
    return undefined;
  }

  const nodeModel = getNodeModel(node.type);
  if (!nodeModel) {
    return undefined;
  }

  const nodeText = nodeModel.extractText(node.id, node.attributes);
  if (!nodeText) {
    return undefined;
  }

  const baseMetadata = await fetchBaseMetadata(
    node.id,
    node.workspace_id,
    node.created_by,
    node.created_at,
    node.updated_by || null,
    node.updated_at || null
  );

  baseMetadata.name = nodeText.name ?? node.type;

  if (node.parent_id) {
    baseMetadata.parentContext = await fetchParentContext(node.parent_id);
  }

  if ('collaborators' in node.attributes) {
    baseMetadata.collaborators = await fetchCollaborators(
      Object.keys(node.attributes.collaborators as Record<string, string>)
    );
  }

  let fieldInfo: Record<string, { type: string; name: string }> | undefined;
  if (node.type === 'record') {
    const recordAttrs = node.attributes as RecordAttributes;
    const databaseInfo = await fetchDatabaseInfo(recordAttrs.databaseId);
    if (databaseInfo) {
      fieldInfo = databaseInfo.fields;
      baseMetadata.databaseInfo = databaseInfo;
    }
  }

  return {
    ...baseMetadata,
    type: 'node',
    nodeType: node.type,
    fieldInfo,
  };
};

export const fetchDocumentMetadata = async (
  documentId: string
): Promise<DocumentMetadata | undefined> => {
  const document = await database
    .selectFrom('documents')
    .selectAll()
    .where('id', '=', documentId)
    .executeTakeFirst();

  if (!document) {
    return undefined;
  }

  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', documentId)
    .executeTakeFirst();

  if (!node) {
    return undefined;
  }

  const baseMetadata = await fetchBaseMetadata(
    document.id,
    document.workspace_id,
    document.created_by,
    document.created_at,
    document.updated_by || null,
    document.updated_at || null
  );

  const nodeModel = getNodeModel(node.type);
  if (nodeModel) {
    const nodeText = nodeModel.extractText(node.id, node.attributes);
    if (nodeText) {
      baseMetadata.name = nodeText.name;
    }
  }

  if (node.parent_id) {
    baseMetadata.parentContext = await fetchParentContext(node.parent_id);
  }

  if (node.type === 'record') {
    const recordAttrs = node.attributes as RecordAttributes;
    const databaseInfo = await fetchDatabaseInfo(recordAttrs.databaseId);
    if (databaseInfo) {
      baseMetadata.databaseInfo = databaseInfo;
    }
  }

  return {
    ...baseMetadata,
    type: 'document',
  };
};

export const fetchNodesMetadata = async (
  nodeIds: string[]
): Promise<Record<string, NodeMetadata>> => {
  if (!nodeIds.length) {
    return {};
  }

  const nodes = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', 'in', nodeIds)
    .execute();

  if (!nodes.length) {
    return {};
  }

  const workspaceIds = new Set<string>();
  const userIds = new Set<string>();
  const parentIds = new Set<string>();
  const databaseIds = new Set<string>();

  nodes.forEach((node) => {
    workspaceIds.add(node.workspace_id);
    userIds.add(node.created_by);
    if (node.updated_by) {
      userIds.add(node.updated_by);
    }
    if (node.parent_id) {
      parentIds.add(node.parent_id);
    }
    if (node.type === 'record') {
      const recordAttrs = node.attributes as RecordAttributes;
      databaseIds.add(recordAttrs.databaseId);
    }
  });

  const workspaces = await database
    .selectFrom('workspaces')
    .select(['id', 'name'])
    .where('id', 'in', Array.from(workspaceIds))
    .execute();
  const workspaceMap = new Map(workspaces.map((w) => [w.id, w]));

  const users = await database
    .selectFrom('users')
    .select(['id', 'name'])
    .where('id', 'in', Array.from(userIds))
    .execute();
  const userMap = new Map(users.map((u) => [u.id, u]));

  const parentNodes =
    parentIds.size > 0
      ? await database
          .selectFrom('nodes')
          .selectAll()
          .where('id', 'in', Array.from(parentIds))
          .execute()
      : [];
  const parentNodeMap = new Map(parentNodes.map((p) => [p.id, p]));

  const databaseNodes =
    databaseIds.size > 0
      ? await database
          .selectFrom('nodes')
          .selectAll()
          .where('id', 'in', Array.from(databaseIds))
          .execute()
      : [];
  const databaseNodeMap = new Map(databaseNodes.map((d) => [d.id, d]));

  const results: Record<string, NodeMetadata> = {};

  for (const node of nodes) {
    const nodeModel = getNodeModel(node.type);
    if (!nodeModel) {
      continue;
    }

    const nodeText = nodeModel.extractText(node.id, node.attributes);
    if (!nodeText) {
      continue;
    }

    const workspace = workspaceMap.get(node.workspace_id);
    const author = userMap.get(node.created_by);
    const lastAuthor = node.updated_by
      ? userMap.get(node.updated_by)
      : undefined;

    const metadata: NodeMetadata = {
      id: node.id,
      name: nodeText.name ?? node.type,
      createdAt: node.created_at,
      createdBy: node.created_by,
      updatedAt: node.updated_at,
      updatedBy: node.updated_by,
      type: 'node',
      nodeType: node.type,
      author: author ? { id: author.id, name: author.name } : undefined,
      lastAuthor: lastAuthor
        ? { id: lastAuthor.id, name: lastAuthor.name }
        : undefined,
      workspace: workspace
        ? { id: workspace.id, name: workspace.name }
        : undefined,
    };

    if (node.parent_id) {
      const parentNode = parentNodeMap.get(node.parent_id);
      if (parentNode) {
        const parentModel = getNodeModel(parentNode.type);
        if (parentModel) {
          const parentText = parentModel.extractText(
            parentNode.id,
            parentNode.attributes
          );
          metadata.parentContext = {
            id: parentNode.id,
            type: parentNode.type,
            name: parentText?.name,
            path: '',
          } as ParentContextInfo;
        }
      }
    }

    if (node.type === 'record') {
      const recordAttrs = node.attributes as RecordAttributes;
      const databaseNode = databaseNodeMap.get(recordAttrs.databaseId);

      if (databaseNode && databaseNode.type === 'database') {
        const dbAttrs = databaseNode.attributes as DatabaseAttributes;
        const fieldInfo = Object.entries(dbAttrs.fields || {}).reduce(
          (acc, [fieldId, field]) => ({
            ...acc,
            [fieldId]: {
              type: (field as FieldAttributes).type,
              name: (field as FieldAttributes).name,
            },
          }),
          {} as Record<string, DatabaseFieldInfo>
        );

        metadata.fieldInfo = fieldInfo;
        metadata.databaseInfo = {
          id: databaseNode.id,
          name: dbAttrs.name || 'Untitled Database',
          fields: fieldInfo,
        } as DatabaseInfo;
      }
    }

    results[node.id] = metadata;
  }

  return results;
};

export const fetchDocumentsMetadata = async (
  documentIds: string[]
): Promise<Record<string, DocumentMetadata>> => {
  if (!documentIds.length) return {};

  const documents = await database
    .selectFrom('documents')
    .selectAll()
    .where('id', 'in', documentIds)
    .execute();

  if (!documents.length) return {};

  const nodes = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', 'in', documentIds)
    .execute();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const workspaceIds = new Set<string>();
  const userIds = new Set<string>();
  const parentIds = new Set<string>();
  const databaseIds = new Set<string>();

  documents.forEach((doc) => {
    workspaceIds.add(doc.workspace_id);
    userIds.add(doc.created_by);
    if (doc.updated_by) userIds.add(doc.updated_by);

    const node = nodeMap.get(doc.id);
    if (node) {
      if (node.parent_id) parentIds.add(node.parent_id);
      if (node.type === 'record') {
        const recordAttrs = node.attributes as RecordAttributes;
        databaseIds.add(recordAttrs.databaseId);
      }
    }
  });

  const workspaces = await database
    .selectFrom('workspaces')
    .select(['id', 'name'])
    .where('id', 'in', Array.from(workspaceIds))
    .execute();
  const workspaceMap = new Map(workspaces.map((w) => [w.id, w]));

  const users = await database
    .selectFrom('users')
    .select(['id', 'name'])
    .where('id', 'in', Array.from(userIds))
    .execute();
  const userMap = new Map(users.map((u) => [u.id, u]));

  const parentNodes =
    parentIds.size > 0
      ? await database
          .selectFrom('nodes')
          .selectAll()
          .where('id', 'in', Array.from(parentIds))
          .execute()
      : [];
  const parentNodeMap = new Map(parentNodes.map((p) => [p.id, p]));

  const databaseNodes =
    databaseIds.size > 0
      ? await database
          .selectFrom('nodes')
          .selectAll()
          .where('id', 'in', Array.from(databaseIds))
          .execute()
      : [];
  const databaseNodeMap = new Map(databaseNodes.map((d) => [d.id, d]));

  const results: Record<string, DocumentMetadata> = {};

  for (const document of documents) {
    const node = nodeMap.get(document.id);
    if (!node) {
      continue;
    }

    const workspace = workspaceMap.get(document.workspace_id);
    const author = userMap.get(document.created_by);
    const lastAuthor = document.updated_by
      ? userMap.get(document.updated_by)
      : undefined;

    let name: string | undefined;
    const nodeModel = getNodeModel(node.type);
    if (nodeModel) {
      const nodeText = nodeModel.extractText(node.id, node.attributes);
      if (nodeText) {
        name = nodeText.name ?? '';
      }
    }

    const metadata: DocumentMetadata = {
      id: document.id,
      name,
      createdAt: document.created_at,
      createdBy: document.created_by,
      updatedAt: document.updated_at,
      updatedBy: document.updated_by,
      type: 'document',
      author: author ? { id: author.id, name: author.name } : undefined,
      lastAuthor: lastAuthor
        ? { id: lastAuthor.id, name: lastAuthor.name }
        : undefined,
      workspace: workspace
        ? { id: workspace.id, name: workspace.name }
        : undefined,
    };

    if (node.parent_id) {
      const parentNode = parentNodeMap.get(node.parent_id);
      if (parentNode) {
        const parentModel = getNodeModel(parentNode.type);
        if (parentModel) {
          const parentText = parentModel.extractText(
            parentNode.id,
            parentNode.attributes
          );
          metadata.parentContext = {
            id: parentNode.id,
            type: parentNode.type,
            name: parentText?.name,
            path: '',
          } as ParentContextInfo;
        }
      }
    }

    if (node.type === 'record') {
      const recordAttrs = node.attributes as RecordAttributes;
      const databaseNode = databaseNodeMap.get(recordAttrs.databaseId);

      if (databaseNode && databaseNode.type === 'database') {
        const dbAttrs = databaseNode.attributes as DatabaseAttributes;
        const fieldInfo = Object.entries(dbAttrs.fields || {}).reduce(
          (acc, [fieldId, field]) => ({
            ...acc,
            [fieldId]: {
              type: (field as FieldAttributes).type,
              name: (field as FieldAttributes).name,
            },
          }),
          {} as Record<string, DatabaseFieldInfo>
        );

        metadata.databaseInfo = {
          id: databaseNode.id,
          name: dbAttrs.name || 'Untitled Database',
          fields: fieldInfo,
        } as DatabaseInfo;
      }
    }

    results[document.id] = metadata;
  }

  return results;
};

export const fetchMetadataForContextItems = async (
  contextItems: ContextItem[]
): Promise<Record<string, NodeMetadata | DocumentMetadata>> => {
  const nodeIds: string[] = [];
  const documentIds: string[] = [];

  contextItems.forEach((item) => {
    if (item.type === 'node') {
      nodeIds.push(item.id);
    } else if (item.type === 'document') {
      documentIds.push(item.id);
    }
  });

  const [nodesMetadata, documentsMetadata] = await Promise.all([
    fetchNodesMetadata(nodeIds),
    fetchDocumentsMetadata(documentIds),
  ]);

  return {
    ...nodesMetadata,
    ...documentsMetadata,
  };
};
