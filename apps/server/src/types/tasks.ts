import { EmailMessage } from '@/types/email';

export type Task = SendEmailTask;

export type SendEmailTask = {
  type: 'send_email';
  message: EmailMessage;
};
