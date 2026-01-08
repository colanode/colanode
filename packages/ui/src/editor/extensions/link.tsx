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

              let link: HTMLAnchorElement | null = null;

              if (event.target instanceof HTMLAnchorElement) {
                link = event.target;
              } else {
                let a = event.target as HTMLElement;
                const els = [];

                while (a.nodeName !== 'DIV') {
                  els.push(a);
                  a = a.parentNode as HTMLElement;
                }
                link = els.find(
                  (value) => value.nodeName === 'A'
                ) as HTMLAnchorElement;
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
