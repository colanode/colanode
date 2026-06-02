import { createHash, createHmac } from 'crypto';

import { createDebugger } from '@colanode/core';

import { StorageProvider, S3ProviderConfig } from './storage-provider';

const debug = createDebugger('desktop:backup:s3');

// Minimal S3-compatible implementation using fetch (no AWS SDK dependency)
// Works with AWS S3, Cloudflare R2, MinIO, etc.

function hmacSha256(key: Buffer, data: string): Buffer {
    return createHmac('sha256', key).update(data).digest();
}

function sha256Hex(data: Buffer | string): string {
    return createHash('sha256').update(data).digest('hex');
}

function getSignatureKey(
    key: string,
    dateStamp: string,
    region: string,
    service: string
): Buffer {
    const kDate = hmacSha256(Buffer.from(`AWS4${key}`), dateStamp);
    const kRegion = hmacSha256(kDate, region);
    const kService = hmacSha256(kRegion, service);
    return hmacSha256(kService, 'aws4_request');
}

function formatAmzDate(date: Date): { amzDate: string; dateStamp: string } {
    const amzDate = date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const dateStamp = amzDate.slice(0, 8);
    return { amzDate, dateStamp };
}

export class S3StorageProvider implements StorageProvider {
    readonly name = 's3';
    private readonly config: S3ProviderConfig;
    private readonly region: string;
    private readonly endpoint: string;

    constructor(config: S3ProviderConfig) {
        this.config = config;
        this.region = config.region ?? 'us-east-1';
        this.endpoint =
            config.endpoint ??
            `https://s3.${this.region}.amazonaws.com`;
    }

    async init(): Promise<void> {
        debug(`S3 provider initialized: ${this.endpoint}/${this.config.bucket}`);
    }

    async upload(key: string, data: Buffer): Promise<void> {
        debug(`Uploading to S3: ${key} (${data.length} bytes)`);
        await this.s3Request('PUT', key, data);
    }

    async download(key: string): Promise<Buffer> {
        debug(`Downloading from S3: ${key}`);
        const response = await this.s3Request('GET', key);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    async list(prefix: string): Promise<string[]> {
        const response = await this.s3Request(
            'GET',
            '',
            undefined,
            `?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=1000`
        );
        const text = await response.text();

        // Parse XML response for <Key> elements
        const keys: string[] = [];
        const keyRegex = /<Key>([^<]+)<\/Key>/g;
        let match;
        while ((match = keyRegex.exec(text)) !== null) {
            keys.push(match[1]!);
        }
        return keys;
    }

    async delete(key: string): Promise<void> {
        debug(`Deleting from S3: ${key}`);
        await this.s3Request('DELETE', key);
    }

    async exists(key: string): Promise<boolean> {
        try {
            const response = await this.s3Request('HEAD', key);
            return response.ok;
        } catch {
            return false;
        }
    }

    private async s3Request(
        method: string,
        key: string,
        body?: Buffer,
        queryString?: string
    ): Promise<Response> {
        const now = new Date();
        const { amzDate, dateStamp } = formatAmzDate(now);

        const host = new URL(this.endpoint).host;
        const encodedKey = key
            .split('/')
            .map((s) => encodeURIComponent(s))
            .join('/');
        const canonicalUri = `/${this.config.bucket}/${encodedKey}`;
        const canonicalQuerystring = queryString?.replace('?', '') ?? '';
        const payloadHash = body ? sha256Hex(body) : sha256Hex('');

        const canonicalHeaders = [
            `host:${host}`,
            `x-amz-content-sha256:${payloadHash}`,
            `x-amz-date:${amzDate}`,
        ].join('\n');

        const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

        const canonicalRequest = [
            method,
            canonicalUri,
            canonicalQuerystring,
            canonicalHeaders + '\n',
            signedHeaders,
            payloadHash,
        ].join('\n');

        const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            sha256Hex(canonicalRequest),
        ].join('\n');

        const signingKey = getSignatureKey(
            this.config.secretAccessKey,
            dateStamp,
            this.region,
            's3'
        );
        const signature = hmacSha256(signingKey, stringToSign).toString('hex');

        const authorization = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        const url = `${this.endpoint}${canonicalUri}${queryString ?? ''}`;

        const response = await fetch(url, {
            method,
            headers: {
                Host: host,
                'x-amz-date': amzDate,
                'x-amz-content-sha256': payloadHash,
                Authorization: authorization,
                ...(body ? { 'Content-Length': String(body.length) } : {}),
            },
            body: body ?? undefined,
        });

        if (!response.ok && method !== 'HEAD') {
            const text = await response.text();
            throw new Error(`S3 ${method} ${key} failed: ${response.status} ${text}`);
        }

        return response;
    }
}
