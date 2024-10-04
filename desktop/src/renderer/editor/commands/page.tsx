import { EditorCommand } from '@/types/editor';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';

const PageCommand: EditorCommand = {
  key: 'page',
  name: 'Page',
  description: 'Insert a nested page',
  keywords: ['page'],
  icon: 'draft-line',
  disabled: false,
  handler({ editor, range, context }) {
    if (context == null) {
      return;
    }

    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: NodeTypes.Page,
        attrs: {
          id: NeuronId.generate(NeuronId.Type.Page),
        },
      })
      .run();
  },
};

export { PageCommand };