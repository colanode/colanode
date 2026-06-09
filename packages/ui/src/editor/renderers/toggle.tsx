import { JSONContent } from '@tiptap/core';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { NodeChildrenRenderer } from '@colanode/ui/editor/renderers/node-children';

interface ToggleRendererProps {
    node: JSONContent;
    keyPrefix: string | null;
}

export const ToggleRenderer = ({ node, keyPrefix }: ToggleRendererProps) => {
    const initialOpen = node.attrs?.open !== false;
    const [open, setOpen] = useState(initialOpen);

    const children = node.content ?? [];
    const head = children[0];
    const rest = children.slice(1);

    return (
        <div
            data-type="toggle"
            data-open={open ? 'true' : 'false'}
            className="my-1 flex w-full flex-row items-start gap-1"
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mt-[0.3rem] flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                aria-label={open ? 'Collapse' : 'Expand'}
            >
                <ChevronRight
                    className={
                        'size-4 transition-transform ' + (open ? 'rotate-90' : '')
                    }
                />
            </button>
            <div className="min-w-0 flex-1">
                {head ? (
                    <NodeChildrenRenderer
                        node={{ type: 'doc', content: [head] }}
                        keyPrefix={keyPrefix}
                    />
                ) : null}
                {open && rest.length > 0 ? (
                    <NodeChildrenRenderer
                        node={{ type: 'doc', content: rest }}
                        keyPrefix={keyPrefix}
                    />
                ) : null}
            </div>
        </div>
    );
};
