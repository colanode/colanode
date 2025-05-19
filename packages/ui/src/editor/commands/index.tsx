import { EditorCommand, EditorCommandProps } from '@colanode/client/types';
import { BlockquoteCommand } from '@colanode/ui/editor/commands/blockquote';
import { BulletListCommand } from '@colanode/ui/editor/commands/bullet-list';
import { CodeBlockCommand } from '@colanode/ui/editor/commands/code-block';
import { DatabaseCommand } from '@colanode/ui/editor/commands/database';
import { DividerCommand } from '@colanode/ui/editor/commands/divider';
import { FileCommand } from '@colanode/ui/editor/commands/file';
import { FolderCommand } from '@colanode/ui/editor/commands/folder';
import { Heading1Command } from '@colanode/ui/editor/commands/heading1';
import { Heading2Command } from '@colanode/ui/editor/commands/heading2';
import { Heading3Command } from '@colanode/ui/editor/commands/heading3';
import { OrderedListCommand } from '@colanode/ui/editor/commands/ordered-list';
import { PageCommand } from '@colanode/ui/editor/commands/page';
import { ParagraphCommand } from '@colanode/ui/editor/commands/paragraph';
import { TodoCommand } from '@colanode/ui/editor/commands/todo';

export type { EditorCommand, EditorCommandProps };

export {
  BlockquoteCommand,
  BulletListCommand,
  CodeBlockCommand,
  DividerCommand,
  FileCommand,
  FolderCommand,
  Heading1Command,
  Heading2Command,
  Heading3Command,
  OrderedListCommand,
  PageCommand,
  ParagraphCommand,
  TodoCommand,
  DatabaseCommand,
};
