import nodemailer from 'nodemailer';
import { createDebugger } from '@colanode/core';

import { config } from '@/lib/config';

interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

const debug = createDebugger('server:service:email');

class EmailService {
  private transporter: nodemailer.Transporter | undefined;
  private from: string | undefined;

  public async init() {
    if (!config.smtp.enabled) {
      debug('SMTP configuration is not set, skipping initialization');
      return;
    }

    this.from = `${config.smtp.from.name} <${config.smtp.from.email}>`;
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });

    await this.transporter.verify();
  }

  public async sendEmail(message: EmailMessage): Promise<void> {
    if (!this.transporter || !this.from) {
      debug('Email service not initialized, skipping email send');
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      ...message,
    });
  }
}

export const emailService = new EmailService();
