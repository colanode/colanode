import { JobHandler } from '@/types/jobs';

export type CleanWorkspaceDataInput = {
  type: 'clean_workspace_data';
  workspaceId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    clean_workspace_data: {
      input: CleanWorkspaceDataInput;
    };
  }
}

export const cleanWorkspaceDataHandler: JobHandler<
  CleanWorkspaceDataInput
> = async (input) => {
  console.log(input);
};
