export type EntryCollaboratorDeleteMutationInput = {
  type: 'entry_collaborator_delete';
  userId: string;
  entryId: string;
  collaboratorId: string;
};

export type EntryCollaboratorDeleteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    entry_collaborator_delete: {
      input: EntryCollaboratorDeleteMutationInput;
      output: EntryCollaboratorDeleteMutationOutput;
    };
  }
}