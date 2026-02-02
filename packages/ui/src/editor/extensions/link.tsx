import { Link } from '@tiptap/extension-link';
import { Plugin, PluginKey } from '@tiptap/pm/state';

import { defaultClasses } from '@colanode/ui/editor/classes';

export const LinkMark = Link.extend({
  inclusive: false,
})
  .configure({
    autolink: true,
    enableClickSelection: false,
    HTMLAttributes: {
      class: defaultClasses.link,
    },
  })
  .extend({
    addProseMirrorPlugins() {
      const plugins = this.parent?.() || [];

      return [
        new Plugin({
          key: new PluginKey('handleRouterClickLink'),
          props: {
            handleClick: (_, __, event) => {
              // Don't handle clicks on links that are created and handled by Tanstack Router
              // Find the link element that is closest to the target - based on the original Tiptap link implementation

              let link: HTMLAnchorElement | null = null;

              if (event.target instanceof HTMLAnchorElement) {
                link = event.target;
              } else {
                const target = event.target as HTMLElement | null;
                if (!target) {
                  return false;
                }

                const root = this.editor.view.dom;

                // Tntentionally limit the lookup to the editor root.
                // Using tag names like DIV as boundaries breaks with custom NodeViews,
                link = target.closest<HTMLAnchorElement>('a');

                if (link && !root.contains(link)) {
                  link = null;
                }
              }

              if (!link) {
                return false;
              }

              const isDataRouterLink = link.dataset.routerLink === 'true';

              if (isDataRouterLink) {
                return true;
              }

              return false;
            },
          },
        }),
        ...plugins,
      ];
    },
  });
