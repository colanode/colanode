import { sha256 } from 'js-sha256';

import { database } from '@/data/database';
import { uuid } from '@/lib/utils';
import { ColanodeRequestAccount } from '@/types/api';

interface GenerateTokenResult {
  token: string;
  salt: string;
  hash: string;
}

type VerifyTokenResult =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      account: ColanodeRequestAccount;
    };

export const generateToken = (id: string): GenerateTokenResult => {
  const salt = uuid();
  const secret = uuid() + uuid();
  const token = id + secret;
  const hash = sha256(secret + salt);

  return {
    token,
    salt,
    hash,
  };
};

export const verifyToken = async (
  token: string
): Promise<VerifyTokenResult> => {
  const id = token.slice(0, 28);
  const secret = token.slice(28);

  const device = await database
    .selectFrom('devices')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  if (!device) {
    return {
      authenticated: false,
    };
  }

  if (!verifySecret(secret, device.token_salt, device.token_hash)) {
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
