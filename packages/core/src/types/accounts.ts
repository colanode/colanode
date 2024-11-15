import { WorkspaceOutput } from './workspaces';

export type GoogleLoginInput = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type EmailRegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type EmailLoginInput = {
  email: string;
  password: string;
};

export type GoogleUserInfo = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

export type LoginOutput = {
  account: AccountOutput;
  workspaces: WorkspaceOutput[];
  deviceId: string;
  token: string;
};

export type AccountOutput = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

export enum AccountStatus {
  Pending = 1,
  Active = 2,
}

export type AccountUpdateInput = {
  name: string;
  avatar?: string | null;
};

export type AccountUpdateOutput = {
  id: string;
  name: string;
  avatar?: string | null;
};

export type AccountSyncOutput = {
  account: AccountOutput;
  workspaces: WorkspaceOutput[];
  token?: string;
};