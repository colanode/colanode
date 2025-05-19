import { sha256 } from 'js-sha256';

import { database } from '@colanode/server/data/database';
import { uuid } from '@colanode/server/lib/utils';
import { RequestAccount } from '@colanode/server/types/api';

const DEVICE_TOKEN_PREFIX = 'cnd_';

interface GenerateTokenResult {
  token: string;
  salt: string;
  hash: string;
}

interface TokenData {
  deviceId: string;
  secret: string;
}

type VerifyTokenResult =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      account: RequestAccount;
    };

export const generateToken = (deviceId: string): GenerateTokenResult => {
  const salt = uuid();
  const secret = uuid() + uuid();
  const hash = sha256(secret + salt);
  const token = DEVICE_TOKEN_PREFIX + deviceId + secret;

  return {
    token,
    salt,
    hash,
  };
};

export const parseToken = (token: string): TokenData | null => {
  if (!token.startsWith(DEVICE_TOKEN_PREFIX)) {
    return null;
  }

  const tokenWithoutPrefix = token.slice(DEVICE_TOKEN_PREFIX.length);
  const deviceId = tokenWithoutPrefix.slice(0, 28);
  const secret = tokenWithoutPrefix.slice(28);
  return {
    deviceId,
    secret,
  };
};

export const verifyToken = async (
  tokenData: TokenData
): Promise<VerifyTokenResult> => {
  const device = await database
    .selectFrom('devices')
    .selectAll()
    .where('id', '=', tokenData.deviceId)
    .executeTakeFirst();

  if (!device) {
    return {
      authenticated: false,
    };
  }

  if (!verifySecret(tokenData.secret, device.token_salt, device.token_hash)) {
    return {
      authenticated: false,
    };
  }

  return {
    authenticated: true,
    account: {
      id: device.account_id,
      deviceId: device.id,
    },
  };
};

const verifySecret = (secret: string, salt: string, hash: string): boolean => {
  const computedHash = sha256(secret + salt);
  return computedHash === hash;
};
