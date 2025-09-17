import { modelName } from 'expo-device';

import { AppMeta, AppService } from '@colanode/client/services';
import { MobileFileSystem } from '@colanode/mobile/services/file-system';
import { MobileKyselyService } from '@colanode/mobile/services/kysely-service';
import { MobilePathService } from '@colanode/mobile/services/path-service';

const appMeta: AppMeta = {
  type: 'mobile',
  platform: modelName ?? 'unknown',
};

export const app = new AppService(
  appMeta,
  new MobileFileSystem(),
  new MobileKyselyService(),
  new MobilePathService()
);
