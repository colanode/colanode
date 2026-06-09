import { eq, useLiveQuery } from '@tanstack/react-db';
import { useNavigate } from '@tanstack/react-router';
import { JSONContent } from '@tiptap/core';
import { type MouseEvent } from 'react';

import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { defaultClasses } from '@colanode/ui/editor/classes';

interface ResourceLinkRendererProps {
    node: JSONContent;
    keyPrefix: string | null;
}

export const ResourceLinkRenderer = ({ node }: ResourceLinkRendererProps) => {
    const workspace = useWorkspace();
    const navigate = useNavigate();
    const layout = useLayout();

    const target = (node.attrs?.target as string | null) ?? null;
    const targetType = (node.attrs?.targetType as string | null) ?? null;
    const fallbackLabel = (node.attrs?.label as string | null) ?? 'Untitled';

    const nodeQuery = useLiveQuery(
        (q) =>
            q
                .from({ nodes: workspace.collections.nodes })
                .where(({ nodes }) => eq(nodes.id, target ?? ''))
                .findOne(),
        [workspace.userId, target, targetType]
    );

    const resource = nodeQuery.data;
    const resourceName =
        resource && 'name' in resource && typeof resource.name === 'string'
            ? resource.name
            : null;
    const resourceAvatar =
        resource && 'avatar' in resource && typeof resource.avatar === 'string'
            ? resource.avatar
            : null;

    const exists = !!resource;
    const name = resourceName ?? fallbackLabel;
    const canNavigate = exists && !!target;

    const handleClick = (event: MouseEvent) => {
        if (!canNavigate || !target) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
            layout.openInNewTab(`/workspace/${workspace.userId}/${target}`);
            return;
        }
        navigate({
            to: '/workspace/$userId/$nodeId',
            params: { userId: workspace.userId, nodeId: target },
        });
    };

    const handleAuxClick = (event: MouseEvent) => {
        if (!canNavigate || !target || event.button !== 1) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        layout.openInNewTab(`/workspace/${workspace.userId}/${target}`);
    };

    return (
        <span
            className={
                exists
                    ? defaultClasses.resourceLink
                    : defaultClasses.resourceLinkMissing
            }
            onClick={handleClick}
            onAuxClick={handleAuxClick}
            style={canNavigate ? { cursor: 'pointer' } : undefined}
            title={exists ? undefined : 'Resource not available'}
        >
            <span aria-hidden className="text-muted-foreground">[[</span>
            {target && (
                <Avatar
                    size="small"
                    id={target}
                    name={name}
                    avatar={resourceAvatar ?? undefined}
                />
            )}
            <span role="presentation">{name}</span>
            <span aria-hidden className="text-muted-foreground">]]</span>
        </span>
    );
};
