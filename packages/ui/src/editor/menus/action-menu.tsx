import { useFloating, shift, offset, FloatingPortal } from '@floating-ui/react';
import { GripVertical, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
// @ts-expect-error - we can just ignore this for now
import { __serializeForClipboard } from '@tiptap/pm/view';
import { Editor } from '@tiptap/react';

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

      const coords = {
        left: Math.max(event.clientX, editorBounds.left),
        top: event.clientY,
      };

      const pos = view.current.posAtCoords(coords);
      if (!pos) {
        setMenuState({
          show: false,
        });
        return;
      }

      // Find the nearest block parent at the current horizontal position
      let currentPos = pos.pos;
      let pmNode = null;
      let domNode = null;
      let nodePos = -1;

      while (currentPos >= 0) {
        const node = view.current.state.doc.nodeAt(currentPos);

        if (
          !node ||
          !node.isBlock ||
          node.type.name === 'bulletList' ||
          node.type.name === 'orderedList' ||
          node.type.name === 'taskList'
        ) {
          currentPos--;
          continue;
        }

        const nodeDOM = view.current.nodeDOM(currentPos) as HTMLElement;
        const nodeDOMElement =
          nodeDOM instanceof HTMLElement
            ? nodeDOM
            : ((nodeDOM as Node)?.parentElement as HTMLElement);

        if (nodeDOMElement) {
          const nodeRect = nodeDOMElement.getBoundingClientRect();

          // Are we on the same horizontal axis (vertical range) as the mouse over?
          const verticallyAligned =
            event.clientY >= nodeRect.top && event.clientY <= nodeRect.bottom;

          if (verticallyAligned) {
            pmNode = node;
            domNode = nodeDOMElement;
            nodePos = currentPos;
          } else {
            break;
          }
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
          className="size-4 cursor-pointer hover:text-primary"
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
            const { dom, text } = __serializeForClipboard(view.current, slice);

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
          <GripVertical className="size-4 cursor-pointer hover:text-primary" />
        </div>
      </div>
    </FloatingPortal>
  );
};
