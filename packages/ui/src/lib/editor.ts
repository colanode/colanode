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
    textClass: 'text-black-600',
    bgClass: '',
    bgHoverClass: 'hover:bg-gray-100',
  },
  {
    name: 'Gray',
    color: 'gray',
    textClass: 'text-gray-600',
    bgClass: 'bg-gray-100',
    bgHoverClass: 'hover:bg-gray-200',
  },
  {
    name: 'Orange',
    color: 'orange',
    textClass: 'text-orange-600',
    bgClass: 'bg-orange-200',
    bgHoverClass: 'hover:bg-orange-300',
  },
  {
    name: 'Yellow',
    color: 'yellow',
    textClass: 'text-yellow-600',
    bgClass: 'bg-yellow-200',
    bgHoverClass: 'hover:bg-yellow-300',
  },
  {
    name: 'Green',
    color: 'green',
    textClass: 'text-green-600',
    bgClass: 'bg-green-200',
    bgHoverClass: 'hover:bg-green-300',
  },
  {
    name: 'Blue',
    color: 'blue',
    textClass: 'text-blue-600',
    bgClass: 'bg-blue-200',
    bgHoverClass: 'hover:bg-blue-300',
  },
  {
    name: 'Purple',
    color: 'purple',
    textClass: 'text-purple-600',
    bgClass: 'bg-purple-200',
    bgHoverClass: 'hover:bg-purple-300',
  },
  {
    name: 'Pink',
    color: 'pink',
    textClass: 'text-pink-600',
    bgClass: 'bg-pink-200',
    bgHoverClass: 'hover:bg-pink-300',
  },
  {
    name: 'Red',
    color: 'red',
    textClass: 'text-red-600',
    bgClass: 'bg-red-200',
    bgHoverClass: 'hover:bg-red-300',
  },
];
