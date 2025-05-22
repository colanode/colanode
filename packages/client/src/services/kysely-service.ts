import { Kysely } from 'kysely';

export interface KyselyBuildOptions {
  path: string;
  readonly?: boolean;
}

export interface KyselyService {
  build<T>(options: KyselyBuildOptions): Kysely<T>;
  delete(path: string): Promise<void>;
}
