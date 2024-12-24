import { set } from 'lodash-es';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  EntryCollaboratorUpdateMutationInput,
  EntryCollaboratorUpdateMutationOutput,
} from '@/shared/mutations/collaborators/entry-collaborator-update';
import { MutationError } from '@/shared/mutations';

export class EntryCollaboratorUpdateMutationHandler
  implements MutationHandler<EntryCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: EntryCollaboratorUpdateMutationInput
  ): Promise<EntryCollaboratorUpdateMutationOutput> {
    const result = await entryService.updateEntry(
      input.entryId,
      input.userId,
      (attributes) => {
        set(attributes, `collaborators.${input.collaboratorId}`, input.role);
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update collaborators for this entry."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating collaborators for the entry.'
      );
    }

    return {
      success: true,
    };
  }
}