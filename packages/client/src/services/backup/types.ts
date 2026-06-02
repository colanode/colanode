export interface BackupManifestFile {
    path: string;
    size: number;
    sha256: string;
    mtime: number;
}

export interface BackupManifest {
    version: 1;
    createdAt: string;
    appVersion: string;
    storagePath: string;
    files: BackupManifestFile[];
    totalSize: number;
}

export interface BackupListItem {
    id: string;
    createdAt: string;
    totalSize: number;
    fileCount: number;
}

export type BackupProgress = {
    phase: 'scanning' | 'uploading' | 'downloading' | 'restoring' | 'done';
    current: number;
    total: number;
    currentFile?: string;
};

export type BackupProgressCallback = (progress: BackupProgress) => void;
