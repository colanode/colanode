import { Kysely, Transaction } from 'kysely';

import { DatabaseSchema } from '@colanode/server/data/schema';

export type CounterKey =
  | `${string}.storage.used`
  | `${string}.nodes.count`
  | `node.updates.merge.cursor`
  | `document.updates.merge.cursor`;

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

export const setCounter = async (
  database: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>,
  key: CounterKey,
  value: bigint
) => {
  await database
    .insertInto('counters')
    .values({
      key,
      value: value.toString(),
      created_at: new Date(),
    })
    .onConflict((oc) =>
      oc.column('key').doUpdateSet({
        value: value.toString(),
        updated_at: new Date(),
      })
    )
    .execute();
};
