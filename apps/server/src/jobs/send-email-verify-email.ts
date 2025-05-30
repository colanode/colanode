import { JobHandler } from '@colanode/server/jobs';
import { sendEmailVerifyEmail } from '@colanode/server/lib/accounts';

export type SendEmailVerifyEmailInput = {
  type: 'send_email_verify_email';
  otpId: string;
};

declare module '@colanode/server/jobs' {
  interface JobMap {
    send_email_verify_email: {
      input: SendEmailVerifyEmailInput;
    };
  }
}

export const sendEmailVerifyEmailHandler: JobHandler<
  SendEmailVerifyEmailInput
> = async (input) => {
  const { otpId } = input;
  await sendEmailVerifyEmail(otpId);
};
