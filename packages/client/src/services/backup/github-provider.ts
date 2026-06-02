import { createDebugger } from '@colanode/core';

import {
    StorageProvider,
    GitHubProviderConfig,
} from './storage-provider';

const debug = createDebugger('desktop:backup:github');

interface GitHubRelease {
    id: number;
    tag_name: string;
    assets: GitHubAsset[];
}

interface GitHubAsset {
    id: number;
    name: string;
    size: number;
    browser_download_url: string;
}


const RELEASE_TAG = 'colanode-backups';

export class GitHubStorageProvider implements StorageProvider {
    readonly name = 'github';
    private readonly config: GitHubProviderConfig;
    private releaseId: number | null = null;

    constructor(config: GitHubProviderConfig) {
        this.config = config;
    }

    private get apiBase(): string {
        return `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`;
    }

    private get headers(): Record<string, string> {
        return {
            Authorization: `Bearer ${this.config.token}`,
            Accept: 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
        };
    }

    async init(): Promise<void> {
        // Find or create the backup release
        const release = await this.findOrCreateRelease();
        this.releaseId = release.id;
        debug(`Using GitHub release: ${release.tag_name} (id: ${release.id})`);
    }

    private async findOrCreateRelease(): Promise<GitHubRelease> {
        // Try to find existing backup release
        try {
            const response = await fetch(
                `${this.apiBase}/releases/tags/${RELEASE_TAG}`,
                { headers: this.headers }
            );
            if (response.ok) {
                return (await response.json()) as GitHubRelease;
            }
        } catch {
            // Release not found, create it
        }

        // Create a new release for backups
        debug('Creating backup release');

        // Ensure the tag exists
        await this.ensureTag(RELEASE_TAG);

        const response = await fetch(`${this.apiBase}/releases`, {
            method: 'POST',
            headers: { ...this.headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tag_name: RELEASE_TAG,
                name: 'Colanode Backups',
                body: 'Automated backup storage for Colanode local data.',
                draft: false,
                prerelease: true,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to create release: ${response.status} ${text}`);
        }

        return (await response.json()) as GitHubRelease;
    }

    private async ensureTag(tag: string): Promise<void> {
        // Get the default branch SHA
        const refResponse = await fetch(`${this.apiBase}/git/ref/heads/main`, {
            headers: this.headers,
        });

        if (!refResponse.ok) {
            // Try 'master' as fallback
            const masterResponse = await fetch(
                `${this.apiBase}/git/ref/heads/master`,
                { headers: this.headers }
            );
            if (!masterResponse.ok) {
                throw new Error('Cannot find default branch');
            }
            const masterData = (await masterResponse.json()) as {
                object: { sha: string };
            };
            await this.createTag(tag, masterData.object.sha);
            return;
        }

        const refData = (await refResponse.json()) as {
            object: { sha: string };
        };
        await this.createTag(tag, refData.object.sha);
    }

    private async createTag(tag: string, sha: string): Promise<void> {
        try {
            await fetch(`${this.apiBase}/git/refs`, {
                method: 'POST',
                headers: { ...this.headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ref: `refs/tags/${tag}`,
                    sha,
                }),
            });
        } catch {
            // Tag may already exist, ignore
        }
    }

    async upload(key: string, data: Buffer): Promise<void> {
        if (!this.releaseId) {
            throw new Error('Provider not initialized');
        }

        // Asset name is the key with slashes replaced (GitHub doesn't allow slashes)
        const assetName = this.encodeKey(key);

        // Delete existing asset with the same name if it exists
        await this.deleteAssetByName(assetName);

        debug(`Uploading asset: ${assetName} (${data.length} bytes)`);

        const uploadUrl = `https://uploads.github.com/repos/${this.config.owner}/${this.config.repo}/releases/${this.releaseId}/assets?name=${encodeURIComponent(assetName)}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/octet-stream',
            },
            body: data,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(
                `Failed to upload ${assetName}: ${response.status} ${text}`
            );
        }
    }

    async download(key: string): Promise<Buffer> {
        if (!this.releaseId) {
            throw new Error('Provider not initialized');
        }

        const assetName = this.encodeKey(key);
        const asset = await this.findAsset(assetName);

        if (!asset) {
            throw new Error(`Asset not found: ${assetName}`);
        }

        debug(`Downloading asset: ${assetName}`);

        const response = await fetch(
            `${this.apiBase}/releases/assets/${asset.id}`,
            {
                headers: {
                    ...this.headers,
                    Accept: 'application/octet-stream',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to download ${assetName}: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    async list(prefix: string): Promise<string[]> {
        if (!this.releaseId) {
            throw new Error('Provider not initialized');
        }

        const encodedPrefix = this.encodeKey(prefix);
        const assets = await this.listAllAssets();

        return assets
            .filter((a) => a.name.startsWith(encodedPrefix))
            .map((a) => this.decodeKey(a.name));
    }

    async delete(key: string): Promise<void> {
        const assetName = this.encodeKey(key);
        await this.deleteAssetByName(assetName);
    }

    async exists(key: string): Promise<boolean> {
        if (!this.releaseId) {
            throw new Error('Provider not initialized');
        }

        const assetName = this.encodeKey(key);
        const asset = await this.findAsset(assetName);
        return asset !== null;
    }

    private async listAllAssets(): Promise<GitHubAsset[]> {
        const allAssets: GitHubAsset[] = [];
        let page = 1;
        const perPage = 100;

        for (; ;) {
            const response = await fetch(
                `${this.apiBase}/releases/${this.releaseId}/assets?per_page=${perPage}&page=${page}`,
                { headers: this.headers }
            );

            if (!response.ok) {
                break;
            }

            const assets = (await response.json()) as GitHubAsset[];
            if (assets.length === 0) {
                break;
            }

            allAssets.push(...assets);

            if (assets.length < perPage) {
                break;
            }
            page++;
        }

        return allAssets;
    }

    private async findAsset(name: string): Promise<GitHubAsset | null> {
        const assets = await this.listAllAssets();
        return assets.find((a) => a.name === name) ?? null;
    }

    private async deleteAssetByName(name: string): Promise<void> {
        const asset = await this.findAsset(name);
        if (!asset) {
            return;
        }

        debug(`Deleting existing asset: ${name}`);
        const response = await fetch(
            `${this.apiBase}/releases/assets/${asset.id}`,
            {
                method: 'DELETE',
                headers: this.headers,
            }
        );

        if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to delete asset ${name}: ${response.status}`);
        }
    }

    // GitHub release assets can't have slashes in names
    // Encode: "/" -> "__" and "__" -> "___"
    private encodeKey(key: string): string {
        return key.replace(/__/g, '___').replace(/\//g, '__');
    }

    private decodeKey(encoded: string): string {
        // Split on triple-underscore first, process each segment
        const parts = encoded.split('___');
        return parts.map((p) => p.replace(/__/g, '/')).join('_');
    }
}
