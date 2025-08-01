import argon2 from '@node-rs/argon2';
import ms from 'ms';

import {
  IdType,
  UserStatus,
  WorkspaceRole,
  WorkspaceOutput,
  LoginSuccessOutput,
  generateId,
  LoginVerifyOutput,
  trimString,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { SelectAccount } from '@colanode/server/data/schema';
import { config } from '@colanode/server/lib/config';
import {
  deleteOtp,
  fetchOtp,
  generateOtpCode,
  saveOtp,
} from '@colanode/server/lib/otps';
import { generateToken } from '@colanode/server/lib/tokens';
import { createDefaultWorkspace } from '@colanode/server/lib/workspaces';
import { emailService } from '@colanode/server/services/email-service';
import { jobService } from '@colanode/server/services/job-service';
import {
  emailPasswordResetTemplate,
  emailVerifyTemplate,
} from '@colanode/server/templates';
import { ClientContext } from '@colanode/server/types/api';
import { DeviceType } from '@colanode/server/types/devices';
import {
  Otp,
  AccountVerifyOtpAttributes,
  AccountPasswordResetOtpAttributes,
} from '@colanode/server/types/otps';

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
  client: ClientContext
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
      type: client.type === 'desktop' ? DeviceType.Desktop : DeviceType.Web,
      ip: client.ip,
      platform: trimString(client.platform, 255),
      version: client.version,
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
  const expiresAt = new Date(
    Date.now() + ms(`${config.account.otpTimeout} seconds`)
  );
  const otpCode = generateOtpCode();

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
    type: 'email.verify.send',
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
