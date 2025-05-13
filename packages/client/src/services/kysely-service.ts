import { Kysely } from 'kysely';

export interface KyselyService {
  build<T>(path: string): Kysely<T>;
}
