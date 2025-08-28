export type IconSvgGetQueryInput = {
  type: 'icon.svg.get';
  id: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'icon.svg.get': {
      input: IconSvgGetQueryInput;
      output: string | null;
    };
  }
}
