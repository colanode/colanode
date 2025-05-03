import nodemailer from 'nodemailer';
import { createDebugger } from '@colanode/core';

import { configuration } from '@/lib/configuration';

interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

const debug = createDebugger('server:service:email');

class EmailService {
  private transporter: nodemailer.Transporter | undefined;

  constructor() {}

  public async init() {
    if (
      !configuration.smtp.host ||
      !configuration.smtp.port ||
      !configuration.smtp.from.email ||
      !configuration.smtp.from.name
    ) {
      debug('SMTP configuration is not set, skipping initialization');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: configuration.smtp.host,
      port: configuration.smtp.port,
      secure: configuration.smtp.secure,
      auth: {
        user: configuration.smtp.user,
        pass: configuration.smtp.password,
      },
    });

    await this.transporter.verify();
  }

  public async sendEmail(message: EmailMessage): Promise<void> {
    if (!this.transporter) {
      debug('Email service not initialized, skipping email send');
      return;
    }

    await this.transporter.sendMail({
      from: `${configuration.smtp.from.name} <${configuration.smtp.from.email}>`,
      ...message,
    });
  }
}

export const emailService = new EmailService();
