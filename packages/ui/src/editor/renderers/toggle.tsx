import { JSONContent } from '@tiptap/core';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';

interface ToggleRendererProps {
    node: JSONContent;
    keyPrefix: string | null;
}

export const ToggleRenderer = ({ node, keyPrefix }: ToggleRendererProps) => {
    const [open, setOpen] = useState(node.attrs?.open !== false);
    const children = node.content ?? [];
    const summary = children.slice(0, 1);
    const body = children.slice(1);

    return (
        <div className="my-1 flex w-full flex-row items-start gap-1">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mt-[0.4rem] flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                aria-label={open ? 'Collapse' : 'Expand'}
            >
                <ChevronRight
                    className={
                        'size-4 transition-transform ' + (open ? 'rotate-90' : '')
                    }
                />
            </button>
            <div className="min-w-0 flex-1">
                <NodeChildrenRenderer
                    node={{ ...node, content: summary }}
                    keyPrefix={keyPrefix}
                />
                {open && (
                    <NodeChildrenRenderer
                        node={{ ...node, content: body }}
                        keyPrefix={keyPrefix ? `${keyPrefix}-body` : 'body'}
                    />
                )}
            </div>
        </div>
    );
};
