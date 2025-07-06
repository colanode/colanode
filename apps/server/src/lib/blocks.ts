import {
  Block,
  IdType,
  generateId,
  generateFractionalIndex,
} from '@colanode/core';

export const generateWelcomePageBlocks = (
  pageId: string
): Record<string, Block> => {
  const headingBlock: Block = {
    id: generateId(IdType.Block),
    type: 'heading1',
    parentId: pageId,
    index: generateFractionalIndex(),
    content: [{ type: 'text', text: 'Welcome to the Colanode!' }],
  };

  const colanodeParagraphBlock: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: pageId,
    index: generateFractionalIndex(headingBlock.index),
    content: [
      {
        type: 'text',
        text: 'Colanode is an open-source and local-first collaboration workspace.',
      },
    ],
  };

  const startTypingParagraphBlock: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: pageId,
    index: generateFractionalIndex(colanodeParagraphBlock.index),
    content: [
      {
        type: 'text',
        text: 'You can click anywhere and start typing. Here are a few tips to get you started:',
      },
    ],
  };

  const taskListBlock: Block = {
    id: generateId(IdType.Block),
    type: 'taskList',
    parentId: pageId,
    index: generateFractionalIndex(startTypingParagraphBlock.index),
    content: [],
  };

  const task1Block: Block = {
    id: generateId(IdType.Block),
    type: 'taskItem',
    parentId: taskListBlock.id,
    index: generateFractionalIndex(),
    attrs: {
      checked: false,
    },
  };

  const task1ParagraphBlock: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: task1Block.id,
    index: generateFractionalIndex(),
    content: [
      {
        text: 'Type "/" to see the menu of possible content you can add - headings, paragraphs, blockquotes, todos etc.',
        type: 'text',
      },
    ],
  };

  const task2Block: Block = {
    id: generateId(IdType.Block),
    type: 'taskItem',
    parentId: taskListBlock.id,
    index: generateFractionalIndex(task1Block.index),
    attrs: {
      checked: false,
    },
  };

  const task2ParagraphBlock: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: task2Block.id,
    index: generateFractionalIndex(),
    content: [
      {
        text: 'Highlight any text and use the menu to style your text in different ',
        type: 'text',
      },
      {
        text: 'formats',
        type: 'text',
        marks: [
          {
            type: 'bold',
          },
          {
            type: 'italic',
          },
        ],
      },
      {
        text: ' or ',
        type: 'text',
      },
      {
        text: 'colors',
        type: 'text',
        marks: [
          {
            type: 'highlight',
            attrs: {
              highlight: 'blue',
            },
          },
        ],
      },
      {
        text: ' ',
        type: 'text',
      },
      {
        text: '(not this)',
        type: 'text',
        marks: [
          {
            type: 'strike',
          },
        ],
      },
    ],
  };

  const task3Block: Block = {
    id: generateId(IdType.Block),
    type: 'taskItem',
    parentId: taskListBlock.id,
    index: generateFractionalIndex(task2Block.index),
    attrs: {
      checked: false,
    },
  };

  const task3ParagraphBlock: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: task3Block.id,
    index: generateFractionalIndex(),
    content: [
      {
        text: 'Use the drag icon on the left to reorder the content',
        type: 'text',
      },
    ],
  };

  const task4Block: Block = {
    id: generateId(IdType.Block),
    type: 'taskItem',
    parentId: taskListBlock.id,
    index: generateFractionalIndex(task3Block.index),
    attrs: {
      checked: false,
    },
  };

  const task4ParagraphBlock: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: task4Block.id,
    index: generateFractionalIndex(),
    content: [
      {
        text: "Add subpages, subfolders or databases using the '/' menu",
        type: 'text',
      },
    ],
  };

  const databaseHeadingBlock: Block = {
    id: generateId(IdType.Block),
    type: 'heading2',
    parentId: pageId,
    index: generateFractionalIndex(taskListBlock.index),
    content: [{ type: 'text', text: 'What is a Database?' }],
  };

  const databaseParagraphBlock: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: pageId,
    index: generateFractionalIndex(databaseHeadingBlock.index),
    content: [
      {
        text: 'A database in Colanode is like a powerful spreadsheet that combines tables with rich content. You can use databases to organize and view your information in multiple ways - as tables, kanban boards, calendars, or galleries. Each row in the database is a full page that can contain any type of content, and columns act as properties that help you organize and filter your information.',
        type: 'text',
      },
    ],
  };

  const databaseParagraphBlock2: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: pageId,
    index: generateFractionalIndex(databaseParagraphBlock.index),
    content: [
      {
        text: 'You can create a database by using the "/" menu inside an existing page. You can also create a database by clicking the three dots button in the sidebar near the spaces menu.',
        type: 'text',
      },
    ],
  };

  const blockquoteBlock: Block = {
    id: generateId(IdType.Block),
    type: 'blockquote',
    parentId: pageId,
    index: generateFractionalIndex(databaseParagraphBlock2.index),
  };

  const blockquoteParagraphBlock: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: blockquoteBlock.id,
    index: generateFractionalIndex(),
    content: [
      {
        text: 'Every journey starts with a single step. Block by block, you can build your own world.',
        type: 'text',
      },
    ],
  };

  const followUsHeadingBlock: Block = {
    id: generateId(IdType.Block),
    type: 'heading2',
    parentId: pageId,
    index: generateFractionalIndex(blockquoteBlock.index),
    content: [{ type: 'text', text: 'Follow Us' }],
  };

  const followUsParagraphBlock: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: pageId,
    index: generateFractionalIndex(followUsHeadingBlock.index),
    content: [
      {
        text: 'Stay updated with our latest developments on ',
        type: 'text',
      },
      {
        text: 'X (Twitter)',
        type: 'text',
        marks: [
          {
            type: 'link',
            attrs: {
              rel: 'noopener noreferrer nofollow',
              href: 'https://x.com/colanode',
              target: '_blank',
            },
          },
        ],
      },
      {
        text: '. Join our open-source community and contribute your ideas on ',
        type: 'text',
      },
      {
        text: 'GitHub',
        type: 'text',
        marks: [
          {
            type: 'link',
            attrs: {
              rel: 'noopener noreferrer nofollow',
              href: 'https://github.com/colanode/colanode',
              target: '_blank',
            },
          },
        ],
      },
      {
        text: ' - we welcome all contributions!',
        type: 'text',
      },
    ],
  };

  const result: Record<string, Block> = {
    [headingBlock.id]: headingBlock,
    [colanodeParagraphBlock.id]: colanodeParagraphBlock,
    [startTypingParagraphBlock.id]: startTypingParagraphBlock,
    [taskListBlock.id]: taskListBlock,
    [task1Block.id]: task1Block,
    [task1ParagraphBlock.id]: task1ParagraphBlock,
    [task2Block.id]: task2Block,
    [task2ParagraphBlock.id]: task2ParagraphBlock,
    [task3Block.id]: task3Block,
    [task3ParagraphBlock.id]: task3ParagraphBlock,
    [task4Block.id]: task4Block,
    [task4ParagraphBlock.id]: task4ParagraphBlock,
    [databaseHeadingBlock.id]: databaseHeadingBlock,
    [databaseParagraphBlock.id]: databaseParagraphBlock,
    [databaseParagraphBlock2.id]: databaseParagraphBlock2,
    [blockquoteBlock.id]: blockquoteBlock,
    [blockquoteParagraphBlock.id]: blockquoteParagraphBlock,
    [followUsHeadingBlock.id]: followUsHeadingBlock,
    [followUsParagraphBlock.id]: followUsParagraphBlock,
  };

  return result;
};

export const generateInitialMessageBlocks = (
  messageId: string
): Record<string, Block> => {
  const messageBlock: Block = {
    id: generateId(IdType.Block),
    type: 'paragraph',
    parentId: messageId,
    index: generateFractionalIndex(),
    content: [
      {
        type: 'text',
        text: 'Welcome to the channel! This is the beginning of your conversation. Feel free to start discussing, sharing ideas, or asking questions.',
      },
    ],
  };

  return { [messageBlock.id]: messageBlock };
};
