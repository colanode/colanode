import fs from 'fs';

import { ThemeMode, WindowState } from '@colanode/client/types';
import { build } from '@colanode/core';
import { DesktopPathService } from '@colanode/desktop/main/path-service';

interface BootstrapData {
  version: string;
  theme: ThemeMode | null;
  window: WindowState;
}

export class BootstrapService {
  private data: BootstrapData;
  private readonly paths: DesktopPathService;
  private readonly requiresFreshStart: boolean;

  constructor(paths: DesktopPathService) {
    this.paths = paths;
    const bootstrapExists = fs.existsSync(this.paths.bootstrap);
    const appDatabaseExists = fs.existsSync(this.paths.appDatabase);

    this.requiresFreshStart = !bootstrapExists && appDatabaseExists;
    this.data = this.load(bootstrapExists);
  }

  private load(bootstrapExists: boolean): BootstrapData {
    try {
      if (!bootstrapExists) {
        return this.getDefaultData();
      }

      const content = fs.readFileSync(this.paths.bootstrap, 'utf-8');
      const parsed = JSON.parse(content);

      return {
        version: parsed.version || build.version,
        theme: parsed.theme || 'system',
        window: {
          fullscreen: parsed.window?.fullscreen || false,
          width: parsed.window?.width || 1280,
          height: parsed.window?.height || 800,
          x: parsed.window?.x || 100,
          y: parsed.window?.y || 100,
        },
      };
    } catch {
      return this.getDefaultData();
    }
  }

  private getDefaultData(): BootstrapData {
    return {
      version: build.version,
      theme: null,
      window: {
        fullscreen: false,
        width: 1280,
        height: 800,
        x: 100,
        y: 100,
      },
    };
  }

  public async save(): Promise<void> {
    if (!this.requiresFreshStart) {
      return;
    }

    try {
      await fs.promises.mkdir(this.paths.dirname(this.paths.bootstrap), {
        recursive: true,
      });
      await fs.promises.writeFile(
        this.paths.bootstrap,
        JSON.stringify(this.data, null, 2)
      );
    } catch (error) {
      console.error('Failed to save bootstrap data:', error);
    }
  }

  public get version(): string {
    return this.data.version;
  }

  public get theme(): ThemeMode | null {
    return this.data.theme;
  }

  public get window(): WindowState {
    return { ...this.data.window };
  }

  public async updateVersion(version: string): Promise<void> {
    this.data.version = version;
    await this.save();
  }

  public async updateWindowFullscreen(fullscreen: boolean): Promise<void> {
    this.data.window.fullscreen = fullscreen;
    await this.save();
  }

  public async updateWindowSize(width: number, height: number): Promise<void> {
    this.data.window.width = width;
    this.data.window.height = height;
    await this.save();
  }

  public async updateWindowPosition(x: number, y: number): Promise<void> {
    this.data.window.x = x;
    this.data.window.y = y;
    await this.save();
  }

  public async updateTheme(theme: ThemeMode | null): Promise<void> {
    this.data.theme = theme;
    await this.save();
  }

  public async updateWindow(state: WindowState): Promise<void> {
    this.data.window = state;
    await this.save();
  }

  public get needsFreshStart(): boolean {
    return this.requiresFreshStart;
  }
}
