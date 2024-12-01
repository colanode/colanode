export type ServerConfig = {
  name: string;
  avatar: string;
  version: string;
  attributes: ServerAttributes;
};

export type ServerAttributes = Record<string, unknown>;
