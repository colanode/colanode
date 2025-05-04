import {
  IdType,
  UserStatus,
  WorkspaceRole,
  WorkspaceOutput,
  LoginSuccessOutput,
  generateId,
  LoginVerifyOutput,
} from '@colanode/core';
import argon2 from '@node-rs/argon2';

import { config } from '@/lib/config';
import { database } from '@/data/database';
import { SelectAccount } from '@/data/schema';
import { generateToken } from '@/lib/tokens';
import { createDefaultWorkspace } from '@/lib/workspaces';
import { jobService } from '@/services/job-service';
import { emailPasswordResetTemplate, emailVerifyTemplate } from '@/templates';
import { emailService } from '@/services/email-service';
import { deleteOtp, fetchOtp, generateOtpCode, saveOtp } from '@/lib/otps';
import {
  Otp,
  AccountVerifyOtpAttributes,
  AccountPasswordResetOtpAttributes,
} from '@/types/otps';
interface DeviceMetadata {
  ip: string | undefined;
  platform: string;
  version: string;
}

export const generatePasswordHash = async (
  password: string
): Promise<string> => {
  return await argon2.hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await argon2.verify(hash, password);
};

export const buildLoginSuccessOutput = async (
  account: SelectAccount,
  metadata: DeviceMetadata
): Promise<LoginSuccessOutput> => {
  const users = await database
    .selectFrom('users')
    .where('account_id', '=', account.id)
    .where('status', '=', UserStatus.Active)
    .where('role', '!=', 'none')
    .selectAll()
    .execute();

  const workspaceOutputs: WorkspaceOutput[] = [];
  if (users.length > 0) {
    const workspaceIds = users.map((u) => u.workspace_id);
    const workspaces = await database
      .selectFrom('workspaces')
      .where('id', 'in', workspaceIds)
      .selectAll()
      .execute();

    for (const user of users) {
      const workspace = workspaces.find((w) => w.id === user.workspace_id);

      if (!workspace) {
        continue;
      }

      workspaceOutputs.push({
        id: workspace.id,
        name: workspace.name,
        avatar: workspace.avatar,
        description: workspace.description,
        user: {
          id: user.id,
          accountId: user.account_id,
          role: user.role as WorkspaceRole,
          storageLimit: user.storage_limit,
          maxFileSize: user.max_file_size,
        },
      });
    }
  }

  if (workspaceOutputs.length === 0) {
    const workspace = await createDefaultWorkspace(account);
    workspaceOutputs.push(workspace);
  }

  const deviceId = generateId(IdType.Device);
  const { token, salt, hash } = generateToken(deviceId);

  const device = await database
    .insertInto('devices')
    .values({
      id: deviceId,
      account_id: account.id,
      token_hash: hash,
      token_salt: salt,
      token_generated_at: new Date(),
      type: 1,
      ip: metadata.ip,
      platform: metadata.platform,
      version: metadata.version,
      created_at: new Date(),
    })
    .returningAll()
    .executeTakeFirst();

  if (!device) {
    throw new Error('Failed to create device.');
  }

  return {
    type: 'success',
    account: {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
    },
    workspaces: workspaceOutputs,
    deviceId: device.id,
    token,
  };
};

export const buildLoginVerifyOutput = async (
  account: SelectAccount
): Promise<LoginVerifyOutput> => {
  const id = generateId(IdType.OtpCode);
  const expiresAt = new Date(Date.now() + config.account.otpTimeout * 1000);
  const otpCode = await generateOtpCode();

  const otp: Otp<AccountVerifyOtpAttributes> = {
    id,
    expiresAt,
    otp: otpCode,
    attributes: {
      accountId: account.id,
      attempts: 0,
    },
  };

  await saveOtp(id, otp);
  await jobService.addJob({
    type: 'send_email_verify_email',
    otpId: id,
  });

  return {
    type: 'verify',
    id,
    expiresAt,
  };
};

export const verifyOtpCode = async (
  id: string,
  otpCode: string
): Promise<string | null> => {
  const otp = await fetchOtp<AccountVerifyOtpAttributes>(id);
  if (!otp) {
    return null;
  }

  if (otp.otp !== otpCode) {
    if (otp.attributes.attempts >= 3) {
      await deleteOtp(id);
      return null;
    }

    otp.attributes.attempts++;

    await saveOtp(id, otp);
    return null;
  }

  await deleteOtp(id);
  return otp.attributes.accountId;
};

export const sendEmailVerifyEmail = async (otpId: string): Promise<void> => {
  const otp = await fetchOtp<AccountVerifyOtpAttributes>(otpId);
  if (!otp) {
    return;
  }

  const account = await database
    .selectFrom('accounts')
    .where('id', '=', otp.attributes.accountId)
    .selectAll()
    .executeTakeFirst();

  if (!account) {
    return;
  }

  const email = account.email;
  const name = account.name;
  const otpCode = otp.otp;

  const html = emailVerifyTemplate({
    name,
    otp: otpCode,
  });

  await emailService.sendEmail({
    subject: 'Your Colanode email verification code',
    to: email,
    html,
  });
};

export const sendEmailPasswordResetEmail = async (
  otpId: string
): Promise<void> => {
  const otp = await fetchOtp<AccountPasswordResetOtpAttributes>(otpId);
  if (!otp) {
    return;
  }

  const account = await database
    .selectFrom('accounts')
    .where('id', '=', otp.attributes.accountId)
    .selectAll()
    .executeTakeFirst();

  if (!account) {
    return;
  }

  const email = account.email;
  const name = account.name;
  const otpCode = otp.otp;

  const html = emailPasswordResetTemplate({
    name,
    otp: otpCode,
  });

  await emailService.sendEmail({
    subject: 'Your Colanode password reset code',
    to: email,
    html,
  });
};
