import { useRef, useMemo } from 'react';

interface UseLongPressOptions {
  threshold?: number;
  onStart?: (event: MouseEvent | TouchEvent) => void;
  onFinish?: (event: MouseEvent | TouchEvent) => void;
  onCancel?: (event: MouseEvent | TouchEvent) => void;
}

interface UseLongPressCallback {
  (event: MouseEvent | TouchEvent): void;
}

const isRelevantEvent = (event: MouseEvent | TouchEvent): boolean => {
  return (
    event.type === 'mousedown' ||
    event.type === 'touchstart' ||
    event.type === 'mouseup' ||
    event.type === 'touchend' ||
    event.type === 'mouseleave'
  );
};

export const useLongPress = (
  callback: UseLongPressCallback,
  options: UseLongPressOptions = {}
) => {
  const { threshold = 400, onStart, onFinish, onCancel } = options;
  const isLongPressActive = useRef<boolean>(false);
  const isPressed = useRef<boolean>(false);
  const timerId = useRef<NodeJS.Timeout | null>(null);

  return useMemo(() => {
    const start = (event: MouseEvent | TouchEvent) => {
      if (!isRelevantEvent(event)) {
        return;
      }

      if (onStart) {
        onStart(event);
      }

      isPressed.current = true;
      timerId.current = setTimeout(() => {
        isLongPressActive.current = true;
        callback(event);
        if (onFinish) {
          onFinish(event);
        }
      }, threshold);
    };

    const cancel = (event: MouseEvent | TouchEvent) => {
      if (!isRelevantEvent(event)) {
        return;
      }

      if (isLongPressActive.current) {
        if (onFinish) {
          onFinish(event);
        }
      } else if (isPressed.current) {
        if (onCancel) {
          onCancel(event);
        }
      }

      isLongPressActive.current = false;
      isPressed.current = false;

      if (timerId.current) {
        window.clearTimeout(timerId.current);
      }
    };

    const mouseHandlers = {
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
    };

    const touchHandlers = {
      onTouchStart: start,
      onTouchEnd: cancel,
    };

    return {
      ...mouseHandlers,
      ...touchHandlers,
    };
  }, [callback, threshold, onCancel, onFinish, onStart]);
};
