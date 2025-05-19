import { AppService } from '@colanode/client/services';
import { appBuild } from '@colanode/web/services/app-build';
import { paths } from '@colanode/web/services/app-paths';
import { WebFileSystem } from '@colanode/web/services/file-system';
import { WebKyselyService } from '@colanode/web/services/kysely-service';

const fs = new WebFileSystem();
const kysely = new WebKyselyService();

export const app = new AppService(fs, appBuild, kysely, paths);
