import { Kysely, Transaction } from 'kysely';

import { DatabaseSchema } from '@colanode/server/data/schema';

export type CounterKey = `${string}.storage.used` | `${string}.nodes.count`;

export const fetchCounter = async (
  database: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>,
  key: CounterKey
) => {
  const counter = await database
    .selectFrom('counters')
    .selectAll()
    .where('key', '=', key)
    .executeTakeFirst();

  return counter?.value ? BigInt(counter.value) : BigInt(0);
};
