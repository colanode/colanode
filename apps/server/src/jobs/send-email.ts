import { emailService } from '@/services/email-service';
import { JobHandler } from '@/types/jobs';

export type SendEmailInput = {
  type: 'send_email';
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    send_email: {
      input: SendEmailInput;
    };
  }
}

export const sendEmailHandler: JobHandler<SendEmailInput> = async (input) => {
  await emailService.sendEmail(input);
};
