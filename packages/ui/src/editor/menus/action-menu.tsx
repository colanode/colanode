import { useFloating, shift, offset, FloatingPortal } from '@floating-ui/react';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import { Editor } from '@tiptap/react';
import { GripVertical, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { isDescendantNode } from '@colanode/client/lib';

interface ActionMenuProps {
  editor: Editor | null;
}

const LEFT_MARGIN = 45;

type MenuState = {
  show: boolean;
  pmNode?: ProseMirrorNode;
  domNode?: HTMLElement;
  pos?: number;
  rect?: DOMRect;
};

export const ActionMenu = ({ editor }: ActionMenuProps) => {
  const view = useRef(editor!.view!);
  const [menuState, setMenuState] = useState<MenuState>({
    show: false,
  });

  const { refs, floatingStyles } = useFloating({
    placement: 'left',
    middleware: [offset(-10), shift()],
  });

  useEffect(() => {
    if (menuState.rect) {
      refs.setPositionReference({
        getBoundingClientRect: () => menuState.rect!,
        contextElement: menuState.domNode!,
      });
    }
  }, [menuState.rect, menuState.domNode]);

  useEffect(() => {
    if (editor == null) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const editorBounds = view.current.dom.getBoundingClientRect();
      const mouseOverEditor =
        event.clientX > editorBounds.left - LEFT_MARGIN &&
        event.clientX < editorBounds.right &&
        event.clientY > editorBounds.top &&
        event.clientY < editorBounds.bottom;

      if (!mouseOverEditor) {
        setMenuState({
          show: false,
        });
        return;
      }

      const pos = view.current.posAtDOM(event.target as Node, 0, 0);
      if (!pos) {
        setMenuState({
          show: false,
        });
        return;
      }

      let currentPos = pos;
      let pmNode = null;
      let domNode = null;
      let nodePos = -1;

      while (currentPos >= 0) {
        const node = view.current.state.doc.nodeAt(currentPos);

        if (!node || !node.isBlock) {
          currentPos--;
          continue;
        }

        if (pmNode && !isDescendantNode(node, pmNode)) {
          currentPos--;
          continue;
        }

        const nodeDOM = view.current.nodeDOM(currentPos) as HTMLElement;
        const nodeDOMElement =
          nodeDOM instanceof HTMLElement
            ? nodeDOM
            : ((nodeDOM as Node)?.parentElement as HTMLElement);

        if (nodeDOMElement) {
          pmNode = node;
          domNode = nodeDOMElement;
          nodePos = currentPos;
        }

        currentPos--;
      }

      if (!pmNode || !domNode) {
        setMenuState({
          show: false,
        });
        return;
      }

      const nodeRect = domNode.getBoundingClientRect();
      const editorRect = editor.view.dom.getBoundingClientRect();
      const menuRect = DOMRect.fromRect({
        x: editorRect.x - 10,
        y: nodeRect.y,
        width: 0,
        height: nodeRect.height,
      });

      setMenuState({
        show: true,
        pmNode,
        domNode,
        pos: nodePos,
        rect: menuRect,
      });
    };

    const handleScroll = () => {
      setMenuState({
        show: false,
      });
    };

    editor.view.dom.addEventListener('mousemove', handleMouseMove);
    editor.view.dom.addEventListener('scroll', handleScroll, true);

    return () => {
      editor.view.dom.removeEventListener('mousemove', handleMouseMove);
      editor.view.dom.removeEventListener('scroll', handleScroll, true);
    };
  }, [editor]);

  if (editor == null || !menuState.show) {
    return null;
  }

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="flex items-center text-muted-foreground p-1 mr-2"
      >
        <Plus
          className="size-4 cursor-pointer hover:text-foreground"
          onClick={() => {
            if (menuState.pos === undefined || !menuState.domNode) {
              return;
            }

            editor
              .chain()
              .insertContentAt(menuState.pos, { type: 'paragraph' })
              .focus()
              .run();
          }}
        />
        <div
          draggable={true}
          onDragStart={(event) => {
            if (menuState.pos === undefined || !menuState.domNode) {
              return;
            }

            view.current.focus();
            view.current.dispatch(
              view.current.state.tr.setSelection(
                NodeSelection.create(view.current.state.doc, menuState.pos)
              )
            );

            const slice = view.current.state.selection.content();
            const { dom, text } = view.current.serializeForClipboard(slice);

            event.dataTransfer.clearData();
            event.dataTransfer.effectAllowed = 'copyMove';
            event.dataTransfer.setData('text/html', dom.innerHTML);
            event.dataTransfer.setData('text/plain', text);
            event.dataTransfer.setDragImage(menuState.domNode, 0, 0);

            view.current.dragging = { slice, move: true };
          }}
          onDragEnd={() => {
            view.current.dispatch(
              view.current.state.tr.setSelection(
                TextSelection.create(view.current.state.doc, 1)
              )
            );

            view.current.dom.blur();
          }}
        >
          <GripVertical className="size-4 cursor-pointer hover:text-foreground" />
        </div>
      </div>
    </FloatingPortal>
  );
};
