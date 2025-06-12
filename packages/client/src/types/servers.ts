export type ServerAccountAttributes = {
  google: {
    enabled: boolean;
    clientId: string;
  };
};

export type ServerAttributes = {
  pathPrefix?: string | null;
  insecure?: boolean;
  account?: ServerAccountAttributes;
  sha?: string | null;
};

export type ServerState = {
  isAvailable: boolean;
  lastCheckedAt: Date;
  lastCheckedSuccessfullyAt: Date | null;
  count: number;
};

export type Server = {
  domain: string;
  name: string;
  avatar: string;
  attributes: ServerAttributes;
  version: string;
  createdAt: Date;
  syncedAt: Date | null;
};

export type ServerDetails = Server & {
  state: ServerState | null;
  isOutdated: boolean;
  configUrl: string;
};
