import { useNavigate } from '@tanstack/react-router';
import { type MouseEvent } from 'react';

import { LocalNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

interface NodeBacklinksProps {
    nodeId: string;
}

const getName = (node: LocalNode | null | undefined): string => {
    if (node && 'name' in node && typeof (node as { name?: unknown }).name === 'string') {
        const value = ((node as { name: string }).name ?? '').trim();
        if (value.length > 0) {
            return value;
        }
    }
    return 'Untitled';
};

const getAvatar = (node: LocalNode | null | undefined): string | undefined => {
    if (node && 'avatar' in node && typeof (node as { avatar?: unknown }).avatar === 'string') {
        return (node as { avatar: string }).avatar;
    }
    return undefined;
};

export const NodeBacklinks = ({ nodeId }: NodeBacklinksProps) => {
    const workspace = useWorkspace();
    const navigate = useNavigate();
    const layout = useLayout();

    const backlinksQuery = useLiveQuery({
        type: 'node.backlinks.get',
        userId: workspace.userId,
        nodeId,
    });

    const items = backlinksQuery.data ?? [];

    if (backlinksQuery.isPending || items.length === 0) {
        return null;
    }

    const handleOpen = (event: MouseEvent, targetId: string) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
            layout.openInNewTab(`/workspace/${workspace.userId}/${targetId}`);
            return;
        }
        navigate({
            to: '/workspace/$userId/$nodeId',
            params: { userId: workspace.userId, nodeId: targetId },
        });
    };

    const handleAux = (event: MouseEvent, targetId: string) => {
        if (event.button !== 1) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        layout.openInNewTab(`/workspace/${workspace.userId}/${targetId}`);
    };

    return (
        <div className="mt-8 border-t border-border pb-8 pt-6">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Linked from ({items.length})
            </div>
            <ul className="flex flex-col gap-0.5">
                {items.map((item) => {
                    const name = getName(item.source);
                    const avatar = getAvatar(item.source);
                    const parentName = item.parent ? getName(item.parent) : null;
                    return (
                        <li key={item.source.id}>
                            <button
                                type="button"
                                onClick={(e) => handleOpen(e, item.source.id)}
                                onAuxClick={(e) => handleAux(e, item.source.id)}
                                className="flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left hover:border-border hover:bg-muted"
                            >
                                <Avatar
                                    size="small"
                                    id={item.source.id}
                                    name={name}
                                    avatar={avatar}
                                />
                                <span className="truncate text-sm text-foreground">
                                    {name}
                                </span>
                                {parentName && (
                                    <span className="truncate text-xs text-muted-foreground">
                                        · {parentName}
                                    </span>
                                )}
                                {item.count > 1 && (
                                    <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                        {item.count}
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
