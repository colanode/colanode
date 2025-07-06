import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { fetchNode } from '@colanode/client/lib/utils';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  FieldCreateMutationInput,
  FieldCreateMutationOutput,
} from '@colanode/client/mutations/databases/field-create';
import {
  compareString,
  DatabaseAttributes,
  FieldAttributes,
  FieldType,
  generateId,
  generateFractionalIndex,
  IdType,
} from '@colanode/core';

export class FieldCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FieldCreateMutationInput>
{
  async handleMutation(
    input: FieldCreateMutationInput
  ): Promise<FieldCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    if (input.fieldType === 'relation') {
      if (!input.relationDatabaseId) {
        throw new MutationError(
          MutationErrorCode.RelationDatabaseNotFound,
          'Relation database not found.'
        );
      }

      const relationDatabase = await fetchNode(
        workspace.database,
        input.relationDatabaseId
      );

      if (!relationDatabase || relationDatabase.type !== 'database') {
        throw new MutationError(
          MutationErrorCode.RelationDatabaseNotFound,
          'Relation database not found.'
        );
      }
    }

    const fieldId = generateId(IdType.Field);
    const result = await workspace.nodes.updateNode<DatabaseAttributes>(
      input.databaseId,
      (attributes) => {
        const maxIndex = Object.values(attributes.fields)
          .map((field) => field.index)
          .sort((a, b) => -compareString(a, b))[0];

        const index = generateFractionalIndex(maxIndex, null);

        const newField: FieldAttributes = {
          id: fieldId,
          type: input.fieldType as FieldType,
          name: input.name,
          index,
        };

        if (newField.type === 'relation') {
          newField.databaseId = input.relationDatabaseId;
        }

        attributes.fields[fieldId] = newField;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.FieldCreateForbidden,
        "You don't have permission to create a field in this database."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.FieldCreateFailed,
        'Something went wrong while creating the field.'
      );
    }

    return {
      id: fieldId,
    };
  }
}
