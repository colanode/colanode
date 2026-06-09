import { useNavigate } from '@tanstack/react-router';
import { type MouseEvent, useEffect, useMemo, useState } from 'react';

import { Block } from '@colanode/core';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { cn } from '@colanode/ui/lib/utils';

interface NodeOutlineProps {
    documentId: string;
    className?: string;
}

type HeadingItem = {
    id: string;
    level: 1 | 2 | 3;
    text: string;
};

const HEADING_LEVELS: Record<string, 1 | 2 | 3> = {
    heading1: 1,
    heading2: 2,
    heading3: 3,
};

const blockText = (block: Block): string => {
    if (!block.content) return '';
    return block.content
        .map((leaf) => leaf.text ?? (leaf.attrs?.label as string | undefined) ?? '')
        .join('')
        .trim();
};

const collectHeadings = (
    rootId: string,
    blocks: Record<string, Block>
): HeadingItem[] => {
    const result: HeadingItem[] = [];
    const walk = (parentId: string) => {
        const children = Object.values(blocks)
            .filter((b) => b.parentId === parentId)
            .sort((a, b) => a.index.localeCompare(b.index));
        for (const child of children) {
            const level = HEADING_LEVELS[child.type];
            if (level) {
                const text = blockText(child);
                if (text.length > 0) {
                    result.push({ id: child.id, level, text });
                }
            }
            walk(child.id);
        }
    };
    walk(rootId);
    return result;
};

export const NodeOutline = ({ documentId, className }: NodeOutlineProps) => {
    const workspace = useWorkspace();
    const navigate = useNavigate();
    const documentQuery = useLiveQuery({
        type: 'document.get',
        documentId,
        userId: workspace.userId,
    });

    const headings = useMemo(() => {
        const doc = documentQuery.data;
        if (!doc || !doc.content?.blocks) return [];
        return collectHeadings(documentId, doc.content.blocks);
    }, [documentQuery.data, documentId]);

    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (headings.length === 0) return;
        const ids = new Set(headings.map((h) => h.id));
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .map((e) => e.target.getAttribute('data-id'))
                    .filter((id): id is string => !!id && ids.has(id));
                if (visible.length > 0) {
                    setActiveId(visible[0] ?? null);
                }
            },
            { rootMargin: '0px 0px -70% 0px', threshold: 0 }
        );
        headings.forEach((h) => {
            const el = document.querySelector(`[data-id="${h.id}"]`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [headings]);

    if (headings.length === 0) {
        return null;
    }

    const handleClick = (event: MouseEvent, id: string) => {
        event.preventDefault();
        const el = document.querySelector(`[data-id="${id}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveId(id);
            try {
                navigate({ hash: id, replace: true });
            } catch {
                // ignore
            }
        }
    };

    return (
        <nav
            aria-label="On this page"
            className={cn(
                'sticky top-4 ml-6 hidden h-fit max-h-[70vh] w-56 shrink-0 overflow-y-auto pl-3 text-sm xl:block',
                'border-l border-border',
                className
            )}
        >
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                On this page
            </div>
            <ul className="flex flex-col gap-0.5">
                {headings.map((h) => (
                    <li key={h.id}>
                        <a
                            href={`#${h.id}`}
                            onClick={(e) => handleClick(e, h.id)}
                            className={cn(
                                'block truncate rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground',
                                h.level === 2 && 'pl-4',
                                h.level === 3 && 'pl-6',
                                activeId === h.id && 'bg-muted text-foreground'
                            )}
                            title={h.text}
                        >
                            {h.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
