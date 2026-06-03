import type { JSONContent } from '@tiptap/core';

const buildKey = (workspaceId: string, conversationId: string): string =>
    `colanode:draft:${workspaceId}:${conversationId}`;

export const loadDraft = (
    workspaceId: string,
    conversationId: string
): JSONContent | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(buildKey(workspaceId, conversationId));
        if (!raw) {
            return null;
        }
        return JSON.parse(raw) as JSONContent;
    } catch {
        return null;
    }
};

export const saveDraft = (
    workspaceId: string,
    conversationId: string,
    content: JSONContent
): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(
            buildKey(workspaceId, conversationId),
            JSON.stringify(content)
        );
    } catch {
        // ignore quota or serialization failures
    }
};

export const clearDraft = (
    workspaceId: string,
    conversationId: string
): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.removeItem(buildKey(workspaceId, conversationId));
    } catch {
        // ignore
    }
};
