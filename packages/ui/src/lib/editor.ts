export interface EditorColorOption {
  color: string;
  name: string;
  textClass: string;
  bgClass: string;
  bgHoverClass: string;
}

export const editorColors: EditorColorOption[] = [
  {
    name: 'Default',
    color: 'default',
    textClass: 'text-foreground',
    bgClass: '',
    bgHoverClass: 'hover:bg-gray-100 dark:hover:bg-gray-800',
  },
  {
    name: 'Gray',
    color: 'gray',
    textClass: 'text-gray-600 dark:text-gray-400',
    bgClass: 'bg-gray-100 dark:bg-gray-800',
    bgHoverClass: 'hover:bg-gray-200 dark:hover:bg-gray-700',
  },
  {
    name: 'Orange',
    color: 'orange',
    textClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-200 dark:bg-orange-900',
    bgHoverClass: 'hover:bg-orange-300 dark:hover:bg-orange-800',
  },
  {
    name: 'Yellow',
    color: 'yellow',
    textClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-200 dark:bg-yellow-900',
    bgHoverClass: 'hover:bg-yellow-300 dark:hover:bg-yellow-800',
  },
  {
    name: 'Green',
    color: 'green',
    textClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-200 dark:bg-green-900',
    bgHoverClass: 'hover:bg-green-300 dark:hover:bg-green-800',
  },
  {
    name: 'Blue',
    color: 'blue',
    textClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-200 dark:bg-blue-900',
    bgHoverClass: 'hover:bg-blue-300 dark:hover:bg-blue-800',
  },
  {
    name: 'Purple',
    color: 'purple',
    textClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-200 dark:bg-purple-900',
    bgHoverClass: 'hover:bg-purple-300 dark:hover:bg-purple-800',
  },
  {
    name: 'Pink',
    color: 'pink',
    textClass: 'text-pink-600 dark:text-pink-400',
    bgClass: 'bg-pink-200 dark:bg-pink-900',
    bgHoverClass: 'hover:bg-pink-300 dark:hover:bg-pink-800',
  },
  {
    name: 'Red',
    color: 'red',
    textClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-200 dark:bg-red-900',
    bgHoverClass: 'hover:bg-red-300 dark:hover:bg-red-800',
  },
];
