export type ServerAttributes = {
  pathPrefix?: string | null;
  insecure?: boolean;
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
