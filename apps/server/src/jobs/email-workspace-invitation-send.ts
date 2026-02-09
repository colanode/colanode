import { JobHandler } from '@colanode/server/jobs';
import { sendWorkspaceInvitationEmail } from '@colanode/server/lib/accounts';

export type EmailWorkspaceInvitationSendInput = {
  type: 'email.workspace.invitation.send';
  userId: string;
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    'email.workspace.invitation.send': {
      input: EmailWorkspaceInvitationSendInput;
    };
  }
}

export const emailWorkspaceInvitationSendHandler: JobHandler<
  EmailWorkspaceInvitationSendInput
> = async (input) => {
  const { userId } = input;
  await sendWorkspaceInvitationEmail(userId);
};
