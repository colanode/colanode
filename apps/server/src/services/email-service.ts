import nodemailer from 'nodemailer';

import { config } from '@colanode/server/lib/config';
import { createLogger } from '@colanode/server/lib/logger';

interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

const logger = createLogger('server:service:email');

class EmailService {
  private transporter: nodemailer.Transporter | undefined;
  private from: string | undefined;

  public async init() {
    if (!config.email.enabled) {
      logger.debug('Email configuration is not set, skipping initialization');
      return;
    }

    this.from = `${config.email.from.name} <${config.email.from.email}>`;
    const provider = config.email.provider;

    switch (provider.type) {
      case 'smtp':
        this.transporter = nodemailer.createTransport({
          host: provider.host,
          port: provider.port,
          secure: provider.secure,
          auth: {
            user: provider.auth.user,
            pass: provider.auth.password,
          },
        });
        break;
      default:
        this.transporter = undefined;
    }

    if (!this.transporter) {
      logger.warn('Email provider could not be configured');
      return;
    }

    await this.transporter.verify();
  }

  public async sendEmail(message: EmailMessage): Promise<void> {
    if (!config.email.enabled || !this.transporter || !this.from) {
      logger.debug('Email service not initialized, skipping email send');
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      ...message,
    });
  }
}

export const emailService = new EmailService();
