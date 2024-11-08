import { Resizable } from 're-resizable';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Separator } from '@/renderer/components/ui/separator';
import { Input } from '@/renderer/components/ui/input';
import { useView } from '@/renderer/contexts/view';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';
import { ArrowDownAz, ArrowDownZa, Filter, Type } from 'lucide-react';

export const TableViewNameHeader = () => {
  const view = useView();

  const canEditView = true;

  const [dropMonitor, dropRef] = useDrop({
    accept: 'table-field-header',
    drop: () => ({
      after: 'name',
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <Resizable
      defaultSize={{
        width: `${view.nameWidth}px`,
        height: '2rem',
      }}
      minWidth={100}
      maxWidth={500}
      size={{ width: `${view.nameWidth}px`, height: '2rem' }}
      enable={{
        bottom: false,
        bottomLeft: false,
        bottomRight: false,
        left: false,
        right: canEditView,
        top: false,
        topLeft: false,
        topRight: false,
      }}
      handleClasses={{
        right: 'opacity-0 hover:opacity-100 bg-blue-300',
      }}
      handleStyles={{
        right: {
          width: '3px',
          right: '-3px',
        },
      }}
      onResizeStop={(_, __, ref) => {
        const newWidth = ref.offsetWidth;
        view.resizeName(newWidth);
      }}
    >
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'flex h-8 w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm hover:bg-gray-50',
              dropMonitor.isOver && dropMonitor.canDrop
                ? 'border-r-2 border-blue-300'
                : 'border-r'
            )}
            ref={dropRef}
          >
            <Type className="size-4" />
            <p>Name</p>
          </div>
        </PopoverTrigger>
        <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
          <div className="p-1">
            <Input
              value={'Name'}
              onChange={(_) => {
                // setName(e.target.value);
                // updateName(e.target.value);
              }}
            />
          </div>
          <Separator />
          {true && (
            <>
              <div
                className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                onClick={() => {
                  // eventBus.publish({
                  //   __typename: 'AddSortEvent',
                  //   field: viewField.field,
                  //   viewId: view.id,
                  //   direction: 'ASC',
                  // });
                }}
              >
                <ArrowDownAz className="size-4" />
                <span>Sort ascending</span>
              </div>

              <div
                className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                onClick={() => {
                  // eventBus.publish({
                  //   __typename: 'AddSortEvent',
                  //   field: viewField.field,
                  //   viewId: view.id,
                  //   direction: 'DESC',
                  // });
                }}
              >
                <ArrowDownZa className="size-4" />
                <span>Sort descending</span>
              </div>
            </>
          )}
          <div className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100">
            <Filter className="size-4" />
            <span>Filter</span>
          </div>
        </PopoverContent>
      </Popover>
    </Resizable>
  );
};