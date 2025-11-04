import { build } from '@colanode/core';
import { WebFileSystem } from '@colanode/web/services/file-system';
import { WebPathService } from '@colanode/web/services/path-service';

type BootstrapData = {
  version: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const createDefaultData = (): BootstrapData => ({
  version: build.version,
});

const parseBootstrap = (content: string): BootstrapData => {
  try {
    const parsed = JSON.parse(content);

    return {
      version: parsed.version ?? build.version,
    };
  } catch {
    return createDefaultData();
  }
};

const readBootstrap = async (
  fs: WebFileSystem,
  path: string
): Promise<BootstrapData> => {
  try {
    const data = await fs.readFile(path);
    const content = textDecoder.decode(data);
    return parseBootstrap(content);
  } catch {
    return createDefaultData();
  }
};

const writeBootstrap = async (
  fs: WebFileSystem,
  path: string,
  data: BootstrapData
): Promise<void> => {
  const payload: BootstrapData = {
    version: data.version,
  };

  const content = JSON.stringify(payload, null, 2);
  await fs.writeFile(path, textEncoder.encode(content));
};

export class WebBootstrapService {
  private data: BootstrapData;
  private readonly fs: WebFileSystem;
  private readonly bootstrapPath: string;
  private readonly requiresFreshInstall: boolean;

  private constructor(options: {
    fs: WebFileSystem;
    data: BootstrapData;
    bootstrapPath: string;
    requiresFreshInstall: boolean;
  }) {
    this.fs = options.fs;
    this.data = options.data;
    this.bootstrapPath = options.bootstrapPath;
    this.requiresFreshInstall = options.requiresFreshInstall;
  }

  public static async create(
    paths: WebPathService,
    fs: WebFileSystem = new WebFileSystem()
  ): Promise<WebBootstrapService> {
    const bootstrapPath = paths.bootstrap;

    const [bootstrapExists, tempExists] = await Promise.all([
      fs.exists(bootstrapPath),
      fs.exists(paths.temp),
    ]);

    const requiresFreshInstall = !bootstrapExists && tempExists;
    const data = bootstrapExists
      ? await readBootstrap(fs, bootstrapPath)
      : createDefaultData();

    const service = new WebBootstrapService({
      fs,
      data,
      bootstrapPath,
      requiresFreshInstall,
    });

    return service;
  }

  private async save(): Promise<void> {
    await writeBootstrap(this.fs, this.bootstrapPath, this.data);
  }

  public get needsFreshInstall(): boolean {
    return this.requiresFreshInstall;
  }

  public get version(): string {
    return this.data.version;
  }

  public async updateVersion(version: string): Promise<void> {
    this.data.version = version;
    await this.save();
  }
}
