import { type NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { ChevronRight } from 'lucide-react';

export const ToggleNodeView = ({ node, updateAttributes }: NodeViewProps) => {
    const open = node.attrs.open !== false;

    return (
        <NodeViewWrapper
            data-type="toggle"
            data-open={open ? 'true' : 'false'}
            className="my-1 flex w-full flex-row items-start gap-1"
        >
            <button
                type="button"
                contentEditable={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => updateAttributes({ open: !open })}
                className="mt-[0.3rem] flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                aria-label={open ? 'Collapse' : 'Expand'}
            >
                <ChevronRight
                    className={
                        'size-4 transition-transform ' + (open ? 'rotate-90' : '')
                    }
                />
            </button>
            <NodeViewContent className="toggle-content min-w-0 flex-1" />
        </NodeViewWrapper>
    );
};
