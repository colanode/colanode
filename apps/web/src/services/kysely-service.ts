import { KyselyService } from '@colanode/client/services';
import { Kysely } from 'kysely';
import { SQLocalKysely } from 'sqlocal/kysely';

export class WebKyselyService implements KyselyService {
  build<T>(path: string): Kysely<T> {
    const { dialect } = new SQLocalKysely(path);

    return new Kysely<T>({
      dialect,
    });
  }
}
