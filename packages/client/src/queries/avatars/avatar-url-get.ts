export type AvatarUrlGetQueryInput = {
  type: 'avatar.url.get';
  accountId: string;
  avatarId: string;
};

export type AvatarUrlGetQueryOutput = {
  url: string | null;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'avatar.url.get': {
      input: AvatarUrlGetQueryInput;
      output: AvatarUrlGetQueryOutput;
    };
  }
}
