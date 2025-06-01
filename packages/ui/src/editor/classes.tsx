export const defaultClasses = {
  heading1: 'mb-1 mt-4 font-heading text-4xl font-bold',
  heading2: 'mb-px mt-3 font-heading text-2xl font-semibold tracking-tight',
  heading3: 'mb-px mt-2 font-heading text-xl font-semibold tracking-tight',
  paragraph: 'm-0 px-0 py-1',
  bulletList: 'm-0 ps-6 list-disc [&_ul]:list-[circle] [&_ul_ul]:list-[square]',
  orderedList: 'm-0 ps-6 list-decimal',
  listItem: 'ml-2',
  codeBlock:
    'overflow-x-auto rounded-md bg-muted px-3 py-2 my-1 font-mono text-sm leading-[normal] [tab-size:2]',
  codeBlockHeader:
    'flex flex-row items-center justify-between text-muted-foreground font-sans border-b pb-2 mb-2 text-xs',
  code: 'whitespace-pre-wrap rounded-md bg-muted px-[0.3em] py-[0.2em] font-mono text-sm',
  blockquote: 'p-2 my-1 border-l-4 border-gray-300 bg-gray-50',
  taskList: 'not-prose pl-2',
  taskItem: 'flex items-start my-1',
  link: 'font-medium underline underline-offset-4 cursor-pointer',
  table: 'border-collapse border border-gray-300 w-full',
  tableRow: 'min-w-full',
  tableHeader: 'border p-1 px-2 text-left font-semibold bg-gray-50',
  tableCell: 'border p-1 px-2',
  gif: 'max-h-72 my-1',
  emoji: 'max-h-5 max-w-5 h-5 w-5 px-0.5 mb-1 inline-block',
  dropcursor: 'text-primary-foreground bg-blue-500',
  mention:
    'inline-flex flex-row items-center gap-1 rounded-md bg-blue-50 px-0.5 py-0',
};
