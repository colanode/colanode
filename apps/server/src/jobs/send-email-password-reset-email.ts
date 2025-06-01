import { JobHandler } from '@colanode/server/jobs';
import { sendEmailPasswordResetEmail } from '@colanode/server/lib/accounts';

export type SendEmailPasswordResetEmailInput = {
  type: 'send_email_password_reset_email';
  otpId: string;
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    send_email_password_reset_email: {
      input: SendEmailPasswordResetEmailInput;
    };
  }
}

export const sendEmailPasswordResetEmailHandler: JobHandler<
  SendEmailPasswordResetEmailInput
> = async (input) => {
  const { otpId } = input;
  await sendEmailPasswordResetEmail(otpId);
};
