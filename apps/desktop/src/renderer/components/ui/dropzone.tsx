import { Upload } from 'lucide-react';
import React from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

interface DropzoneProps {
  text: string;
  children: React.ReactNode;
  onDrop: (files: File[]) => void;
}

const Dropzone = ({ text, children, onDrop }: DropzoneProps) => {
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: NativeTypes.FILE,
    drop: (item: { files: File[] }) => {
      onDrop(item.files);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });
  const divRef = React.useRef<HTMLDivElement>(null);
  const dropRef = drop(divRef);

  const isActive = canDrop && isOver;
  return (
    <div ref={dropRef as React.LegacyRef<HTMLDivElement>}>
      {isActive && (
        <div className="fixed bottom-0 left-0 right-0 top-0 z-50">
          <div className="absolute inset-0 flex items-center justify-center bg-gray-500 opacity-50 transition-all duration-100 ease-in-out">
            <div className="flex flex-col items-center justify-center gap-2 opacity-100">
              <Upload className="size-8 text-white" />
              <p className="text-xl font-bold text-white">{text}</p>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export { Dropzone };
