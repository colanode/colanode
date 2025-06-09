import { JobHandler } from '@colanode/server/jobs';
import { sendEmailPasswordResetEmail } from '@colanode/server/lib/accounts';

export type EmailPasswordResetSendInput = {
  type: 'email.password.reset.send';
  otpId: string;
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    'email.password.reset.send': {
      input: EmailPasswordResetSendInput;
    };
  }
}

export const emailPasswordResetSendHandler: JobHandler<
  EmailPasswordResetSendInput
> = async (input) => {
  const { otpId } = input;
  await sendEmailPasswordResetEmail(otpId);
};
