import { Migration } from 'kysely';

export const removeNodeUpdateRevisionTrigger: Migration = {
  up: async () => {
    // noop - leaving just for backwards compatibility
  },
  down: async () => {
    // noop - leaving just for backwards compatibility
  },
};
