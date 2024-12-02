import { IconData } from '@/shared/types/icons';

export type IconsGetQueryInput = {
  type: 'icons_get';
};

declare module '@/shared/queries' {
  interface QueryMap {
    icons_get: {
      input: IconsGetQueryInput;
      output: IconData;
    };
  }
}
