import { HTML5Backend as ReactDndHTML5Backend } from 'react-dnd-html5-backend';

// We need to create a modified version of the HTML5Backend that ignores
// events that are part of the ProseMirror editor, because it intercepts
// them and causes issues with the drag and drop in the editor.

// For more information, see:
// https://github.com/react-dnd/react-dnd/issues/802

const shouldIgnoreTarget = (domNode: HTMLElement) => {
  return domNode.closest('.ProseMirror');
};

export const HTML5Backend = (...args: unknown[]) => {
  // @ts-expect-error - HTML5Backend is not typed
  const instance = new ReactDndHTML5Backend(...args);

  const listeners = [
    'handleTopDragStart',
    'handleTopDragStartCapture',
    'handleTopDragEndCapture',
    'handleTopDragEnter',
    'handleTopDragEnterCapture',
    'handleTopDragLeaveCapture',
    'handleTopDragOver',
    'handleTopDragOverCapture',
    'handleTopDrop',
    'handleTopDropCapture',
  ];
  listeners.forEach((name) => {
    const original = instance[name];
    instance[name] = (e: Event, ...extraArgs: unknown[]) => {
      if (!shouldIgnoreTarget(e.target as HTMLElement)) {
        original(e, ...extraArgs);
      }
    };
  });

  return instance;
};
