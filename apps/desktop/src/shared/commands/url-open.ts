export type UrlOpenCommandInput = {
  type: 'url_open';
  url: string;
};

declare module '@/shared/commands' {
  interface CommandMap {
    url_open: {
      input: UrlOpenCommandInput;
      output: void;
    };
  }
}
