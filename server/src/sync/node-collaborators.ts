import { database } from '@/data/database';
import { SelectWorkspaceUser } from '@/data/schema';
import { getCollaboratorRole } from '@/lib/nodes';
import {
  SyncLocalChangeResult,
  LocalChange,
  LocalNodeCollaboratorChangeData,
} from '@/types/sync';

export const handleNodeCollaboratorChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  switch (change.action) {
    case 'insert': {
      return handleCreateNodeCollaboratorChange(workspaceUser, change);
    }
    case 'update': {
      return handleUpdateNodeCollaboratorChange(workspaceUser, change);
    }
    case 'delete': {
      return handleDeleteNodeCollaboratorChange(workspaceUser, change);
    }
  }
};

const handleCreateNodeCollaboratorChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  if (!change.after) {
    return {
      status: 'error',
    };
  }

  const nodeCollaboratorData = JSON.parse(
    change.after,
  ) as LocalNodeCollaboratorChangeData;

  const canCreate = await canCreateNodeCollaborator(
    workspaceUser,
    nodeCollaboratorData,
  );

  if (!canCreate) {
    return {
      status: 'error',
    };
  }

  await database
    .insertInto('node_collaborators')
    .values({
      node_id: nodeCollaboratorData.node_id,
      collaborator_id: nodeCollaboratorData.collaborator_id,
      role: nodeCollaboratorData.role,
      workspace_id: workspaceUser.workspace_id,
      created_at: new Date(nodeCollaboratorData.created_at),
      created_by: nodeCollaboratorData.created_by,
      server_created_at: new Date(),
      version_id: nodeCollaboratorData.version_id,
    })
    .onConflict((ob) => ob.doNothing())
    .execute();

  return {
    status: 'success',
  };
};

const canCreateNodeCollaborator = async (
  workspaceUser: SelectWorkspaceUser,
  data: LocalNodeCollaboratorChangeData,
): Promise<boolean> => {
  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', data.node_id)
    .executeTakeFirst();

  if (node === null || node === undefined) {
    return false;
  }

  // If the node is a root node and created by the current user
  if (
    node.parent_id === null &&
    node.created_by === workspaceUser.id &&
    data.collaborator_id === workspaceUser.id
  ) {
    return true;
  }

  // Get the current user's role for the node or its ancestors
  const currentUserRole = await getCollaboratorRole(
    data.node_id,
    workspaceUser.id,
  );

  if (currentUserRole === null) {
    return false; // User has no access to the node
  }

  if (currentUserRole === 'owner') {
    // Owners can add any role
    return true;
  }

  if (currentUserRole === 'admin') {
    // Admins can add admins and collaborators, but not owners
    if (data.role === 'owner') {
      return false;
    }

    return true;
  }

  // Collaborators cannot add other collaborators
  return false;
};

const handleUpdateNodeCollaboratorChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  if (!change.after) {
    return {
      status: 'error',
    };
  }

  const nodeCollaboratorData = JSON.parse(
    change.after,
  ) as LocalNodeCollaboratorChangeData;

  const existingNodeCollaborator = await database
    .selectFrom('node_collaborators')
    .selectAll()
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeCollaboratorData.node_id),
        eb('collaborator_id', '=', nodeCollaboratorData.collaborator_id),
      ]),
    )
    .executeTakeFirst();

  if (
    !existingNodeCollaborator ||
    existingNodeCollaborator.workspace_id != workspaceUser.workspace_id ||
    existingNodeCollaborator.updated_at === null ||
    existingNodeCollaborator.updated_by === null
  ) {
    return {
      status: 'error',
    };
  }

  const canUpdate = await canUpdateNodeCollaborator(
    workspaceUser,
    nodeCollaboratorData,
  );

  if (!canUpdate) {
    return {
      status: 'error',
    };
  }

  if (existingNodeCollaborator.role === nodeCollaboratorData.role) {
    return {
      status: 'success',
    };
  }

  const updatedAt = new Date(existingNodeCollaborator.updated_at);
  if (existingNodeCollaborator.server_updated_at !== null) {
    const serverUpdatedAt = new Date(
      existingNodeCollaborator.server_updated_at,
    );
    if (serverUpdatedAt > updatedAt) {
      return {
        status: 'success',
      };
    }
  }

  await database
    .updateTable('node_collaborators')
    .set({
      role: nodeCollaboratorData.role,
      updated_at: updatedAt,
      updated_by:
        nodeCollaboratorData.updated_by ?? existingNodeCollaborator.created_by,
      version_id: nodeCollaboratorData.version_id,
      server_updated_at: new Date(),
    })
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeCollaboratorData.node_id),
        eb('collaborator_id', '=', nodeCollaboratorData.collaborator_id),
      ]),
    )
    .execute();

  return {
    status: 'success',
  };
};

const canUpdateNodeCollaborator = async (
  workspaceUser: SelectWorkspaceUser,
  data: LocalNodeCollaboratorChangeData,
): Promise<boolean> => {
  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', data.node_id)
    .executeTakeFirst();

  if (node === null || node === undefined) {
    return false;
  }

  // Get the current user's role for the node or its ancestors
  const currentUserRole = await getCollaboratorRole(
    data.node_id,
    workspaceUser.id,
  );

  if (currentUserRole === null) {
    return false; // User has no access to the node
  }

  if (currentUserRole === 'owner') {
    // Owners can add any role
    return true;
  }

  if (currentUserRole === 'admin') {
    // Admins can add admins and collaborators, but not owners
    if (data.role === 'owner') {
      return false;
    }

    return true;
  }

  // Collaborators cannot add other collaborators
  return false;
};

const handleDeleteNodeCollaboratorChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  if (!change.before) {
    return {
      status: 'error',
    };
  }

  const nodeCollaboratorData = JSON.parse(
    change.before,
  ) as LocalNodeCollaboratorChangeData;

  const existingNodeCollaborator = await database
    .selectFrom('node_collaborators')
    .selectAll()
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeCollaboratorData.node_id),
        eb('collaborator_id', '=', nodeCollaboratorData.collaborator_id),
      ]),
    )
    .executeTakeFirst();

  if (
    !existingNodeCollaborator ||
    existingNodeCollaborator.workspace_id != workspaceUser.workspace_id
  ) {
    return {
      status: 'error',
    };
  }

  const canDelete = await canDeleteNodeCollaborator(
    workspaceUser,
    nodeCollaboratorData,
  );
  if (!canDelete) {
    return {
      status: 'error',
    };
  }

  await database
    .deleteFrom('node_collaborators')
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeCollaboratorData.node_id),
        eb('collaborator_id', '=', nodeCollaboratorData.collaborator_id),
      ]),
    )
    .execute();

  return {
    status: 'success',
  };
};

const canDeleteNodeCollaborator = async (
  workspaceUser: SelectWorkspaceUser,
  data: LocalNodeCollaboratorChangeData,
): Promise<boolean> => {
  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', data.node_id)
    .executeTakeFirst();

  if (node === null || node === undefined) {
    return false;
  }

  // Get the current user's role for the node or its ancestors
  const currentUserRole = await getCollaboratorRole(
    data.node_id,
    workspaceUser.id,
  );

  if (currentUserRole === null) {
    return false; // User has no access to the node
  }

  if (currentUserRole === 'owner') {
    // Owners can add any role
    return true;
  }

  if (currentUserRole === 'admin') {
    // Admins can add admins and collaborators, but not owners
    if (data.role === 'owner') {
      return false;
    }

    return true;
  }

  // Collaborators cannot add other collaborators
  return false;
};