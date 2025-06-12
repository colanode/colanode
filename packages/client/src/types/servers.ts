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
