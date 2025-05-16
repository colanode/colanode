import { AppService, AssetService } from '@colanode/client/services';

import { WebKyselyService } from '@/services/kysely-service';
import { WebFileSystem } from '@/services/file-system';
import { appBuild } from '@/services/app-build';
import { paths } from '@/services/app-paths';

const fs = new WebFileSystem();
const kysely = new WebKyselyService();

export const asset = new AssetService(kysely, fs, paths);
export const app = new AppService(fs, appBuild, kysely, paths, asset);
