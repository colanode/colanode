import { app } from 'electron';
import fs from 'fs';
import path from 'path';

import { ThemeMode, WindowState } from '@colanode/client/types';
import { build } from '@colanode/core';

interface BootstrapData {
  version: string;
  theme: ThemeMode | null;
  window: WindowState;
}

export class BootstrapService {
  private data: BootstrapData;
  private readonly filePath: string;

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'bootstrap.json');
    this.data = this.load();
  }

  private load(): BootstrapData {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
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
      }
    } catch {
      return this.getDefaultData();
    }

    return this.getDefaultData();
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

  private async save(): Promise<void> {
    try {
      await fs.promises.writeFile(
        this.filePath,
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
}

export const bootstrap = new BootstrapService();
