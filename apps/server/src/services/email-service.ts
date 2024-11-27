import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;

interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | undefined;

  constructor() {}

  public async init() {
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
      throw new Error('SMTP configuration is missing');
    }

    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await this.transporter.verify();
  }

  public async sendEmail(message: EmailMessage): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    await this.transporter.sendMail({
      from: EMAIL_FROM,
      ...message,
    });
  }
}

export const emailService = new EmailService();
