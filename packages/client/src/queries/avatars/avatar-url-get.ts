export type AvatarUrlGetQueryInput = {
  type: 'avatar_url_get';
  accountId: string;
  avatarId: string;
};

export type AvatarUrlGetQueryOutput = {
  url: string | null;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    avatar_url_get: {
      input: AvatarUrlGetQueryInput;
      output: AvatarUrlGetQueryOutput;
    };
  }
}
